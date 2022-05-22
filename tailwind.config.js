const { guessProductionMode } = require("@ngneat/tailwind");
const colors = require('tailwindcss/colors');

process.env.TAILWIND_MODE = guessProductionMode() ? 'build' : 'watch';

module.exports = {
	prefix: '',
	content: [
		'./src/**/*.{html,ts,css,scss,sass,less,styl,js}',
	],
	safelist: [
		'h-10',
		'w-10',
		'mx-auto',
		'object-cover',
		'rounded-full',
		'flex flex-col',
		'justify-center',
		'items-center',
		'mr-3',
		'mt-16',
		'bg-gray-400',
		'bg-red-400',
		'bg-yellow-400',
		'bg-green-400',
		'bg-blue-400',
		'bg-indigo-400',
		'bg-purple-400',
		'bg-pink-400',
	],
	darkMode: 'class', // or 'media' or 'class'
	theme: {
		extend: {
			colors: {
				sky: colors.sky,
				teal: colors.teal,
				rose: colors.rose,
				black: {
					100: '#dfe0e4',
					200: '#c0c2c9',
					300: '#a0a3ae',
					400: '#818593',
					500: '#616678',
					600: '#4e5260',
					700: '#3a3d48',
					800: '#272930',
					900: '#131418',
				},
				green: colors.emerald,
        yellow: colors.amber,
        purple: colors.violet,
				transparent: 'transparent',
				primary: {
					1: '#DBD6BB',
					2: '#FFF5BC',
					3: '#E9C56C',
					4: '#B88D3C',
				}
			},
			ringWidth: ['checked'],
			ringColor: ['checked'],
			fontFamily: {
				display: ['Fira Sans', 'Helvetica', 'sans-serif'],
				body: ['Open Sans', 'Helvetica', 'sans-serif'],
			},
			boxShadow: {
				sidebar:
					'4px 0 6px -1px rgba(0, 0, 0, 0.1), 2px 0 4px -1px rgba(0, 0, 0, 0.06)',
			},
			scale: {
				'175': '1.75',
				'200': '2',
			},
			zIndex: {
				'100': 100,
			},
		},
	},
	plugins: [
		require('@tailwindcss/aspect-ratio'), require('@tailwindcss/forms'), require('@tailwindcss/line-clamp'), require('@tailwindcss/typography')],
};
