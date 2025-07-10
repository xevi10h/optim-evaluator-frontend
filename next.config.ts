// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	webpack: (config, { isServer }) => {
		// Solo aplicar configuraciones en el cliente
		if (!isServer) {
			// Configuración para PDF.js
			config.resolve.fallback = {
				...config.resolve.fallback,
				fs: false,
				path: false,
				canvas: false,
			};
		}

		return config;
	},

	// Configuración para archivos estáticos
	async headers() {
		return [
			{
				source: '/(.*)',
				headers: [
					{
						key: 'Cross-Origin-Embedder-Policy',
						value: 'require-corp',
					},
					{
						key: 'Cross-Origin-Opener-Policy',
						value: 'same-origin',
					},
				],
			},
		];
	},
};

export default nextConfig;
