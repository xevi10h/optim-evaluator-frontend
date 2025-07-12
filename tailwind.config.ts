import type { Config } from 'tailwindcss';

const config: Config = {
	content: [
		'./src/pages/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/components/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/app/**/*.{js,ts,jsx,tsx,mdx}',
	],
	theme: {
		extend: {
			colors: {
				primary: {
					DEFAULT: '#199875',
					dark: '#188869',
				},
				secondary: {
					DEFAULT: '#dfe7e6',
				},
				text: {
					dark: '#1c1c1c',
					medium: '#949494',
					light: '#6f6f6f',
				},
				background: 'var(--background)',
				foreground: 'var(--foreground)',
			},
			fontFamily: {
				sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
			},
			animation: {
				'fade-in': 'fadeIn 0.6s ease-out forwards',
				'slide-in-right': 'slideInRight 0.8s ease-out forwards',
				'slide-in-up': 'slideInUp 0.5s ease-out forwards',
				'bounce-in': 'bounceIn 0.6s ease-out forwards',
				'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
				'pulse-border': 'pulseBorder 2s ease-in-out infinite',
				'scale-in': 'scaleIn 0.5s ease-out forwards',
			},
			keyframes: {
				fadeIn: {
					'0%': {
						opacity: '0',
						transform: 'translateY(10px) scale(0.95)',
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0) scale(1)',
					},
				},
				slideInRight: {
					'0%': {
						opacity: '0',
						transform: 'translateX(30px) scale(0.9)',
					},
					'100%': {
						opacity: '1',
						transform: 'translateX(0) scale(1)',
					},
				},
				slideInUp: {
					'0%': {
						opacity: '0',
						transform: 'translateY(20px)',
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)',
					},
				},
				bounceIn: {
					'0%': {
						opacity: '0',
						transform: 'scale(0.3)',
					},
					'50%': {
						opacity: '1',
						transform: 'scale(1.05)',
					},
					'70%': {
						transform: 'scale(0.95)',
					},
					'100%': {
						opacity: '1',
						transform: 'scale(1)',
					},
				},
				pulseBorder: {
					'0%, 100%': {
						boxShadow: '0 0 0 0 rgba(25, 152, 117, 0.4)',
					},
					'50%': {
						boxShadow: '0 0 0 10px rgba(25, 152, 117, 0)',
					},
				},
				scaleIn: {
					'0%': {
						opacity: '0',
						transform: 'scale(0.8)',
					},
					'100%': {
						opacity: '1',
						transform: 'scale(1)',
					},
				},
			},
			transitionDelay: {
				'400': '400ms',
				'600': '600ms',
				'800': '800ms',
				'1000': '1000ms',
			},
		},
	},
	plugins: [],
};

export default config;
