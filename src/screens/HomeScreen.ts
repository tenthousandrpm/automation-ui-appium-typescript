import { BaseScreen } from './BaseScreen';

// NavigationBarItem merges semantics and exposes labels as text, not content-desc
// Verified via uiautomator dump: text="Pedido" | text="Histórico" etc.
class HomeScreen extends BaseScreen {
    get pedidoTab() { return $('android=new UiSelector().text("Pedido")'); }
    get historicoTab() { return $('android=new UiSelector().text("Histórico")'); }
    get catalogoTab() { return $('android=new UiSelector().text("Catálogo")'); }
    get configuracionTab() { return $('android=new UiSelector().text("Configuración")'); }

    // Default selector anchors to pedidoTab so callers can do HomeScreen.waitForDisplayed()
    override async waitForDisplayed(selector = 'android=new UiSelector().text("Pedido")', timeout?: number): Promise<void> {
        await super.waitForDisplayed(selector, timeout);
    }
}

export default new HomeScreen();
