import { config as baseConfig } from './wdio.conf';

export const config: WebdriverIO.Config = {
  ...baseConfig,
  specs: ['./src/specs/smoke/**/*.spec.ts'],
};