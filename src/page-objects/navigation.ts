import { Page, Locator } from "@playwright/test";

export class Navigation {
  readonly page: Page;
  readonly documentsLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.documentsLink = page
      .getByRole("link", { name: /^Documents$/i })
      .or(page.getByRole("button", { name: /^Documents$/i }));
  }

  async clickDocuments(): Promise<void> {
    await this.documentsLink.click();
  }
}

export class CookieBanner {
  readonly page: Page;
  readonly acceptButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.acceptButton = page.getByRole("button", { name: /accept|cookies/i });
  }

  async acceptIfPresent(): Promise<void> {
    try {
      await this.acceptButton.waitFor({ state: "visible", timeout: 5_000 });
      await this.acceptButton.click();
    } catch {
      // Cookie banner isn't always present
    }
  }
}
