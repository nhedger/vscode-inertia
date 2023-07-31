import { defineConfig } from "tsup";

export default defineConfig([
	{
		entry: ["src/extension.ts"],
		format: "cjs",
		globalName: "extension",
		sourcemap: true,
		clean: true,
		outDir: "out/node",
		external: ["vscode"],
	},
	{
		entry: ["src/extension.ts"],
		format: "cjs",
		globalName: "extension",
		sourcemap: true,
		clean: true,
		outDir: "out/web",
		external: ["vscode"],
	},
]);
