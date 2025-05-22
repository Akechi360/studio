
import type { Metadata } from 'next';
import { Inter, Roboto_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { Toaster } from '@/components/ui/toaster';
import { APP_NAME } from '@/lib/constants';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const robotoMono = Roboto_Mono({
  variable: '--font-roboto-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: 'Gestión Eficiente de Tickets de Soporte y Soluciones Administrativas',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} ${robotoMono.variable} antialiased`}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
