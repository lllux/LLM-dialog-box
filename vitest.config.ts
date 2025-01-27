import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      
      // 添加覆盖率配置
      coverage: {
        provider: 'v8', // 使用 V8 引擎生成覆盖率
        reporter: ['text', 'json', 'html'], // 可选的报告格式
        include: ['src/**/*.ts', 'src/**/*.tsx', 'src/**/*.js', 'src/**/*.vue'], // 包含文件
      },
    },
  }),
)
