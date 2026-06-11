/**
 * Extrai texto de PDF no browser carregando pdfjs via CDN.
 * Evita problemas de bundling/SSR do Next.js com pdfjs-dist.
 */

const PDFJS_VERSION = '3.11.174'; // versão estável com suporte CJS
const CDN_BASE = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Falha ao carregar ${src}`));
    document.head.appendChild(s);
  });
}

export async function extractPdfText(file: File): Promise<string> {
  // Carrega pdfjs via CDN (só roda no browser, nunca no SSR)
  await loadScript(`${CDN_BASE}/pdf.min.js`);

  const pdfjsLib = (window as any).pdfjsLib;
  if (!pdfjsLib) throw new Error('pdfjs não carregou');

  pdfjsLib.GlobalWorkerOptions.workerSrc = `${CDN_BASE}/pdf.worker.min.js`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item: any) => item.str || '')
      .join(' ');
    pages.push(text);
  }

  return pages.join('\n').replace(/\s{2,}/g, ' ').trim();
}
