import { Inter, JetBrains_Mono, Spectral } from 'next/font/google';

export const spectral = Spectral({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-spectral',
  preload: true,
});

export const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
  preload: false,
});

export const fontVariableClassName = [
  spectral.variable,
  inter.variable,
  jetbrainsMono.variable,
].join(' ');
