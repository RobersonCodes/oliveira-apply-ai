'use client';
import { useState } from 'react';
import {
  FileText, Upload, Sparkles, Download, Eye, RefreshCw,
  CheckCircle2, Loader2, Target, Zap, Copy, ChevronRight,
} from 'lucide-react';

const mockSkills = ['React', 'TypeScript', 'Next.js', 'Node.js', 'PostgreSQL', 'Docker', 'AWS', 'GraphQL'];

const mockJD = `Procuramos um Senior Frontend Engineer para liderar o desenvolvimento da nossa plataforma de pagamentos.

Requisitos:
- 5+ anos de experiência com React e TypeScript
- Experiência com Next.js e performance optimization
- Conhecimento em sistemas de design e componentização
- Experiência com testes (Jest, Testing Library)
- Habilidade com CI/CD e Docker

Diferenciais:
- Experiência com micro-frontends
- Conhecimento em GraphQL
- Background em fintech`;

const mockAdaptedResume = `OLIVEIRA SILVA
Senior Frontend Engineer | React & TypeScript Specialist
oliveira@email.com | github.com/oliveira | linkedin.com/in/oliveira

RESUMO PROFISSIONAL
Engenheiro Frontend com +6 anos de experiência construindo plataformas de alta performance e escala.
Especialista em React, TypeScript e Next.js com histórico comprovado em produtos fintech e e-commerce
que processam milhões de transações diárias.

EXPERIÊNCIA

Senior Frontend Engineer — TechCorp (2022–atual)
• Liderou migração de arquitetura monolítica para micro-frontends, reduzindo tempo de build em 65%
• Implementou sistema de design com 80+ componentes reutilizáveis em TypeScript + Storybook
• Otimizou Core Web Vitals atingindo LCP < 1.2s e CLS < 0.01 em produção
• Mentoreou equipe de 4 desenvolvedores junior/pleno

Frontend Engineer — StartupFinance (2020–2022)
• Desenvolveu dashboard de pagamentos processando R$50M+/mês com React + GraphQL
• Implementou suite de testes com 94% de cobertura usando Jest e Testing Library
• Configurou pipeline CI/CD com Docker e GitHub Actions reduzindo deploys de 2h para 8min

HABILIDADES TÉCNICAS
React · TypeScript · Next.js · GraphQL · Node.js · Docker · AWS · PostgreSQL
Jest · Testing Library · Micro-frontends · CI/CD · Git · Storybook

EDUCAÇÃO
Bacharelado em Ciência da Computação — USP (2018)`;

export default function ResumePage() {
  const [tab, setTab] = useState<'adapt' | 'generate'>('adapt');
  const [jd, setJd] = useState(mockJD);
  const [loading, setLoading] = useState(false);
  const [adapted, setAdapted] = useState(false);
  const [score, setScore] = useState(0);
  const [addedKw] = useState(['micro-frontends', 'fintech', 'Next.js', 'Testing Library', 'CI/CD', 'performance optimization']);

  const handleAdapt = async () => {
    setLoading(true);
    setAdapted(false);
    await new Promise(r => setTimeout(r, 2800));
    setScore(94);
    setAdapted(true);
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-white">Currículo IA</h1>
        <p className="text-white/50 text-sm mt-1">Adapte seu currículo automaticamente para cada vaga com GPT-4</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/[0.04] rounded-xl w-fit">
        {[
          { id: 'adapt', label: 'Adaptar para vaga', icon: Zap },
          { id: 'generate', label: 'Gerar do zero', icon: Sparkles },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30' : 'text-white/50 hover:text-white'
            }`}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Input */}
        <div className="space-y-4">
          {/* Resume Upload */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <FileText size={14} className="text-brand-400" /> Seu currículo atual
              </h3>
              <span className="badge-success text-[10px]">Carregado</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="w-9 h-9 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                <FileText size={16} className="text-brand-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-white">curriculo_oliveira_2024.pdf</div>
                <div className="text-xs text-white/40 mt-0.5">156 KB · Atualizado há 2 dias</div>
              </div>
              <button className="btn-ghost p-1.5 text-xs"><RefreshCw size={12} /></button>
            </div>
            <button className="w-full mt-3 border-dashed border-2 border-white/10 rounded-xl p-4 text-center text-xs text-white/40 hover:border-brand-500/30 hover:text-brand-400 transition-all flex items-center justify-center gap-2">
              <Upload size={12} /> Fazer upload de novo currículo
            </button>
          </div>

          {/* Skills detected */}
          <div className="glass rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Habilidades detectadas</h3>
            <div className="flex flex-wrap gap-2">
              {mockSkills.map(s => (
                <span key={s} className="badge-info text-[11px]">{s}</span>
              ))}
            </div>
          </div>

          {/* JD input */}
          <div className="glass rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Target size={14} className="text-purple-400" /> Descrição da vaga
            </h3>
            <textarea
              value={jd}
              onChange={e => setJd(e.target.value)}
              rows={10}
              className="input-field resize-none font-mono text-xs"
              placeholder="Cole aqui a descrição da vaga..."
            />
            <button
              onClick={handleAdapt}
              disabled={loading || !jd.trim()}
              className="btn-primary w-full mt-3 gap-2 justify-center"
            >
              {loading ? <><Loader2 size={14} className="animate-spin" /> Adaptando com IA...</> : <><Sparkles size={14} /> Adaptar currículo para esta vaga</>}
            </button>
          </div>
        </div>

        {/* Right: Result */}
        <div className="space-y-4">
          {adapted ? (
            <>
              {/* Score */}
              <div className="glass rounded-2xl p-5 border-emerald-500/20 bg-emerald-500/[0.03]">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white mb-1">Score de compatibilidade ATS</div>
                    <div className="text-xs text-white/40">GPT-4o analisou a vaga e otimizou seu currículo</div>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold text-emerald-400">{score}%</div>
                    <div className="text-xs text-emerald-400/70">Excelente match</div>
                  </div>
                </div>
                <div className="mt-3 h-1.5 bg-white/[0.06] rounded-full">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full" style={{ width: `${score}%` }} />
                </div>
              </div>

              {/* Added keywords */}
              <div className="glass rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400" /> Palavras-chave adicionadas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {addedKw.map(k => (
                    <span key={k} className="badge-success text-[11px]">+ {k}</span>
                  ))}
                </div>
              </div>

              {/* Adapted resume */}
              <div className="glass rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                  <h3 className="text-sm font-semibold text-white">Currículo adaptado</h3>
                  <div className="flex items-center gap-2">
                    <button className="btn-ghost p-2"><Copy size={13} /></button>
                    <button className="btn-ghost p-2"><Eye size={13} /></button>
                    <button className="btn-primary gap-2 text-xs px-3 py-1.5">
                      <Download size={12} /> Baixar PDF
                    </button>
                  </div>
                </div>
                <div className="p-5">
                  <pre className="text-xs text-white/70 font-mono whitespace-pre-wrap leading-relaxed overflow-auto max-h-80 scrollbar-none">
                    {mockAdaptedResume}
                  </pre>
                </div>
              </div>
            </>
          ) : (
            <div className="glass rounded-2xl h-full min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
              {loading ? (
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto">
                    <Loader2 size={24} className="text-brand-400 animate-spin" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white mb-1">Analisando vaga com IA...</div>
                    <div className="text-xs text-white/40">GPT-4o está adaptando seu currículo</div>
                  </div>
                  <div className="space-y-2 text-xs text-white/30 text-left max-w-xs mx-auto">
                    <div className="flex items-center gap-2"><CheckCircle2 size={10} className="text-emerald-400" /> Extraindo palavras-chave da vaga</div>
                    <div className="flex items-center gap-2"><Loader2 size={10} className="text-brand-400 animate-spin" /> Adaptando experiências relevantes</div>
                    <div className="flex items-center gap-2 opacity-40"><div className="w-2.5 h-2.5 rounded-full border border-white/20" /> Calculando ATS score</div>
                    <div className="flex items-center gap-2 opacity-40"><div className="w-2.5 h-2.5 rounded-full border border-white/20" /> Gerando PDF final</div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto">
                    <Sparkles size={24} className="text-white/30" />
                  </div>
                  <div className="text-sm text-white/50">Cole a descrição da vaga e clique em adaptar</div>
                  <div className="text-xs text-white/30">A IA vai reescrever seu currículo para maximizar o ATS score</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
