import HomeScreen from '@screens/HomeScreen';
import AllureReporter from '@wdio/allure-reporter';

describe('[Smoke] Framework', () => {
    before(() => {
        AllureReporter.addSuite('Smoke');
        AllureReporter.addFeature('Navigation');
        AllureReporter.addStory('Bottom Navigation Bar');
    });

    it('should display the bottom navigation bar on app launch', async () => {
        await HomeScreen.waitForDisplayed();

        await expect(HomeScreen.pedidoTab).toBeDisplayed();
        await expect(HomeScreen.historicoTab).toBeDisplayed();
        await expect(HomeScreen.catalogoTab).toBeDisplayed();
        await expect(HomeScreen.configuracionTab).toBeDisplayed();
    });
});
