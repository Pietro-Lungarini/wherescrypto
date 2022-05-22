module.exports = {
	root: true,
	env: {
		es6: true,
		node: true,
	},
	extends: [
		'eslint:recommended',
		'plugin:import/errors',
		'plugin:import/warnings',
		'plugin:import/typescript',
		'google',
		'plugin:@typescript-eslint/recommended',
	],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		tsconfigRootDir: __dirname,
		project: './tsconfig.eslint.json',
		sourceType: 'module',
	},
	ignorePatterns: [
		'/lib/**/*', // Ignore built files.
	],
	plugins: ['@typescript-eslint', 'import'],
	rules: {
		'new-cap': 'off',
		'require-jsdoc': ['off'],
		'indent': ['error', 'tab'],
		'linebreak-style': 'off',
		'no-tabs': 'off',
		'object-curly-spacing': ['off'],
		'max-len': 'off',
		'quotes': ['error', 'single'],
		'import/no-unresolved': 0,
	},
};
