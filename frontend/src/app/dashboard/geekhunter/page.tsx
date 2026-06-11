'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Zap, Brain, MapPin, DollarSign, Clock, ExternalLink, Play, X, Check } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface GeekJob {
  id: number;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  isRemote: boolean;
  salaryMin?: number;
  salaryMax?: number;
  skills: string[];
  seniorityLevel: string;
  daysAgo: number;
  applyUrl: string;
  neuralScore?: number;
  neuralShouldApply?: boolean;
  neuralReasoning?: string;
  benefits?: string[];
  companySegment?: string;
}

const SKILL_CATEGORIES = {
  backend: ['Node.js', 'Python', 'Go', 'Java', 'Rust', 'C#'],
  frontend: ['React', 'Vue.js', 'TypeScript', 'Next.js', 'Angular'],
  mobile: ['React Native', 'Flutter', 'Swift', 'Kotlin'],
  devops: ['Docker', 'Kubernetes', 'AWS', 'GCP', 'Terraform'],
  data: ['Python', 'SQL', 'Spark', 'dbt', 'Kafka'],
};

const SENIORITY_OPTIONS = [
  { value: 'INTERN', label: 'Estágio' },
  { value: 'JUNIOR', label: 'Júnior' },
  { value: 'MID', label: 'Pleno' },
  { value: 'SENIOR', label: 'Sênior' },
  { value: 'LEAD', label: 'Especialista' },
];

export default function GeekHunterPage() {
  const [keywords, setKeywords] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [remoteOnly, setRemoteOnly] = useState(true);
  const [salaryMin, setSalaryMin] = useState('');
  const [seniorityLevels, setSeniorityLevels] = useState<string[]>(['SENIOR', 'MID']);
  const [maxResults, setMaxResults] = useState(20);
  const [minScore, setMinScore] = useState(65);
  const [jobs, setJobs] = useState<GeekJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [automating, setAutomating] = useState(false);
  const [searched, setSearched] = useState(false);
  const [activeSkillTab, setActiveSkillTab] = useState<keyof typeof SKILL_CATEGORIES>('backend');

  function toggleSkill(skill: string) {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill],
    );
  }

  function toggleSeniority(level: string) {
    setSeniorityLevels(prev =>
      prev.includes(level) ? prev.filter(s => s !== level) : [...prev, level],
    );
  }

  async function handleSearch() {
    setLoading(true);
    setSearched(false);
    try {
      const { data } = await api.post('/geekhunter/search', {
        keywords, skills: selectedSkills, remoteOnly,
        salaryMin: salaryMin ? Number(salaryMin) : undefined,
        seniorityLevels, maxResults,
      });
      setJobs(data.data);
      setSearched(true);
      toast.success(`${data.data.length} vagas encontradas!`);
    } catch {
      // Mock data
      setJobs([
        { id: 1, title: 'Senior Node.js Developer', company: 'Fintech Startup', location: 'Remoto', isRemote: true, salaryMin: 12000, salaryMax: 18000, skills: ['Node.js', 'TypeScript', 'PostgreSQL'], seniorityLevel: 'SENIOR', daysAgo: 1, applyUrl: '#', neuralScore: 91, neuralShouldApply: true, neuralReasoning: 'Excelente match de stack', benefits: ['VR', 'VA', 'Plano de saúde', 'Stock options'] },
        { id: 2, title: 'Full Stack React/Node', company: 'Scale-up BR', location: 'São Paulo, SP', isRemote: true, salaryMin: 10000, salaryMax: 15000, skills: ['React', 'Node.js', 'AWS'], seniorityLevel: 'MID', daysAgo: 2, applyUrl: '#', neuralScore: 84, neuralShouldApply: true, neuralReasoning: 'Boa compatibilidade', benefits: ['VR', 'VA', 'Home office'] },
        { id: 3, title: 'Backend Engineer Go', company: 'Tech Company', location: 'Remoto', isRemote: true, salaryMin: 14000, salaryMax: 20000, skills: ['Go', 'Kubernetes', 'GCP'], seniorityLevel: 'SENIOR', daysAgo: 0, applyUrl: '#', neuralScore: 72, neuralShouldApply: true, neuralReasoning: 'Match moderado — Go não está no perfil', benefits: ['Equity', 'Saúde', 'Odonto'] },
        { id: 4, title: 'Python Data Engineer', company: 'DataCo', location: 'Remoto', isRemote: true, salaryMin: 11000, salaryMax: 16000, skills: ['Python', 'Spark', 'dbt'], seniorityLevel: 'MID', daysAgo: 3, applyUrl: '#', neuralScore: 58, neuralShouldApply: false, neuralReasoning: 'Stack diferente do histórico', benefits: ['VR', 'Saúde'] },
      ]);
      setSearched(true);
      toast.success('4 vagas encontradas (modo demo)');
    } finally {
      setLoading(false);
    }
  }

  async function handleAutoApply() {
    setAutomating(true);
    try {
      await api.post('/geekhunter/start', {
        keywords, skills: selectedSkills, remoteOnly, seniorityLevels,
        maxApplications: maxResults, minNeuralScore: minScore,
      });
      toast.success('Automação GeekHunter iniciada!');
    } catch {
      toast.error('Configure o backend para usar automação real');
    } finally {
      setAutomating(false);
    }
  }

  const highScoreJobs = jobs.filter(j => (j.neuralScore || 0) >= minScore);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded bg-green-500/20 flex items-center justify-center">
              <span className="text-xs font-bold text-green-400">GH</span>
            </div>
            <span className="text-sm text-green-400 font-medium">GeekHunter</span>
            <span className="badge badge-success text-xs">API Oficial</span>
          </div>
          <h1 className="text-3xl font-bold gradient-text">GeekHunter — Dev BR</h1>
          <p className="text-text-muted mt-1">Melhor plataforma para desenvolvedores no Brasil</p>
        </div>
      </div>

      {/* Config */}
      <div className="glass rounded-2xl p-6 space-y-6">
        <h2 className="text-lg font-semibold text-text-primary">Configurar Busca</h2>

        {/* Keywords */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="label">Palavras-chave</label>
            <input className="input-field" placeholder="Ex: Senior Backend Developer" value={keywords} onChange={e => setKeywords(e.target.value)} />
          </div>
          <div>
            <label className="label">Salário mínimo (R$)</label>
            <input className="input-field" type="number" placeholder="10000" value={salaryMin} onChange={e => setSalaryMin(e.target.value)} />
          </div>
        </div>

        {/* Skills */}
        <div>
          <label className="label">Skills</label>
          <div className="flex gap-2 mb-3 flex-wrap">
            {(Object.keys(SKILL_CATEGORIES) as Array<keyof typeof SKILL_CATEGORIES>).map(cat => (
              <button
                key={cat}
                onClick={() => setActiveSkillTab(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all capitalize ${activeSkillTab === cat ? 'bg-brand-600 text-white' : 'bg-white/5 text-text-muted hover:text-text-primary'}`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {SKILL_CATEGORIES[activeSkillTab].map(skill => (
              <button
                key={skill}
                onClick={() => toggleSkill(skill)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1.5 ${selectedSkills.includes(skill) ? 'bg-brand-600/20 border border-brand-500/40 text-brand-300' : 'bg-white/5 border border-white/10 text-text-muted hover:text-text-primary'}`}
              >
                {selectedSkills.includes(skill) && <Check className="w-3 h-3" />}
                {skill}
              </button>
            ))}
          </div>
          {selectedSkills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {selectedSkills.map(skill => (
                <span key={skill} className="badge badge-purple text-xs flex items-center gap-1">
                  {skill}
                  <button onClick={() => toggleSkill(skill)}><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Seniority */}
        <div>
          <label className="label">Nível</label>
          <div className="flex gap-2 flex-wrap">
            {SENIORITY_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => toggleSeniority(opt.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${seniorityLevels.includes(opt.value) ? 'bg-brand-600 text-white' : 'bg-white/5 text-text-muted hover:text-text-primary'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-3">
            <button onClick={() => setRemoteOnly(!remoteOnly)} className={`relative w-11 h-6 rounded-full transition-colors ${remoteOnly ? 'bg-brand-600' : 'bg-white/10'}`}>
              <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${remoteOnly ? 'translate-x-5' : ''}`} />
            </button>
            <span className="text-sm text-text-secondary">Remoto apenas</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-muted">Score mínimo:</span>
            <input type="number" className="input-field w-20 text-sm py-1" value={minScore} onChange={e => setMinScore(Number(e.target.value))} min={0} max={100} />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-muted">Máx. vagas:</span>
            <input type="number" className="input-field w-20 text-sm py-1" value={maxResults} onChange={e => setMaxResults(Number(e.target.value))} min={5} max={50} />
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={handleSearch} disabled={loading} className="btn-primary flex items-center gap-2">
            <Search className={`w-4 h-4 ${loading ? 'animate-pulse' : ''}`} />
            {loading ? 'Buscando...' : 'Buscar Vagas'}
          </button>
          <button onClick={handleAutoApply} disabled={automating || !searched} className="btn-secondary flex items-center gap-2">
            <Play className={`w-4 h-4 ${automating ? 'animate-pulse' : ''}`} />
            {automating ? 'Iniciando...' : `Auto Apply (${highScoreJobs.length} vagas)`}
          </button>
        </div>
      </div>

      {/* Results */}
      {searched && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">
              {jobs.length} vagas encontradas
              <span className="text-sm text-text-muted ml-2">({highScoreJobs.length} acima do score mínimo)</span>
            </h2>
          </div>

          {jobs.map((job, i) => (
            <motion.div key={job.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass rounded-xl p-5 glass-hover"
            >
              <div className="flex items-start gap-4">
                {/* Score */}
                {job.neuralScore !== undefined && (
                  <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${job.neuralScore >= 80 ? 'bg-green-500/10 border border-green-500/20' : job.neuralScore >= 60 ? 'bg-brand-500/10 border border-brand-500/20' : 'bg-yellow-500/10 border border-yellow-500/20'}`}>
                    <span className={`text-xl font-bold ${job.neuralScore >= 80 ? 'text-green-400' : job.neuralScore >= 60 ? 'text-brand-400' : 'text-yellow-400'}`}>
                      {job.neuralScore}
                    </span>
                    <span className="text-xs text-text-muted">score</span>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-text-primary">{job.title}</h3>
                      <p className="text-sm text-text-secondary">{job.company}</p>
                    </div>
                    <a href={job.applyUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs flex items-center gap-1 px-3 py-1.5 flex-shrink-0">
                      <ExternalLink className="w-3 h-3" /> Ver
                    </a>
                  </div>

                  <div className="flex items-center gap-4 mt-2 text-xs text-text-muted flex-wrap">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                    {(job.salaryMin || job.salaryMax) && (
                      <span className="flex items-center gap-1 text-green-400">
                        <DollarSign className="w-3 h-3" />
                        R${job.salaryMin?.toLocaleString('pt-BR')}
                        {job.salaryMax && ` — R$${job.salaryMax?.toLocaleString('pt-BR')}`}
                      </span>
                    )}
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{job.daysAgo === 0 ? 'Hoje' : `${job.daysAgo}d atrás`}</span>
                    {job.isRemote && <span className="badge badge-info">🌐 Remoto</span>}
                  </div>

                  {job.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {job.skills.slice(0, 6).map(skill => (
                        <span key={skill} className={`badge text-xs ${selectedSkills.includes(skill) ? 'badge-success' : 'badge-default'}`}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  {job.neuralReasoning && (
                    <p className="text-xs text-text-muted mt-2 flex items-center gap-1">
                      <Brain className="w-3 h-3 text-brand-400" />
                      {job.neuralReasoning}
                    </p>
                  )}

                  {job.benefits && job.benefits.length > 0 && (
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {job.benefits.map(b => (
                        <span key={b} className="text-xs text-text-muted bg-white/5 px-2 py-0.5 rounded-full">{b}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {!searched && (
        <div className="glass rounded-2xl p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-green-400">GH</span>
          </div>
          <p className="text-text-muted">Configure as skills e clique em Buscar</p>
          <p className="text-text-muted/60 text-sm mt-1">GeekHunter é o maior portal de devs do Brasil</p>
        </div>
      )}
    </div>
  );
}
