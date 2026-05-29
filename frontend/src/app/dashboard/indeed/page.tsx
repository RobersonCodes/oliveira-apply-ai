'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Globe, Zap, Brain, MapPin, DollarSign, Clock, ExternalLink, Play, Filter } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface IndeedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  isRemote: boolean;
  isEasyApply: boolean;
  daysAgo: number;
  applyUrl: string;
  neuralScore?: number;
  neuralShouldApply?: boolean;
  platform: string;
}

const COUNTRIES = [
  { code: 'br', name: 'Brasil', flag: '🇧🇷' },
  { code: 'us', name: 'EUA', flag: '🇺🇸' },
  { code: 'uk', name: 'Reino Unido', flag: '🇬🇧' },
  { code: 'ca', name: 'Canadá', flag: '🇨🇦' },
  { code: 'au', name: 'Austrália', flag: '🇦🇺' },
  { code: 'de', name: 'Alemanha', flag: '🇩🇪' },
  { code: 'fr', name: 'França', flag: '🇫🇷' },
  { code: 'nl', name: 'Holanda', flag: '🇳🇱' },
  { code: 'pt', name: 'Portugal', flag: '🇵🇹' },
];

export default function IndeedPage() {
  const [keywords, setKeywords] = useState('');
  const [location, setLocation] = useState('');
  const [country, setCountry] = useState('br');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [datePosted, setDatePosted] = useState('7days');
  const [maxResults, setMaxResults] = useState(20);
  const [minScore, setMinScore] = useState(60);
  const [jobs, setJobs] = useState<IndeedJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [automating, setAutomating] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch() {
    if (!keywords) { toast.error('Digite palavras-chave'); return; }
    setLoading(true);
    setSearched(false);
    try {
      const { data } = await api.post('/indeed/search', { keywords, location, country, remoteOnly, datePosted, maxResults });
      setJobs(data.data);
      setSearched(true);
      toast.success(`${data.data.length} vagas encontradas!`);
    } catch {
      // Mock data para demo
      setJobs([
        { id: '1', title: 'Senior Backend Engineer', company: 'TechCorp', location: remoteOnly ? 'Remoto' : 'São Paulo, SP', isRemote: remoteOnly, isEasyApply: true, daysAgo: 1, applyUrl: '#', neuralScore: 92, neuralShouldApply: true, platform: 'INDEED' },
        { id: '2', title: 'Full Stack Developer', company: 'StartupXYZ', location: 'Remoto', isRemote: true, isEasyApply: true, daysAgo: 2, applyUrl: '#', neuralScore: 78, neuralShouldApply: true, platform: 'INDEED' },
        { id: '3', title: 'Node.js Developer', company: 'FinTech Co', location: 'Rio de Janeiro, RJ', isRemote: false, isEasyApply: false, daysAgo: 5, applyUrl: '#', neuralScore: 65, neuralShouldApply: false, platform: 'INDEED' },
        { id: '4', title: 'TypeScript Engineer', company: 'Global Inc', location: 'Remote', isRemote: true, isEasyApply: true, daysAgo: 0, applyUrl: '#', neuralScore: 88, neuralShouldApply: true, platform: 'INDEED' },
        { id: '5', title: 'React Developer', company: 'Agency BR', location: 'São Paulo, SP', isRemote: false, isEasyApply: true, daysAgo: 3, applyUrl: '#', neuralScore: 71, neuralShouldApply: true, platform: 'INDEED' },
      ]);
      setSearched(true);
      toast.success('5 vagas encontradas (modo demo)');
    } finally {
      setLoading(false);
    }
  }

  async function handleAutoApply() {
    if (!keywords) { toast.error('Configure a busca primeiro'); return; }
    setAutomating(true);
    try {
      await api.post('/indeed/start', { keywords, location, country, remoteOnly, maxApplications: maxResults, minNeuralScore: minScore, applyWithEasyApply: true });
      toast.success('Automação Indeed iniciada! Acompanhe em Candidaturas.');
    } catch {
      toast.error('Configure o backend para usar automação real');
    } finally {
      setAutomating(false);
    }
  }

  const filteredJobs = jobs.filter(j => (j.neuralScore || 0) >= minScore || !j.neuralScore);
  const highScoreJobs = jobs.filter(j => (j.neuralScore || 0) >= 70);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded bg-blue-500/20 flex items-center justify-center">
              <span className="text-xs font-bold text-blue-400">in</span>
            </div>
            <span className="text-sm text-blue-400 font-medium">Indeed Integration</span>
          </div>
          <h1 className="text-3xl font-bold gradient-text">Indeed — Global</h1>
          <p className="text-text-muted mt-1">Busca e candidatura automática em 9 países</p>
        </div>
        <div className="flex items-center gap-2">
          {COUNTRIES.map(c => (
            <button
              key={c.code}
              onClick={() => setCountry(c.code)}
              className={`text-xl p-1.5 rounded-lg transition-all ${country === c.code ? 'bg-brand-600/20 ring-2 ring-brand-500/40' : 'hover:bg-white/5'}`}
              title={c.name}
            >
              {c.flag}
            </button>
          ))}
        </div>
      </div>

      {/* Search Form */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Configurar Busca</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <label className="label">Palavras-chave</label>
            <input
              className="input-field"
              placeholder="Ex: Senior Backend Developer Node.js"
              value={keywords}
              onChange={e => setKeywords(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div>
            <label className="label">Localização</label>
            <input
              className="input-field"
              placeholder="São Paulo, Remote..."
              value={location}
              onChange={e => setLocation(e.target.value)}
            />
          </div>
          <div>
            <label className="label">País</label>
            <select className="input-field" value={country} onChange={e => setCountry(e.target.value)}>
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Postado há</label>
            <select className="input-field" value={datePosted} onChange={e => setDatePosted(e.target.value)}>
              <option value="today">Hoje</option>
              <option value="3days">3 dias</option>
              <option value="7days">7 dias</option>
              <option value="14days">14 dias</option>
            </select>
          </div>
          <div>
            <label className="label">Máx. resultados</label>
            <input type="number" className="input-field" value={maxResults} onChange={e => setMaxResults(Number(e.target.value))} min={5} max={50} />
          </div>
          <div>
            <label className="label">Score Neural mínimo</label>
            <input type="number" className="input-field" value={minScore} onChange={e => setMinScore(Number(e.target.value))} min={0} max={100} />
          </div>
          <div className="flex items-end gap-3">
            <button
              onClick={() => setRemoteOnly(!remoteOnly)}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${remoteOnly ? 'bg-brand-600' : 'bg-white/10'}`}
            >
              <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${remoteOnly ? 'translate-x-5' : ''}`} />
            </button>
            <span className="text-sm text-text-secondary">Remoto apenas</span>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
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
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">
              {filteredJobs.length} vagas encontradas
              <span className="text-sm text-text-muted ml-2">
                ({highScoreJobs.length} com score ≥70)
              </span>
            </h2>
          </div>

          <div className="space-y-3">
            {filteredJobs.map((job, i) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass rounded-xl p-5 hover:border-brand-500/20 transition-all glass-hover"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-text-primary">{job.title}</h3>
                      {job.isEasyApply && (
                        <span className="badge badge-success text-xs">⚡ Easy Apply</span>
                      )}
                      {job.isRemote && (
                        <span className="badge badge-info text-xs">🌐 Remoto</span>
                      )}
                    </div>
                    <p className="text-text-secondary text-sm">{job.company}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />{job.location}
                      </span>
                      {job.salary && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />{job.salary}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {job.daysAgo === 0 ? 'Hoje' : `${job.daysAgo}d atrás`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {job.neuralScore !== undefined && (
                      <div className="text-center">
                        <div className={`text-xl font-bold ${job.neuralScore >= 80 ? 'text-green-400' : job.neuralScore >= 60 ? 'text-brand-400' : 'text-yellow-400'}`}>
                          {job.neuralScore}
                        </div>
                        <div className="text-xs text-text-muted">Neural</div>
                      </div>
                    )}
                    <div className="flex flex-col gap-2">
                      <a href={job.applyUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs flex items-center gap-1 px-3 py-1.5">
                        <ExternalLink className="w-3 h-3" /> Ver vaga
                      </a>
                      {job.isEasyApply && (
                        <button className="btn-primary text-xs px-3 py-1.5">
                          Aplicar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {!searched && (
        <div className="glass rounded-2xl p-16 text-center">
          <Globe className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <p className="text-text-muted">Configure a busca e clique em Buscar Vagas</p>
          <p className="text-text-muted/60 text-sm mt-1">Busca em {COUNTRIES.length} países com score Neural</p>
        </div>
      )}
    </div>
  );
}
