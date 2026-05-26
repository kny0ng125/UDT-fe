import createConfig from '@udt/eslint-config/next';

export default [
  ...createConfig({ tsconfigRootDir: import.meta.dirname }),
  {
    files: ['tests/e2e/specs/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "CallExpression[callee.property.name='waitForTimeout']",
          message:
            'page.waitForTimeout()은 flaky의 원인입니다. expect(locator).toBeVisible() 또는 page.waitForURL/waitForResponse 등 조건 기반 대기를 사용하세요.',
        },
      ],
    },
  },
];
