// 共享 ESLint 配置（ESLint 9 flat config）
// 用法：子包 eslint.config.js 直接 re-export 或 spread 本配置

import tseslint from 'typescript-eslint'
import importPlugin from 'eslint-plugin-import'
import promisePlugin from 'eslint-plugin-promise'
import unusedImports from 'eslint-plugin-unused-imports'

export default tseslint.config(
  // 忽略
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/coverage/**',
      '**/*.tsbuildinfo',
      '**/_aemeath_*.json',
    ],
  },

  // 基础
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // 项目规则
  {
    plugins: {
      'unused-imports': unusedImports,
      import: importPlugin,
      promise: promisePlugin,
    },
    rules: {
      // 通用规范 §1.5 早返回 / §5 错误处理
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',

      // TS 专项 §1.2-1.4
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/no-import-type-side-effects': 'error',

      // 偏好 type 不用 interface（CODING_STANDARDS_NODE_TS §2.1）
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],

      // 命名 §3 + 必要豁免
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'default', format: ['camelCase'], leadingUnderscore: 'allow' },
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
          leadingUnderscore: 'allow',
        },
        { selector: 'parameter', format: ['camelCase'], leadingUnderscore: 'allow' },
        // function 允许 PascalCase（React 组件）
        { selector: 'function', format: ['camelCase', 'PascalCase'] },
        // import 允许 PascalCase（Fastify / 默认导出）+ UPPER_CASE（常量 namespace）
        { selector: 'import', format: ['camelCase', 'PascalCase', 'UPPER_CASE'] },
        { selector: 'typeLike', format: ['PascalCase'] },
        { selector: 'enumMember', format: ['PascalCase', 'UPPER_CASE'] },
        { selector: 'interface', format: ['PascalCase'], prefix: ['I'] },
        // env var / zod env schema 字段允许 SCREAMING_CASE
        {
          selector: 'objectLiteralProperty',
          format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
          leadingUnderscore: 'allow',
          filter: { regex: '^[a-zA-Z_$][a-zA-Z0-9_$]*$', match: true },
        },
        // Branded type 的 __brand 字段豁免（双下划线是标准写法）
        {
          selector: 'typeProperty',
          format: null,
          filter: { regex: '^__[a-zA-Z]+$', match: true },
        },
        {
          selector: 'typeProperty',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
        },
      ],

      // 死代码 §14
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'unused-imports/no-unused-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // import 顺序
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],

      // 复杂度 §2
      complexity: ['error', { max: 10 }],
      'max-depth': ['error', 4],
      'max-lines': ['error', { max: 800, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['error', { max: 50, skipBlankLines: true, skipComments: true }],
      'max-params': ['error', 4],

      // 禁用 import 清单 §13.3
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'axios', message: '用 undici (Node 原生级 fetch)' },
            { name: 'lodash', message: '用原生方法或 lodash-es 按需 import' },
            { name: 'moment', message: '用 date-fns 或原生 Date' },
          ],
        },
      ],
    },
  },

  // 测试文件放宽
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/__tests__/**'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      'max-lines-per-function': 'off',
    },
  },
)
