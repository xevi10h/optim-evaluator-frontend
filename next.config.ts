import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	webpack: (config, { isServer, dev }) => {
		if (!isServer) {
			config.resolve.fallback = {
				...config.resolve.fallback,
				fs: false,
				path: false,
				canvas: false,
				encoding: false,
			};

			config.ignoreWarnings = [
				{ module: /node_modules\/pdfjs-dist/ },
				{ message: /Failed to parse source map/ },
				{ message: /Critical dependency/ },
			];

			config.module.rules.push({
				test: /pdf\.worker\.(min\.)?js/,
				type: 'asset/resource',
				generator: {
					filename: 'static/worker/[hash][ext][query]',
				},
			});

			config.resolve.alias = {
				...config.resolve.alias,
				'pdfjs-dist/build/pdf.worker.js': 'pdfjs-dist/build/pdf.worker.min.js',
			};
		}

		config.externals = config.externals || [];
		if (!isServer) {
			config.externals.push({
				'utf-8-validate': 'commonjs utf-8-validate',
				bufferutil: 'commonjs bufferutil',
			});
		}

		return config;
	},

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

	experimental: {
		optimizePackageImports: ['lucide-react', 'pdfjs-dist'],
	},

	transpilePackages: ['pdfjs-dist'],

	images: {
		domains: ['cdnjs.cloudflare.com'],
	},
};

export default nextConfig;
