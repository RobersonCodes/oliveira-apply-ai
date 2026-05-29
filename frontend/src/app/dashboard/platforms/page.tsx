'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Brain, MapPin, DollarSign, Clock, ExternalLink, Globe, Filter, Zap, Star, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface UnifiedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  isRemote: boolean;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  skills: string[];
  applyUrl: string;
  platform: string;
  daysAgo: number;
  neuralScore?: number;
  neuralShouldApply?: boolean;
  neuralReasoning?: string;
}

const PLATFORMS = [
  { id: 'LINKEDIN', name: 'LinkedIn', flag: '💼', color: 'bg-blue-500/10 border-blue-500/30 text-blue-400' },
  { id: 'INDEED', name: 'Indeed', flag: '🔍', color: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' },
  { id: 'GEEKHUNTER', name: 'GeekHunter', flag: '🎯', color: 'bg-green-500/10 border-green-500/30 text-green-400' },
  { id: 'REMOTEOK', name: 'Remote OK', flag: '🌍', color: 'bg-purple-500/10 border-purple-500/30 text-purple-400' },
  { id: 'WEWORKREMOTELY', name: 'We Work Remotely', flag: '💻', color: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' },
  { id: 'WELLFOUND', name: 'Wellfound', flag: '🚀', color: 'bg-orange-500/10 border-orange-500/30 text-orange-400' },
  { id: 'GLASSDOOR', name: 'Glassdoor', flag: '⭐', color: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' },
  { id: 'CATHO', name: 'Catho', flag: '🇧🇷', color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' },
  { id: 'VAGAS', name: 'Vagas.com.br', flag: '🇧🇷', color: 'bg-red-500/10 border-red-500/30 text-red-400' },
];

const PLATFORM_COLORS: Record<string, string> = {
  LINKEDIN: 'badge-info',
  INDEED: 'badge-purple',
  GEEKHUNTER: 'badge-success',
  REMOTEOK: 'badge-warning',
  WEWORKREMOTELY: 'badge-info',
  WELLFOUND: 'badge-warning',
  GLASSDOOR: 'badge-warning',
  CATHO: 'badge-success',
  VAGAS: 'badge-danger',
};

export default function AllPlatformsPage() {
  const [keywords, setKeywords] = useState('');
  const [location, setLocation] = useState('');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['LINKEDIN', 'GEEKHUNTER', 'REMOTEOK', 'WEWORKREMOTELY']);
  const [minScore, setMinScore] = useState(60);
  const [maxPerPlatform, setMaxPerPlatform] = useState(10);
  const [jobs, setJobs] = useState<UnifiedJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [loadingPlatforms, setLoadingPlatforms] = useState<string[]>([]);
  const [byPlatform, setByPlatform] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [filterScore, setFilterScore] = useState(0);

  function togglePlatform(id: string) {
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id],
    );
  }

  function selectAll() { setSelectedPlatforms(PLATFORMS.map(p => p.id)); }
  function selectRemote() { setSelectedPlatforms(['REMOTEOK', 'WEWORKREMOTELY', 'WELLFOUND', 'LINKEDIN']); }
  function selectBR() { setSelectedPlatforms(['LINKEDIN', 'GEEKHUNTER', 'CATHO', 'VAGAS', 'INDEED']); }

  async function handleSearch() {
    if (!keywords) { toast.error('Digite palavras-chave'); return; }
    if (!selectedPlatforms.length) { toast.error('Selecione ao menos uma plataforma'); return; }

    setLoading(true);
    setSearched(false);
    setJobs([]);
    setLoadingPlatforms(selectedPlatforms);

    try {
      const { data } = await api.post('/platforms/search', {
        keywords, location, remoteOnly,
        platforms: selectedPlatforms,
        maxPerPlatform,
        minNeuralScore: minScore,
      });

      setJobs(data.data);
      setByPlatform(data.meta.byPlatform || {});
      setErrors(data.meta.errors || {});
      setSearched(true);
      toast.success(`${data.data.length} vagas encontradas em ${selectedPlatforms.length} plataformas!`);
    } catch {
      // Mock data
      const mockJobs: UnifiedJob[] = [
        { id: '1', title: 'Senior Backend Engineer', company: 'Nubank', location: 'Remote', isRemote: true, salaryMin: 16000, salaryMax: 22000, salaryCurrency: 'BRL', skills: ['Node.js', 'Kotlin', 'AWS'], applyUrl: '#', platform: 'LINKEDIN', daysAgo: 0, neuralScore: 94, neuralShouldApply: true, neuralReasoning: 'Excelente match de stack e empresa' },
        { id: '2', title: 'Full Stack Developer', company: 'Remote Startup', location: 'Worldwide', isRemote: true, salaryMin: 80000, salaryMax: 120000, salaryCurrency: 'USD', skills: ['React', 'Node.js', 'PostgreSQL'], applyUrl: '#', platform: 'REMOTEOK', daysAgo: 1, neuralScore: 88, neuralShouldApply: true, neuralReasoning: 'Alto match, salário em USD' },
        { id: '3', title: 'Node.js Engineer', company: 'GeekStartup', location: 'São Paulo, SP', isRemote: true, salaryMin: 12000, salaryMax: 18000, salaryCurrency: 'BRL', skills: ['Node.js', 'TypeScript', 'Docker'], applyUrl: '#', platform: 'GEEKHUNTER', daysAgo: 2, neuralScore: 85, neuralShouldApply: true, neuralReasoning: 'Boa compatibilidade técnica' },
        { id: '4', title: 'Backend Engineer', company: 'Series B Startup', location: 'Remote', isRemote: true, salaryMin: 100000, salaryMax: 150000, salaryCurrency: 'USD', skills: ['Go', 'Kubernetes', 'AWS'], applyUrl: '#', platform: 'WELLFOUND', daysAgo: 0, neuralScore: 76, neuralShouldApply: true, neuralReasoning: 'Match moderado — Go é diferencial' },
        { id: '5', title: 'TypeScript Developer', company: 'Remote Company', location: 'Remote — Americas', isRemote: true, salaryMin: 90000, salaryMax: 130000, salaryCurrency: 'USD', skills: ['TypeScript', 'React', 'AWS'], applyUrl: '#', platform: 'WEWORKREMOTELY', daysAgo: 3, neuralScore: 82, neuralShouldApply: true, neuralReasoning: 'Stack muito compatível' },
        { id: '6', title: 'Software Engineer', company: 'Big Corp', location: 'São Paulo, SP', isRemote: false, salaryMin: 8000, salaryMax: 12000, salaryCurrency: 'BRL', skills: ['Java', 'Spring Boot'], applyUrl: '#', platform: 'CATHO', daysAgo: 5, neuralScore: 45, neuralShouldApply: false, neuralReasoning: 'Stack diferente do histórico' },
      ];
      setJobs(mockJobs);
      setByPlatform({ LINKEDIN: 1, REMOTEOK: 1, GEEKHUNTER: 1, WELLFOUND: 1, WEWORKREMOTELY: 1, CATHO: 1 });
      setSearched(true);
      toast.success('6 vagas encontradas (modo demo)');
    } finally {
      setLoading(false);
      setLoadingPlatforms([]);
    }
  }

  const filteredJobs = filterScore > 0
    ? jobs.filter(j => (j.neuralScore || 0) >= filterScore)
    : jobs;

  const formatSalary = (job: UnifiedJob) => {
    if (!job.salaryMin && !job.salaryMax) return null;
    const curr = job.salaryCurrency === 'USD' ? '$' : 'R$';
    const format = (n: number) => job.salaryCurrency === 'USD'
      ? `${curr}${Math.round(n / 1000)}k`
      : `${curr}${n.toLocaleString('pt-BR')}`;
    if (job.salaryMin && job.salaryMax) return `${format(job.salaryMin)} — ${format(job.salaryMax)}`;
    if (job.salaryMin) return `${format(job.salaryMin)}+`;
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Globe className="w-5 h-5 text-brand-400" />
          <span className="text-sm text-brand-400 font-medium">Multi-Plataforma</span>
        </div>
        <h1 className="text-3xl font-bold gradient-text">Busca Global</h1>
        <p className="text-text-muted mt-1">Busca simultânea em 9 plataformas com ranking Neural</p>
      </div>

      {/* Platform Selector */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Plataformas</h2>
          <div className="flex gap-2">
            <button onClick={selectAll} className="btn-ghost text-xs">Todas</button>
            <button onClick={selectRemote} className="btn-ghost text-xs">🌍 Remotas</button>
            <button onClick={selectBR} className="btn-ghost text-xs">🇧🇷 Brasil</button>
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {PLATFORMS.map(p => (
            <button
              key={p.id}
              onClick={() => togglePlatform(p.id)}
              className={`p-3 rounded-xl border text-xs font-medium transition-all flex flex-col items-center gap-1 ${
                selectedPlatforms.includes(p.id)
                  ? p.color
                  : 'bg-white/3 border-white/10 text-text-muted hover:text-text-primary'
              }`}
            >
              <span className="text-lg">{p.flag}</span>
              <span className="text-center leading-tight">{p.name}</span>
              {byPlatform[p.id] !== undefined && (
                <span className="text-xs opacity-70">{byPlatform[p.id]} vagas</span>
              )}
              {errors[p.id] && <span className="text-xs text-red-400">❌</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Search Config */}
      <div className="glass rounded-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="md:col-span-2">
            <label className="label">Palavras-chave</label>
            <input
              className="input-field"
              placeholder="Ex: Senior Backend Node.js TypeScript"
              value={keywords}
              onChange={e => setKeywords(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div>
            <label className="label">Localização</label>
            <input className="input-field" placeholder="São Paulo, Remote..." value={location} onChange={e => setLocation(e.target.value)} />
          </div>
        </div>

        <div className="flex items-center gap-6 flex-wrap mb-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setRemoteOnly(!remoteOnly)} className={`relative w-10 h-5 rounded-full transition-colors ${remoteOnly ? 'bg-brand-600' : 'bg-white/10'}`}>
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${remoteOnly ? 'translate-x-5' : ''}`} />
            </button>
            <span className="text-sm text-text-secondary">Remoto</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-muted">Score mínimo:</span>
            <input type="number" className="input-field w-16 text-sm py-1" value={minScore} onChange={e => setMinScore(Number(e.target.value))} min={0} max={100} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-muted">Por plataforma:</span>
            <input type="number" className="input-field w-16 text-sm py-1" value={maxPerPlatform} onChange={e => setMaxPerPlatform(Number(e.target.value))} min={5} max={20} />
          </div>
        </div>

        <button onClick={handleSearch} disabled={loading} className="btn-primary flex items-center gap-2">
          {loading ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Buscando em {selectedPlatforms.length} plataformas...</>
          ) : (
            <><Search className="w-4 h-4" />Buscar em {selectedPlatforms.length} Plataformas</>
          )}
        </button>
      </div>

      {/* Results */}
      {searched && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total', value: jobs.length, icon: Globe, color: 'text-brand-400' },
              { label: 'Score ≥70', value: jobs.filter(j => (j.neuralScore || 0) >= 70).length, icon: Brain, color: 'text-green-400' },
              { label: 'Remotas', value: jobs.filter(j => j.isRemote).length, icon: TrendingUp, color: 'text-purple-400' },
              { label: 'USD', value: jobs.filter(j => j.salaryCurrency === 'USD' && j.salaryMin).length, icon: Star, color: 'text-yellow-400' },
            ].map(stat => (
              <div key={stat.label} className="glass rounded-xl p-4 flex items-center gap-3">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <div>
                  <div className="text-xl font-bold text-text-primary">{stat.value}</div>
                  <div className="text-xs text-text-muted">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Filter */}
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-text-muted" />
            <span className="text-sm text-text-muted">Filtrar por score:</span>
            {[0, 60, 70, 80, 90].map(score => (
              <button
                key={score}
                onClick={() => setFilterScore(score)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${filterScore === score ? 'bg-brand-600 text-white' : 'bg-white/5 text-text-muted hover:text-text-primary'}`}
              >
                {score === 0 ? 'Todos' : `≥${score}`}
              </button>
            ))}
          </div>

          {/* Job list */}
          <div className="space-y-3">
            {filteredJobs.map((job, i) => {
              const salary = formatSalary(job);
              const platformInfo = PLATFORMS.find(p => p.id === job.platform);
              return (
                <motion.div
                  key={`${job.platform}-${job.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="glass rounded-xl p-5 glass-hover"
                >
                  <div className="flex items-start gap-4">
                    {/* Neural Score */}
                    {job.neuralScore !== undefined && (
                      <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0 border ${
                        job.neuralScore >= 85 ? 'bg-green-500/10 border-green-500/20' :
                        job.neuralScore >= 70 ? 'bg-brand-500/10 border-brand-500/20' :
                        job.neuralScore >= 55 ? 'bg-yellow-500/10 border-yellow-500/20' :
                        'bg-red-500/10 border-red-500/20'
                      }`}>
                        <span className={`text-lg font-bold ${
                          job.neuralScore >= 85 ? 'text-green-400' :
                          job.neuralScore >= 70 ? 'text-brand-400' :
                          job.neuralScore >= 55 ? 'text-yellow-400' : 'text-red-400'
                        }`}>{job.neuralScore}</span>
                        <span className="text-xs text-text-muted">AI</span>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <h3 className="font-semibold text-text-primary">{job.title}</h3>
                          <p className="text-sm text-text-secondary">{job.company}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`badge text-xs ${PLATFORM_COLORS[job.platform] || 'badge-default'}`}>
                            {platformInfo?.flag} {platformInfo?.name || job.platform}
                          </span>
                          <a href={job.applyUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs flex items-center gap-1 px-3 py-1.5">
                            <ExternalLink className="w-3 h-3" /> Aplicar
                          </a>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-2 text-xs text-text-muted flex-wrap">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                        {salary && (
                          <span className={`flex items-center gap-1 font-medium ${job.salaryCurrency === 'USD' ? 'text-green-400' : 'text-emerald-400'}`}>
                            <DollarSign className="w-3 h-3" />{salary}
                            {job.salaryCurrency === 'USD' && <span className="text-xs opacity-70">USD/ano</span>}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />{job.daysAgo === 0 ? 'Hoje' : `${job.daysAgo}d atrás`}
                        </span>
                        {job.isRemote && <span className="badge badge-info text-xs">🌐 Remoto</span>}
                      </div>

                      {job.skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {job.skills.slice(0, 6).map(skill => (
                            <span key={skill} className="badge badge-default text-xs">{skill}</span>
                          ))}
                        </div>
                      )}

                      {job.neuralReasoning && (
                        <p className="text-xs text-text-muted mt-2 flex items-center gap-1">
                          <Brain className="w-3 h-3 text-brand-400 flex-shrink-0" />
                          {job.neuralReasoning}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {!searched && (
        <div className="glass rounded-2xl p-20 text-center">
          <div className="flex justify-center gap-2 text-3xl mb-4">
            {PLATFORMS.slice(0, 5).map(p => <span key={p.id}>{p.flag}</span>)}
          </div>
          <p className="text-text-muted text-lg">Configure a busca e encontre vagas em todas as plataformas de uma vez</p>
          <p className="text-text-muted/60 text-sm mt-2">Ranqueadas pelo seu Job Match Neural pessoal</p>
        </div>
      )}
    </div>
  );
}
