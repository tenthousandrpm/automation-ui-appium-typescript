import path from 'path';
import { config } from 'dotenv';

config();

export const env = {
  deviceName: process.env.DEVICE_NAME ?? 'emulator-5554',
  appPath: path.resolve(process.env.APP_PATH ?? './app/chefplanner-debug.apk'),
  appiumHost: process.env.APPIUM_HOST ?? 'localhost',
  appiumPort: parseInt(process.env.APPIUM_PORT ?? '4723', 10),
  wdioEnv: (process.env.WDIO_ENV ?? 'local') as 'local' | 'ci',
} as const;
