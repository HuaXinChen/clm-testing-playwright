import { Page, Locator, expect } from "@playwright/test";

export class SigningPage {
  readonly page: Page;
  readonly actionButton: Locator;
  readonly signatureField: Locator;
  readonly emptyStateTitle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.actionButton = page.getByTestId("info-bar-action-button");
    this.signatureField = page.getByTestId("signature-field");
    this.emptyStateTitle = page.getByTestId("empty-state-title");
  }

  async goto(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: "domcontentloaded" });
  }

  async clickActionButton(): Promise<void> {
    await this.actionButton.click();
  }

  async clickSignatureField(): Promise<void> {
    await this.signatureField.click();
  }

  async clickAcceptOrSign(): Promise<void> {
    await this.page.getByRole("button", { name: /accept|sign/i }).click();
  }

  async waitForSignatureUpload(): Promise<void> {
    await this.page.waitForResponse(
      (response) => response.url().includes("/field-image/upload") && response.status() === 200,
      { timeout: 10_000 }
    );
  }

  async completeSigning(): Promise<void> {
    await this.clickActionButton();
    await this.clickSignatureField();
    await this.clickAcceptOrSign();
    await this.waitForSignatureUpload();
    await this.clickActionButton();
  }

  async expectCompletion(): Promise<void> {
    await expect(this.emptyStateTitle).toHaveText("All set — this document is complete!");
  }
}
