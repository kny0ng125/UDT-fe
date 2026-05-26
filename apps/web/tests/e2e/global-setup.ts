import { chromium, type FullConfig } from '@playwright/test';
import path from 'node:path';

export const STORAGE_STATE_PATH = path.join(__dirname, '.auth', 'user.json');

export default async function globalSetup(config: FullConfig) {
  const token = process.env.E2E_TEST_JWT;
  if (!token) {
    throw new Error(
      'E2E_TEST_JWT 환경변수가 설정되지 않았습니다. apps/web/.env.test 또는 셸 환경에 설정하세요.',
    );
  }

  const baseURL = config.projects[0]?.use?.baseURL;
  if (!baseURL) {
    throw new Error(
      'baseURL이 playwright.config.ts의 use.baseURL에 설정되어 있어야 합니다.',
    );
  }

  const domain = new URL(baseURL).hostname;

  const browser = await chromium.launch();
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  await context.addCookies([
    {
      name: 'Authorization',
      value: token,
      domain,
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
    },
  ]);
  await context.storageState({ path: STORAGE_STATE_PATH });
  await browser.close();
}
