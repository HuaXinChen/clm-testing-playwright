import { Page, Locator, FrameLocator, expect } from "@playwright/test";

export class CreateRecipientDialog {
  readonly dialog: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;

  constructor(dialog: Locator) {
    this.dialog = dialog;
    this.firstNameInput = dialog.getByTestId("firstName").locator("input");
    this.lastNameInput = dialog.getByTestId("lastName").locator("input");
    this.emailInput = dialog.locator('input[name^="searchField"]').first();
  }

  async fillForm(page: Page, firstName: string, lastName: string, email: string): Promise<void> {
    await this.firstNameInput.fill(firstName);
    await this.lastNameInput.fill(lastName);
    await this.emailInput.click();
    await this.emailInput.fill(email);
    await page.waitForResponse(
      (response) => response.url().includes("/contacts") && response.status() === 200,
      { timeout: 10_000 }
    );
    await this.emailInput.press("Enter");
  }

  static async waitForDialog(page: Page): Promise<CreateRecipientDialog> {
    const dialog = page.getByRole("dialog").filter({ hasText: "Create new recipient" });
    await expect(dialog).toBeVisible();
    return new CreateRecipientDialog(dialog);
  }
}

export class DocumentEditor {
  readonly page: Page;
  readonly frame: FrameLocator;

  constructor(page: Page) {
    this.page = page;
    this.frame = page.frameLocator("#kolas-editor-iframe");
  }

  get splitMainButton() {
    return this.frame.getByTestId("split-main-button");
  }

  get continueButton() {
    return this.frame.getByTestId("continue-button");
  }

  get sendDocumentButton() {
    return this.frame.getByTestId("send-document-button");
  }

  get sentDialog() {
    return this.frame.getByRole("dialog").filter({ hasText: /Document has been sent/i });
  }

  get closeDialogButton() {
    return this.frame.getByTestId("close-dialog");
  }

  async clickReviewAndSend(): Promise<void> {
    await this.splitMainButton.click();
  }

  async handleVariablesPrompt(): Promise<void> {
    await this.frame.getByText("Do not replace", { exact: false }).click();
    await this.frame.getByRole("button", { name: "Continue" }).click();
  }

  async continue(): Promise<void> {
    await this.continueButton.click();
  }

  async sendDocument(): Promise<void> {
    await this.sendDocumentButton.click();
  }

  async waitForSentDialog(): Promise<void> {
    await expect(this.sentDialog).toBeVisible({ timeout: 30_000 });
  }

  async closeSentDialog(): Promise<void> {
    await this.closeDialogButton.click();
    await expect(this.sentDialog).toBeHidden();
  }
}
