'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Network, Calendar, MessageSquare, User, Building2, Loader2, ChevronRight, Copy, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

const DAY_COLORS: Record<number, string> = { 1: 'bg-brand-500', 3: 'bg-purple-500', 7: 'bg-blue-500', 10: 'bg-cyan-500', 14: 'bg-green-500' };

export default function ConexaoCirurgicaPage() {
  const [tab, setTab] = useState<'strategy' | 'comment'>('strategy');
  const [step, setStep] = useState<'form' | 'loading' | 'result'>('form');
  const [form, setForm] = useState({ company: '', jobTitle: '', hiringManager: '', recruiterName: '', jobDescription: '' });
  const [commentForm, setCommentForm] = useState({ postContent: '', tone: 'thoughtful' });
  const [result, setResult] = useState<any>(null);
  const [comment, setComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  async function handleStrategy() {
    if (!form.company || !form.jobTitle) { toast.error('Preencha empresa e cargo'); return; }
    setStep('loading');
    try {
      const { data } = await api.post('/conexao-cirurgica/strategy', form);
      setResult(data.data);
      setStep('result');
    } catch { toast.error('Erro ao gerar estratégia.'); setStep('form'); }
  }

  async function handleComment() {
    if (!commentForm.postContent) { toast.error('Cole o conteúdo do post'); return; }
    setCommentLoading(true);
    try {
      const { data } = await api.post('/conexao-cirurgica/comment', commentForm);
      setComment(data.data.comment ?? data.data);
    } catch { toast.error('Erro ao gerar comentário.'); }
    finally { setCommentLoading(false); }
  }

  function copyText(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    toast.success('Copiado!');
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
          <Network className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Conexão Cirúrgica</h1>
          <p className="text-white/50 text-sm mt-0.5">Sequência de 14 dias de networking estratégico antes de candidatar</p>
        </div>
        <span className="ml-auto badge-info text-xs">Pro</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[{ id: 'strategy', label: 'Estratégia 14 dias', icon: Calendar }, { id: 'comment', label: 'Gerar comentário', icon: MessageSquare }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === t.id ? 'bg-brand-600/20 text-brand-300 border border-brand-500/20' : 'text-white/40 hover:text-white/70 glass'}`}>
            <t.icon size={14} />{t.label}
          </button>
        ))}
      </div>

      {tab === 'strategy' && (
        <>
          {step === 'form' && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="glass rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Building2 size={14} className="text-brand-400" />Dados da oportunidade</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Empresa *</label>
                    <input className="input-field" placeholder="Ex: Nubank, iFood..." value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Cargo desejado *</label>
                    <input className="input-field" placeholder="Ex: Senior Backend Engineer..." value={form.jobTitle} onChange={e => setForm(p => ({ ...p, jobTitle: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Nome do Hiring Manager (opcional)</label>
                    <input className="input-field" placeholder="Ex: João Silva" value={form.hiringManager} onChange={e => setForm(p => ({ ...p, hiringManager: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Nome do Recrutador (opcional)</label>
                    <input className="input-field" placeholder="Ex: Maria Santos" value={form.recruiterName} onChange={e => setForm(p => ({ ...p, recruiterName: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="label">Descrição da vaga (opcional)</label>
                  <textarea rows={4} className="input-field resize-none" placeholder="Cole a descrição da vaga para uma estratégia mais personalizada..." value={form.jobDescription} onChange={e => setForm(p => ({ ...p, jobDescription: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end">
                <button onClick={handleStrategy} className="btn-primary gap-2"><Network size={16} />Gerar estratégia de 14 dias</button>
              </div>
            </motion.div>
          )}

          {step === 'loading' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-16 flex flex-col items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
              </div>
              <div className="text-center">
                <div className="text-white font-semibold text-lg">Criando plano de networking...</div>
                <div className="text-white/40 text-sm mt-1">Montando sequência de 14 dias personalizada</div>
              </div>
            </motion.div>
          )}

          {step === 'result' && result && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Summary */}
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-white/40 mb-1">Plano gerado para</div>
                    <div className="text-lg font-bold text-white">{result.company ?? form.company} — {result.jobTitle ?? form.jobTitle}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-white/40 mb-1">Ações planejadas</div>
                    <div className="text-2xl font-bold text-brand-300">{result.totalActions ?? result.actions?.length ?? result.steps?.length ?? 0}</div>
                  </div>
                </div>
                {result.objective && <p className="text-sm text-white/50 mt-3 border-t border-white/[0.06] pt-3">{result.objective}</p>}
              </div>

              {/* Timeline */}
              {(result.actions ?? result.steps)?.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-white px-1">Sequência de ações</h3>
                  {(result.actions ?? result.steps).map((action: any, i: number) => (
                    <div key={i} className="glass rounded-2xl p-5">
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-xl ${DAY_COLORS[action.day] ?? 'bg-brand-500'} flex items-center justify-center shrink-0`}>
                          <span className="text-white text-xs font-bold">D{action.day}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-white">{action.title ?? action.action}</span>
                            {action.platform && <span className="badge-info text-xs">{action.platform}</span>}
                          </div>
                          {action.description && <p className="text-sm text-white/60 mb-3">{action.description}</p>}

                          {action.template && (
                            <div className="relative bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
                              <p className="text-xs text-white/60 whitespace-pre-wrap leading-relaxed pr-8">{action.template}</p>
                              <button
                                onClick={() => copyText(action.template, `action-${i}`)}
                                className="absolute top-2 right-2 btn-ghost p-1.5 text-xs"
                              >
                                {copied === `action-${i}` ? <CheckCircle size={12} className="text-green-400" /> : <Copy size={12} />}
                              </button>
                            </div>
                          )}

                          {action.tips?.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {action.tips.map((t: string, j: number) => (
                                <div key={j} className="flex items-start gap-2 text-xs text-white/40">
                                  <ChevronRight size={11} className="text-brand-400 mt-0.5 shrink-0" />{t}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end">
                <button onClick={() => { setStep('form'); setResult(null); }} className="btn-secondary gap-2"><Network size={14} />Nova estratégia</button>
              </div>
            </motion.div>
          )}
        </>
      )}

      {tab === 'comment' && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="glass rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2"><MessageSquare size={14} className="text-brand-400" />Gerar comentário para post</h3>
            <div>
              <label className="label">Conteúdo do post *</label>
              <textarea rows={6} className="input-field resize-none" placeholder="Cole aqui o conteúdo do post do LinkedIn onde você quer comentar (do hiring manager ou recrutador)..." value={commentForm.postContent} onChange={e => setCommentForm(p => ({ ...p, postContent: e.target.value }))} />
            </div>
            <div>
              <label className="label">Tom do comentário</label>
              <select className="input-field" value={commentForm.tone} onChange={e => setCommentForm(p => ({ ...p, tone: e.target.value }))}>
                <option value="thoughtful">Reflexivo e analítico</option>
                <option value="enthusiastic">Entusiasmado e positivo</option>
                <option value="professional">Formal e profissional</option>
                <option value="curious">Curioso e questionador</option>
              </select>
            </div>
            <div className="flex justify-end">
              <button onClick={handleComment} disabled={commentLoading} className="btn-primary gap-2">
                {commentLoading ? <><Loader2 size={14} className="animate-spin" />Gerando...</> : <><MessageSquare size={14} />Gerar comentário</>}
              </button>
            </div>
          </div>

          {comment && (
            <div className="glass rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2"><User size={14} className="text-green-400" />Comentário gerado</h3>
                <button onClick={() => copyText(comment, 'comment')} className="btn-ghost text-xs flex items-center gap-1.5 px-3 py-1.5">
                  {copied === 'comment' ? <><CheckCircle size={12} className="text-green-400" />Copiado</> : <><Copy size={12} />Copiar</>}
                </button>
              </div>
              <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
                <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{comment}</p>
              </div>
              <p className="text-xs text-white/30">Personalize antes de publicar. Autenticidade é fundamental no networking.</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
