import AllureReporter from '@wdio/allure-reporter';
import seedBackup from '@data/fixtures/seed-backup.json';
import type { ChefPlannerBackup } from '@data/types';
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
        await restoreBackupFlow(seedBackup as ChefPlannerBackup);
    });
});
