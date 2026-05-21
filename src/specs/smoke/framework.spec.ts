import HomeScreen from '@screens/HomeScreen';

describe('[Smoke] Framework', () => {
    it('should display the bottom navigation bar on app launch', async () => {
        await HomeScreen.waitForDisplayed();

        await expect(HomeScreen.pedidoTab).toBeDisplayed();
        await expect(HomeScreen.historicoTab).toBeDisplayed();
        await expect(HomeScreen.catalogoTab).toBeDisplayed();
        await expect(HomeScreen.configuracionTab).toBeDisplayed();
    });
});
