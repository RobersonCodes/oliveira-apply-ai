/**
 * Job Match Neural Model
 * 
 * Regressão logística online com:
 * - Pesos por feature aprendidos por usuário
 * - Decay temporal (candidaturas recentes pesam mais)
 * - Warm start com prior global
 * - Explicabilidade: top fatores positivos/negativos
 */

import { featuresToVector, FEATURE_NAMES, FEATURE_DIMENSIONS, JobFeatures } from './featureExtractor';

// Outcome → label numérico para treino
const OUTCOME_LABELS: Record<string, number> = {
  OFFER:      1.0,
  INTERVIEW:  0.85,
  VIEWED:     0.55,
  NO_RESPONSE: 0.2,
  REJECTED:   0.0,
  PENDING:    -1,  // ignorado no treino
};

// Prior global: pesos iniciais baseados em conhecimento de domínio
// (antes de qualquer dado do usuário)
const GLOBAL_PRIOR_WEIGHTS: number[] = [
  0.1,   // companySize
  0.05,  // companyType
  0.1,   // hasCompanyRating
  0.2,   // seniorityLevel — match de nível é importante
  0.3,   // isRemote — remoto aumenta chances
  0.2,   // isEasyApply — easy apply = mais concorrência, mas mais volume
  0.1,   // jobType
  0.15,  // salaryMin
  0.15,  // salaryMax
  0.1,   // hasSalary
  0.5,   // stackMatchScore — o mais importante a priori
  0.2,   // keywordDensity
  0.35,  // titleSimilarity
 -0.2,   // daysOpen — vagas antigas = pior
 -0.15,  // applicantCount — muitos candidatos = pior
 -0.3,   // appliedBefore — aplicou antes sem sucesso
 -0.5,   // rejectedBefore — rejeitado antes = evitar
  0.4,   // interviewedBefore — entrevistou antes = positivo
  0.0,   // platform — neutro inicialmente
];

const GLOBAL_PRIOR_BIAS = -0.1;

export interface ModelWeights {
  weights: number[];
  bias: number;
  version: number;
}

export interface PredictionResult {
  score: number;          // 0-100
  probability: number;    // 0-1
  confidence: number;     // 0-1 (baseado em nº de amostras)
  shouldApply: boolean;
  reasoning: {
    topPositive: Array<{ feature: string; impact: number; label: string }>;
    topNegative: Array<{ feature: string; impact: number; label: string }>;
    summary: string;
  };
}

export interface TrainingSample {
  features: JobFeatures;
  outcome: string;
  weight: number;  // peso temporal
  createdAt: Date;
}

const FEATURE_LABELS: Record<string, string> = {
  companySize: 'Porte da empresa',
  companyType: 'Tipo de empresa',
  hasCompanyRating: 'Avaliação da empresa',
  seniorityLevel: 'Nível de senioridade',
  isRemote: 'Trabalho remoto',
  isEasyApply: 'Easy Apply',
  jobType: 'Tipo de contrato',
  salaryMin: 'Salário mínimo',
  salaryMax: 'Salário máximo',
  hasSalary: 'Salário informado',
  stackMatchScore: 'Match de tecnologias',
  keywordDensity: 'Palavras-chave relevantes',
  titleSimilarity: 'Similaridade com cargo alvo',
  daysOpen: 'Vaga muito antiga',
  applicantCount: 'Muitos candidatos',
  appliedBefore: 'Já aplicou antes',
  rejectedBefore: 'Rejeitado nesta empresa',
  interviewedBefore: 'Entrevistou nesta empresa',
  platform: 'Plataforma',
};

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function dotProduct(a: number[], b: number[]): number {
  return a.reduce((sum, ai, i) => sum + ai * b[i], 0);
}

function temporalWeight(createdAt: Date, halfLifeDays = 60): number {
  const daysDiff = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
  return Math.exp(-Math.log(2) * daysDiff / halfLifeDays);
}

export class JobMatchNeuralModel {
  private weights: number[];
  private bias: number;
  private version: number;
  private totalSamples: number;

  constructor(saved?: ModelWeights, totalSamples = 0) {
    if (saved && saved.weights.length === FEATURE_DIMENSIONS) {
      this.weights = [...saved.weights];
      this.bias = saved.bias;
      this.version = saved.version;
    } else {
      // Warm start com prior global
      this.weights = [...GLOBAL_PRIOR_WEIGHTS];
      this.bias = GLOBAL_PRIOR_BIAS;
      this.version = 0;
    }
    this.totalSamples = totalSamples;
  }

  predict(features: JobFeatures, threshold = 70): PredictionResult {
    const vector = featuresToVector(features);
    const logit = dotProduct(this.weights, vector) + this.bias;
    const probability = sigmoid(logit);
    const score = Math.round(probability * 100);

    // Confidence aumenta com mais amostras (log scale, cap at 1)
    const confidence = Math.min(1, Math.log(1 + this.totalSamples) / Math.log(50));

    // Feature importance: peso * valor para esta amostra
    const impacts = this.weights.map((w, i) => ({
      feature: FEATURE_NAMES[i],
      impact: w * vector[i],
      label: FEATURE_LABELS[FEATURE_NAMES[i]] || FEATURE_NAMES[i],
      value: vector[i],
    }));

    const sorted = [...impacts].sort((a, b) => b.impact - a.impact);
    const topPositive = sorted.filter(f => f.impact > 0).slice(0, 3);
    const topNegative = sorted.filter(f => f.impact < 0).sort((a, b) => a.impact - b.impact).slice(0, 3);

    const summary = this.generateSummary(score, topPositive, topNegative, confidence);

    return {
      score,
      probability,
      confidence,
      shouldApply: score >= threshold,
      reasoning: { topPositive, topNegative, summary },
    };
  }

  trainOnline(samples: TrainingSample[], learningRate = 0.01): void {
    // Stochastic Gradient Descent com temporal weighting
    for (const sample of samples) {
      const label = OUTCOME_LABELS[sample.outcome];
      if (label < 0) continue; // pula PENDING

      const vector = featuresToVector(sample.features);
      const prediction = sigmoid(dotProduct(this.weights, vector) + this.bias);
      const error = label - prediction;
      const tWeight = temporalWeight(sample.createdAt);
      const effectiveLR = learningRate * sample.weight * tWeight;

      // Gradient descent step
      for (let i = 0; i < this.weights.length; i++) {
        this.weights[i] += effectiveLR * error * vector[i];
        // L2 regularization
        this.weights[i] *= (1 - learningRate * 0.001);
      }
      this.bias += effectiveLR * error;

      this.totalSamples++;
    }
    this.version++;
  }

  evaluate(samples: TrainingSample[]): { accuracy: number; auc: number } {
    const validSamples = samples.filter(s => OUTCOME_LABELS[s.outcome] >= 0);
    if (validSamples.length === 0) return { accuracy: 0, auc: 0 };

    let correct = 0;
    const predictions: Array<{ score: number; label: number }> = [];

    for (const sample of validSamples) {
      const label = OUTCOME_LABELS[sample.outcome] >= 0.5 ? 1 : 0;
      const result = this.predict(sample.features);
      const predicted = result.score >= 50 ? 1 : 0;
      if (predicted === label) correct++;
      predictions.push({ score: result.score, label });
    }

    // Simplified AUC (area under ROC curve)
    const pos = predictions.filter(p => p.label === 1);
    const neg = predictions.filter(p => p.label === 0);
    let concordant = 0;
    for (const p of pos) {
      for (const n of neg) {
        if (p.score > n.score) concordant++;
        else if (p.score === n.score) concordant += 0.5;
      }
    }
    const auc = pos.length && neg.length ? concordant / (pos.length * neg.length) : 0.5;

    return {
      accuracy: correct / validSamples.length,
      auc,
    };
  }

  getFeatureImportance(): Record<string, number> {
    return FEATURE_NAMES.reduce((acc, name, i) => {
      acc[name] = Math.abs(this.weights[i]);
      return acc;
    }, {} as Record<string, number>);
  }

  serialize(): ModelWeights {
    return {
      weights: [...this.weights],
      bias: this.bias,
      version: this.version,
    };
  }

  private generateSummary(
    score: number,
    positive: Array<{ label: string; impact: number }>,
    negative: Array<{ label: string; impact: number }>,
    confidence: number,
  ): string {
    const confidenceStr = confidence < 0.3
      ? 'Modelo ainda aprendendo (poucas candidaturas)'
      : confidence < 0.7
      ? 'Confiança moderada'
      : 'Alta confiança baseada no seu histórico';

    if (score >= 85) return `Excelente match! ${positive[0]?.label} é um fator chave. ${confidenceStr}.`;
    if (score >= 70) return `Bom match. ${positive[0]?.label} joga a favor${negative[0] ? `, mas ${negative[0].label} preocupa` : ''}. ${confidenceStr}.`;
    if (score >= 50) return `Match moderado. ${negative[0]?.label} reduz as chances. ${confidenceStr}.`;
    return `Score baixo. Principais problemas: ${negative.slice(0, 2).map(n => n.label).join(', ')}. ${confidenceStr}.`;
  }
}
