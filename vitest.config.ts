import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
	},
	resolve: {
		alias: {
			src: path.resolve(__dirname, "./src"),
			obsidian: path.resolve(__dirname, "./tests/__mocks__/obsidian.ts"),
		},
	},
});
