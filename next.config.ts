import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	images: {
		domains: ['cdnjs.cloudflare.com'],
	},

	async headers() {
		return [
			{
				source: '/(.*)',
				headers: [
					{
						key: 'Cross-Origin-Resource-Policy',
						value: 'cross-origin',
					},
				],
			},
		];
	},

	experimental: {
		optimizePackageImports: ['lucide-react'],
	},
};

export default nextConfig;
