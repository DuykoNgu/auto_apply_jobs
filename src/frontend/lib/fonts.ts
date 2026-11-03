import { Inter, Noto_Serif } from 'next/font/google';

export const inter = Inter({ subsets: ['latin', 'vietnamese'], weight: ['200', '300', '400', '500', '600'], variable: '--font-inter', display: 'swap' });
export const notoSerif = Noto_Serif({ subsets: ['latin', 'vietnamese'], weight: ['400', '600'], variable: '--font-noto-serif', display: 'swap' });
export const fontVars = `${inter.variable} ${notoSerif.variable}`;
