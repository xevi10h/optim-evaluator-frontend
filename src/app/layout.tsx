import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
	subsets: ['latin'],
	variable: '--font-inter',
});

export const metadata: Metadata = {
	title: "OptimEvaluator - Sistema d'Avaluació de Licitacions",
	description:
		"Plataforma d'avaluació automàtica de propostes de licitació per a l'Administració Pública utilitzant intel·ligència artificial",
	keywords: [
		'licitacions',
		'avaluació',
		'administració pública',
		'intel·ligència artificial',
		'propostes',
		'optim people',
	],
	authors: [{ name: 'Optim People' }],
	robots: 'index, follow',
	viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="es" className={inter.variable}>
			<body className="font-sans antialiased">{children}</body>
		</html>
	);
}
