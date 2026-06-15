import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import prettierConfig from "eslint-config-prettier";

export default tseslint.config(
	{
		ignores: [
			"node_modules/**",
			".obsidian/**",
			"main.js",
			"Instructions",
			"eslint.config.mjs",
			"scripts/**",
		],
	},

	js.configs.recommended,

	...tseslint.configs.recommended,

	{
		files: ["tests/**/*.{ts,tsx}"],
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "module",
			globals: { ...globals.node },
		},
	},

	...tseslint.configs.recommendedTypeChecked.map((config) => ({
		...config,
		files: ["src/**/*.{ts,tsx}"],
	})),
	...tseslint.configs.strictTypeChecked.map((config) => ({
		...config,
		files: ["src/**/*.{ts,tsx}"],
	})),

	{
		files: ["src/**/*.{ts,tsx}"],
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "module",
			globals: { ...globals.browser },
			parserOptions: {
				project: "./tsconfig.json",
				ecmaFeatures: { jsx: true },
			},
		},
		plugins: {
			"simple-import-sort": simpleImportSort,
		},
		rules: {
			"@typescript-eslint/restrict-template-expressions": "off",
			"@typescript-eslint/require-await": "off",
			"@typescript-eslint/no-explicit-any": ["error", { ignoreRestArgs: true }],
			"@typescript-eslint/explicit-module-boundary-types": "off",
			"@typescript-eslint/no-non-null-assertion": "warn",
			"@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
			"@typescript-eslint/no-unnecessary-type-assertion": "warn",
			"@typescript-eslint/prefer-as-const": "warn",
			"@typescript-eslint/array-type": ["warn", { default: "array" }],
			"simple-import-sort/imports": "warn",
			"simple-import-sort/exports": "warn",
			"no-console": "warn",
			"no-debugger": "error",
			"no-restricted-syntax": [
				"error",
				{
					selector: "NewExpression[callee.name='Notice']",
					message: "Use showNotice(...) instead of new Notice(...).",
				},
			],
			eqeqeq: ["error", "always"],
			"prefer-template": "warn",
			"prefer-object-spread": "warn",
			curly: ["warn", "multi-line"],
			"no-else-return": "warn",
		},
	},

	prettierConfig,
);
