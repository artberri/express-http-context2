import { defineConfig, type UserConfig } from 'tsdown'

const config: UserConfig = defineConfig({
	entry: ['src/index.ts'],
	format: ['esm', 'cjs'],
	outDir: 'lib',
	platform: 'node',
	target: 'node22',
	dts: true,
	sourcemap: true,
	clean: true,
	outputOptions: { exports: 'named' },
})

export default config
