// NavigationBarItem merges semantics and exposes labels as text, not content-desc
// Verified via uiautomator dump: text="Pedido" | text="Histórico" etc.
class HomeScreen {
    get pedidoTab() { return $('android=new UiSelector().text("Pedido")'); }
    get historicoTab() { return $('android=new UiSelector().text("Histórico")'); }
    get catalogoTab() { return $('android=new UiSelector().text("Catálogo")'); }
    get configuracionTab() { return $('android=new UiSelector().text("Configuración")'); }

    async waitForDisplayed(timeout = 10_000): Promise<void> {
        await this.pedidoTab.waitForDisplayed({ timeout });
    }
}

export default new HomeScreen();
