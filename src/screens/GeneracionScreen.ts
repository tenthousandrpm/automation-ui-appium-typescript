import { BaseScreen } from './BaseScreen';

// The GeneracionScreen renders all order content as a single formatted text block inside
// generacion_card_texto. Groups are separated by \n\n; each group starts with the resolved
// supplier name (rotation result) followed by "- ingrediente: cantidad unidad" lines.
// There is no per-group DOM node — parsing the card text is the only way to introspect groups.
export class GeneracionScreen extends BaseScreen {
    get cardTexto() { return $(this.rid('generacion_card_texto')); }
    get btnConfirmar() { return $(this.rid('generacion_btn_confirmar')); }
    get btnVolver() { return $(this.rid('generacion_btn_volver')); }

    private async parseCardText(): Promise<Map<string, string[]>> {
        // Card is absent when the order is empty — return an empty map instead of timing out.
        if (!(await this.isVisible(this.rid('generacion_card_texto')))) {
            return new Map();
        }

        // generacion_card_texto is a Compose View container (text: null on the node itself).
        // The actual formatted text lives in a child TextView — use a UiAutomator
        // childSelector chain so the driver resolves it in a single native query.
        const textEl = $('android=new UiSelector().resourceId("generacion_card_texto").childSelector(new UiSelector().className("android.widget.TextView"))');
        const text = (await textEl.getText()) ?? '';
        const groups = new Map<string, string[]>();

        for (const block of text.split('\n\n')) {
            const lines = block.trim().split('\n');
            if (lines.length === 0) continue;
            const supplierName = lines[0].trim();
            const items = lines
                .slice(1)
                .filter(l => l.trimStart().startsWith('-'))
                .map(l => l.replace(/^\s*-\s*/, ''));
            groups.set(supplierName, items);
        }

        return groups;
    }

    async getSupplierGroups(): Promise<string[]> {
        return Array.from((await this.parseCardText()).keys());
    }

    /** Supplier name → item lines ("Tomate: 5 kg"), read from the card in a single pass. */
    async getSupplierGroupsWithItems(): Promise<Record<string, string[]>> {
        return Object.fromEntries(await this.parseCardText());
    }

    async getItemsForSupplier(supplierName: string): Promise<string[]> {
        return (await this.parseCardText()).get(supplierName) ?? [];
    }

    // Waits for the button to be enabled (supplier resolution can finish after the card
    // appears) then taps it. Navigation to Histórico is async — the caller is responsible
    // for waiting on a Histórico-side condition. waitForGone on this button is unreliable
    // because Compose Navigation keeps the Pedido/Generación composable alive in memory
    // (saveState = true), so the node never leaves the accessibility tree.
    async confirmOrder(): Promise<void> {
        await browser.waitUntil(
            () => $(this.rid('generacion_btn_confirmar')).isEnabled(),
            { timeout: this.defaultTimeout, timeoutMsg: 'Confirm button never became enabled' },
        );
        await this.tap(this.rid('generacion_btn_confirmar'));
    }

    async isOrderConfirmationVisible(): Promise<boolean> {
        return this.isVisible(this.rid('generacion_btn_confirmar'));
    }

    async isConfirmButtonEnabled(): Promise<boolean> {
        return $(this.rid('generacion_btn_confirmar')).isEnabled();
    }
}

export default new GeneracionScreen();
