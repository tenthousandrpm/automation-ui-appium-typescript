import * as path from 'path';
import AllureReporter from '@wdio/allure-reporter';
import { restoreBackupFlow } from '@flows/backup.flow';
import { resetAppState } from '@helpers/adb';

describe('[Smoke] Configuración', () => {
    before(async () => {
        AllureReporter.addSuite('Smoke');
        AllureReporter.addFeature('Configuración');
        await resetAppState();
    });

    it('[S07] should restore backup and load data correctly', async () => {
        AllureReporter.addStory('Restore de backup');
        const fixturePath = path.resolve(__dirname, '../../data/fixtures/seed-backup.json');
        await restoreBackupFlow(fixturePath);
    });
});
