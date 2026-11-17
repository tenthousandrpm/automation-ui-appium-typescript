const DEFAULT_TIMEOUT = 10_000;

export class BaseScreen {
    protected readonly defaultTimeout: number;

    constructor(defaultTimeout = DEFAULT_TIMEOUT) {
        this.defaultTimeout = defaultTimeout;
    }

    protected rid(tag: string): string {
        return `android=new UiSelector().resourceId("${tag}")`;
    }

    protected ridPattern(pattern: string): string {
        return `android=new UiSelector().resourceIdMatches("${pattern}")`;
    }

    async waitForDisplayed(selector: string, timeout?: number): Promise<void> {
        await $(selector).waitForDisplayed({ timeout: timeout ?? this.defaultTimeout });
    }

    async waitForGone(selector: string): Promise<void> {
        await $(selector).waitForDisplayed({ timeout: this.defaultTimeout, reverse: true });
    }

    async tap(selector: string): Promise<void> {
        const el = $(selector);
        await el.waitForDisplayed({ timeout: this.defaultTimeout });
        await el.click();
    }

    // Compose keeps a tab's nodes in the tree while another tab is shown (saveState), so
    // right after a bottom-nav switch a button reports "displayed" before the transition
    // ends, and a tap made then is silently dropped. Retry the tap until its result
    // appears; the target is checked before each retry so a slow open isn't tapped twice.
    async tapUntilDisplayed(trigger: string, target: string): Promise<void> {
        await browser.waitUntil(
            async () => {
                if (await $(target).isDisplayed()) return true;
                await this.tap(trigger);
                return $(target).waitForDisplayed({ timeout: 2_000 }).then(() => true, () => false);
            },
            { timeout: this.defaultTimeout, interval: 300, timeoutMsg: `${target} never appeared after tapping ${trigger}` },
        );
    }

    async setValue(selector: string, value: string): Promise<void> {
        const el = $(selector);
        await el.waitForDisplayed({ timeout: this.defaultTimeout });
        await el.setValue(value);
    }

    // For pre-filled Compose text fields. clearValue() doesn't reach the accessibility
    // node in time, and UiAutomator2's sendKeys appends to the text it still sees, so
    // "Old" + "New" becomes "OldNew". replaceElementValue sets the whole value at once.
    async replaceValue(selector: string, value: string): Promise<void> {
        const el = $(selector);
        await el.waitForDisplayed({ timeout: this.defaultTimeout });
        await browser.execute('mobile: replaceElementValue', { elementId: await el.elementId, text: value });
    }

    async getText(selector: string): Promise<string> {
        const el = $(selector);
        await el.waitForDisplayed({ timeout: this.defaultTimeout });
        return el.getText();
    }

    async scrollToElement(selector: string): Promise<void> {
        // UiScrollable wraps the inner UiSelector, stripping the "android=" strategy prefix
        const inner = selector.startsWith('android=') ? selector.slice('android='.length) : selector;
        await $(`android=new UiScrollable(new UiSelector().scrollable(true)).scrollIntoView(${inner})`).waitForExist({ timeout: this.defaultTimeout });
    }

    async isVisible(selector: string): Promise<boolean> {
        return $(selector).isDisplayed();
    }
}
