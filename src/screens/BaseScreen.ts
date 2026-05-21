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

    async setValue(selector: string, value: string): Promise<void> {
        const el = $(selector);
        await el.waitForDisplayed({ timeout: this.defaultTimeout });
        await el.setValue(value);
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
