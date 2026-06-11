'use client';
import { useState, useEffect, useRef } from 'react';
import { FileText, Upload, Sparkles, Loader2, Target, Zap, Copy, Trash2, CheckCircle2, RefreshCw } from 'lucide-react';
import { resumeApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { extractPdfText } from '@/lib/extractPdfText';

export default function ResumePage() {
  const [tab, setTab] = useState<'adapt' | 'cover'>('adapt');
  const [resumes, setResumes] = useState<any[]>([]);
  const [selectedResume, setSelectedResume] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [pdfExtracting, setPdfExtracting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [jd, setJd] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [adapting, setAdapting] = useState(false);
  const [adapted, setAdapted] = useState<any>(null);
  const [coverLoading, setCoverLoading] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [manualResume, setManualResume] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadResumes() {
    setLoading(true);
    try {
      const { data } = await resumeApi.list();
      const list = data.data || [];
      setResumes(list);
      const def = list.find((r: any) => r.isDefault) || list[0];
      if (def) setSelectedResume(def);
    } catch { }
    finally { setLoading(false); }
  }

  useEffect(() => { loadResumes(); }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      // Extrai texto no browser antes de enviar ao backend
      let extractedText = '';
      if (file.type === 'application/pdf') {
        setPdfExtracting(true);
        try {
          extractedText = await extractPdfText(file);
          if (extractedText) {
            setManualResume(extractedText);
            toast.success('Texto extraído do PDF!');
          } else {
            toast('PDF sem texto selecionável — cole manualmente se necessário.', { icon: '⚠️' });
          }
        } catch {
          toast('Não foi possível extrair o PDF — cole o texto manualmente.', { icon: '⚠️' });
        } finally {
          setPdfExtracting(false);
        }
      }

      const fd = new FormData();
      fd.append('resume', file);
      fd.append('name', file.name.replace(/\.[^.]+$/, ''));
      if (extractedText) fd.append('rawText', extractedText);
      await resumeApi.upload(fd);
      toast.success('Currículo salvo!');
      await loadResumes();
    } catch {
      toast.error('Erro ao enviar currículo.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleDelete(id: string) {
    try {
      await resumeApi.delete(id);
      toast.success('Removido.');
      await loadResumes();
    } catch { toast.error('Erro ao remover.'); }
  }

  async function handleAdapt() {
    if (!jd.trim()) { toast.error('Cole a descrição da vaga'); return; }
    const hasManual = manualResume.trim().length > 0;
    const hasStoredText = selectedResume?.rawText && !selectedResume.rawText.startsWith('[PDF');
    if (!hasManual && !hasStoredText && !selectedResume?.id) {
      toast.error('Selecione ou cole seu currículo');
      return;
    }
    if (!hasManual && !hasStoredText && selectedResume?.id) {
      toast('⚠️ PDF sem texto extraído — cole o currículo manualmente para melhores resultados', { duration: 4000 });
    }

    setAdapting(true);
    setAdapted(null);
    try {
    const payload: any = { jobDescription: jd, jobTitle, company };
if (manualResume.trim()) payload.resumeContent = manualResume.trim();
if (selectedResume?.id && !manualResume.trim()) payload.resumeId = selectedResume.id;

      const { data } = await resumeApi.adapt(payload);
      setAdapted(data.adapted || data.data);
      toast.success('Currículo adaptado!');
      await loadResumes();
    } catch {
      toast.error('Erro ao adaptar. Verifique se há conteúdo no currículo.');
    } finally { setAdapting(false); }
  }

  async function handleCoverLetter() {
    if (!jd.trim()) { toast.error('Cole a descrição da vaga'); return; }
    const content = manualResume || selectedResume?.rawText;
    setCoverLoading(true);
    try {
      const { data } = await resumeApi.generateCoverLetter({ jobDescription: jd, jobTitle, company, resumeContent: content || '' });
      setCoverLetter(data.data.coverLetter);
    } catch { toast.error('Erro ao gerar carta.'); }
    finally { setCoverLoading(false); }
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-white">Currículo IA</h1>
        <p className="text-white/50 text-sm mt-1">Adapte seu currículo automaticamente para cada vaga com GPT-4</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/[0.04] rounded-xl w-fit">
        {[{ id: 'adapt', label: 'Adaptar para vaga', icon: Zap }, { id: 'cover', label: 'Carta de apresentação', icon: Sparkles }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30' : 'text-white/50 hover:text-white'}`}>
            <t.icon size={14} />{t.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left */}
        <div className="space-y-4">
          {/* Upload */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2"><FileText size={14} className="text-brand-400" />Seus currículos</h3>
              <button onClick={() => fileRef.current?.click()} disabled={uploading || pdfExtracting} className="btn-ghost text-xs flex items-center gap-1.5 px-2 py-1.5">
                {pdfExtracting ? <><Loader2 size={12} className="animate-spin" />Lendo PDF...</> : uploading ? <><Loader2 size={12} className="animate-spin" />Enviando...</> : <><Upload size={12} />Upload</>}
              </button>
              <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={handleUpload} />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-6"><Loader2 className="w-5 h-5 text-brand-400 animate-spin" /></div>
            ) : resumes.length === 0 ? (
              <button onClick={() => fileRef.current?.click()}
                className="w-full border-dashed border-2 border-white/10 rounded-xl p-6 text-center text-xs text-white/40 hover:border-brand-500/30 hover:text-brand-400 transition-all flex flex-col items-center gap-2">
                <Upload size={20} />Clique para enviar seu currículo (PDF, DOCX, TXT)
              </button>
            ) : (
              <div className="space-y-2">
                {resumes.slice(0, 5).map((r: any) => (
                  <div key={r.id} onClick={() => setSelectedResume(r)}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${selectedResume?.id === r.id ? 'border-brand-500/40 bg-brand-500/10' : 'border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.05]'}`}>
                    <FileText size={14} className={selectedResume?.id === r.id ? 'text-brand-400' : 'text-white/40'} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">{r.name}</div>
                      <div className="text-xs text-white/40 mt-0.5 flex items-center gap-2">
                        {new Date(r.createdAt).toLocaleDateString('pt-BR')}
                        {(!r.rawText || r.rawText.startsWith('[PDF')) && (
                          <span className="text-amber-400/80 text-[10px]">⚠ cole o texto</span>
                        )}
                      </div>
                    </div>
                    {r.isDefault && <span className="badge-success text-[10px]">Padrão</span>}
                    <button onClick={e => { e.stopPropagation(); handleDelete(r.id); }} className="btn-ghost p-1 text-white/30 hover:text-red-400">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                <button onClick={() => fileRef.current?.click()}
                  className="w-full border-dashed border border-white/10 rounded-xl p-3 text-center text-xs text-white/30 hover:border-brand-500/30 hover:text-brand-400 transition-all flex items-center justify-center gap-2">
                  <Upload size={11} />Enviar outro
                </button>
              </div>
            )}
          </div>

          {/* Manual text */}
          <div className="glass rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <FileText size={14} className="text-white/40" />Ou cole o texto do currículo
            </h3>
            <textarea rows={5} className="input-field resize-none text-xs font-mono" placeholder="Cole o texto completo do seu currículo aqui (opcional — use se o upload não funcionar)..."
              value={manualResume} onChange={e => setManualResume(e.target.value)} />
          </div>

          {/* JD */}
          <div className="glass rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Target size={14} className="text-purple-400" />Vaga</h3>
            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <div><label className="label">Cargo</label><input className="input-field" placeholder="Ex: Senior Backend Engineer" value={jobTitle} onChange={e => setJobTitle(e.target.value)} /></div>
              <div><label className="label">Empresa</label><input className="input-field" placeholder="Ex: Nubank" value={company} onChange={e => setCompany(e.target.value)} /></div>
            </div>
            <label className="label">Descrição da vaga *</label>
            <textarea rows={8} className="input-field resize-none font-mono text-xs" placeholder="Cole aqui a descrição completa da vaga..." value={jd} onChange={e => setJd(e.target.value)} />

            {tab === 'adapt' && (
              <button onClick={handleAdapt} disabled={adapting || !jd.trim()} className="btn-primary w-full mt-3 gap-2 justify-center">
                {adapting ? <><Loader2 size={14} className="animate-spin" />Adaptando com IA...</> : <><Sparkles size={14} />Adaptar currículo</>}
              </button>
            )}
            {tab === 'cover' && (
              <button onClick={handleCoverLetter} disabled={coverLoading || !jd.trim()} className="btn-primary w-full mt-3 gap-2 justify-center">
                {coverLoading ? <><Loader2 size={14} className="animate-spin" />Gerando...</> : <><Sparkles size={14} />Gerar carta de apresentação</>}
              </button>
            )}
          </div>
        </div>

        {/* Right — results */}
        <div className="space-y-4">
          {tab === 'adapt' && (
            <>
              {adapting && (
                <div className="glass rounded-2xl p-10 flex flex-col items-center gap-4 text-center">
                  <Loader2 size={32} className="text-brand-400 animate-spin" />
                  <div className="text-sm text-white/60">GPT-4 está adaptando seu currículo...</div>
                </div>
              )}
              {!adapting && adapted && (
                <>
                  {adapted.atsScore !== undefined && (
                    <div className="glass rounded-2xl p-5 border-emerald-500/20 bg-emerald-500/[0.03]">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold text-white mb-1">Score ATS</div>
                          <div className="text-xs text-white/40">Compatibilidade com sistemas de triagem</div>
                        </div>
                        <div className="text-4xl font-bold text-emerald-400">{Math.round(adapted.atsScore)}<span className="text-sm font-normal text-white/40">%</span></div>
                      </div>
                      <div className="mt-3 h-1.5 bg-white/[0.06] rounded-full">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(adapted.atsScore, 100)}%` }} />
                      </div>
                    </div>
                  )}
                  {adapted.improvements?.length > 0 && (
                    <div className="glass rounded-2xl p-5">
                      <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-400" />Melhorias aplicadas</h3>
                      <div className="space-y-2">
                        {adapted.improvements.map((imp: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-white/60">
                            <CheckCircle2 size={11} className="text-emerald-400 mt-0.5 shrink-0" />{imp}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {adapted.adaptedContent && (
                    <div className="glass rounded-2xl overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                        <h3 className="text-sm font-semibold text-white">Currículo adaptado</h3>
                        <button onClick={() => { navigator.clipboard.writeText(adapted.adaptedContent); toast.success('Copiado!'); }}
                          className="btn-ghost p-2 flex items-center gap-1.5 text-xs"><Copy size={13} />Copiar</button>
                      </div>
                      <div className="p-5">
                        <pre className="text-xs text-white/70 font-mono whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto scrollbar-none">{adapted.adaptedContent}</pre>
                      </div>
                    </div>
                  )}
                </>
              )}
              {!adapting && !adapted && (
                <div className="glass rounded-2xl h-full min-h-[300px] flex flex-col items-center justify-center p-8 text-center">
                  <Sparkles size={32} className="text-white/20 mb-3" />
                  <div className="text-sm text-white/40">Cole a descrição da vaga e clique em adaptar</div>
                </div>
              )}
            </>
          )}

          {tab === 'cover' && (
            <>
              {coverLoading && (
                <div className="glass rounded-2xl p-10 flex flex-col items-center gap-4 text-center">
                  <Loader2 size={32} className="text-brand-400 animate-spin" />
                  <div className="text-sm text-white/60">Gerando carta personalizada...</div>
                </div>
              )}
              {!coverLoading && coverLetter && (
                <div className="glass rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                    <h3 className="text-sm font-semibold text-white">Carta de apresentação</h3>
                    <button onClick={() => { navigator.clipboard.writeText(coverLetter); toast.success('Copiado!'); }}
                      className="btn-ghost p-2 flex items-center gap-1.5 text-xs"><Copy size={13} />Copiar</button>
                  </div>
                  <div className="p-5">
                    <pre className="text-sm text-white/70 whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto scrollbar-none">{coverLetter}</pre>
                  </div>
                </div>
              )}
              {!coverLoading && !coverLetter && (
                <div className="glass rounded-2xl h-full min-h-[300px] flex flex-col items-center justify-center p-8 text-center">
                  <Sparkles size={32} className="text-white/20 mb-3" />
                  <div className="text-sm text-white/40">Preencha os dados da vaga e clique em gerar</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
