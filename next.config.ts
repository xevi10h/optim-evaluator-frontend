// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	webpack: (config, { isServer, dev }) => {
		// Configuraciones solo para el cliente
		if (!isServer) {
			// Configuración para PDF.js y librerías problemáticas
			config.resolve.fallback = {
				...config.resolve.fallback,
				fs: false,
				path: false,
				canvas: false,
				encoding: false,
			};

			// Ignorar warnings de PDF.js y librerías similares
			config.ignoreWarnings = [
				{ module: /node_modules\/pdfjs-dist/ },
				{ message: /Failed to parse source map/ },
				{ message: /Critical dependency/ },
			];

			// Optimizaciones para PDF.js
			config.module.rules.push({
				test: /pdf\.worker\.(min\.)?js/,
				type: 'asset/resource',
				generator: {
					filename: 'static/worker/[hash][ext][query]',
				},
			});

			// Configurar aliases para evitar problemas de importación
			config.resolve.alias = {
				...config.resolve.alias,
				'pdfjs-dist/build/pdf.worker.js': 'pdfjs-dist/build/pdf.worker.min.js',
			};
		}

		// Optimizaciones para librerías externas
		config.externals = config.externals || [];
		if (!isServer) {
			config.externals.push({
				'utf-8-validate': 'commonjs utf-8-validate',
				bufferutil: 'commonjs bufferutil',
			});
		}

		return config;
	},

	// Headers para mejor compatibilidad con workers y recursos externos
	async headers() {
		return [
			{
				source: '/(.*)',
				headers: [
					{
						key: 'Cross-Origin-Embedder-Policy',
						value: 'credentialless',
					},
					{
						key: 'Cross-Origin-Opener-Policy',
						value: 'same-origin',
					},
					{
						key: 'Cross-Origin-Resource-Policy',
						value: 'cross-origin',
					},
				],
			},
			{
				source: '/api/(.*)',
				headers: [
					{
						key: 'Access-Control-Allow-Origin',
						value: '*',
					},
					{
						key: 'Access-Control-Allow-Methods',
						value: 'GET, POST, PUT, DELETE, OPTIONS',
					},
					{
						key: 'Access-Control-Allow-Headers',
						value: 'Content-Type, Authorization',
					},
				],
			},
		];
	},

	// Configuración experimental para mejor performance
	experimental: {
		optimizePackageImports: ['lucide-react', 'pdfjs-dist'],
	},

	// Configurar transpilación de librerías problemáticas
	transpilePackages: ['pdfjs-dist'],

	// Configuración de imágenes si necesitas
	images: {
		domains: ['cdnjs.cloudflare.com'],
	},
};

export default nextConfig;
