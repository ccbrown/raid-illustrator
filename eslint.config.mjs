import { FlatCompat } from '@eslint/eslintrc';
import prettier from 'eslint-plugin-prettier';
import unusedImports from 'eslint-plugin-unused-imports';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
});

const eslintConfig = [
    ...compat.extends('next/core-web-vitals', 'next/typescript'),
    {
        ignores: ['node_modules/**', '.next/**', '.open-next/**', 'out/**', 'build/**', 'next-env.d.ts'],
    },
    {
        plugins: {
            prettier: prettier,
            'unused-imports': unusedImports,
        },
    },
    {
        rules: {
            'unused-imports/no-unused-imports': 'error',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    args: 'all',
                    argsIgnorePattern: '^_',
                    caughtErrors: 'all',
                    caughtErrorsIgnorePattern: '^_',
                    destructuredArrayIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    ignoreRestSiblings: true,
                },
            ],
            'prettier/prettier': 1,
        },
    },
];

export default eslintConfig;
