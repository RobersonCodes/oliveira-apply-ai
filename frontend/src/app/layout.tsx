import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: { default: 'Oliveira Apply AI', template: '%s · Oliveira Apply AI' },
  description: 'Plataforma SaaS premium de automação inteligente de candidaturas com IA.',
  keywords: ['automação', 'LinkedIn', 'candidaturas', 'IA', 'emprego', 'currículo'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(15,15,25,0.95)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#fff',
              backdropFilter: 'blur(16px)',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  );
}
