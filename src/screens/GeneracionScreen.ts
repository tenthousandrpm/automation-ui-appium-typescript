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

        const text = await this.getText(this.rid('generacion_card_texto'));
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

    async getItemsForSupplier(supplierName: string): Promise<string[]> {
        return (await this.parseCardText()).get(supplierName) ?? [];
    }

    // Taps confirm and waits for navigation away (button leaves the tree).
    async confirmOrder(): Promise<void> {
        await this.tap(this.rid('generacion_btn_confirmar'));
        await this.waitForGone(this.rid('generacion_btn_confirmar'));
    }

    async isOrderConfirmationVisible(): Promise<boolean> {
        return this.isVisible(this.rid('generacion_btn_confirmar'));
    }

    async isConfirmButtonEnabled(): Promise<boolean> {
        return $(this.rid('generacion_btn_confirmar')).isEnabled();
    }
}

export default new GeneracionScreen();
