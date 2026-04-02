import { Page, Locator } from "@playwright/test";

export class DocumentWizard {
  readonly page: Page;
  readonly addItemButton: Locator;
  readonly documentNameInput: Locator;
  readonly recipientInput: Locator;
  readonly createRecipientButton: Locator;
  readonly continueButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addItemButton = page.getByRole("button", { name: /^Add 1 item$/i });
    this.documentNameInput = page.getByTestId("document-name-wizard").locator("input");
    this.recipientInput = page.getByTestId("person-actor-card").locator("input");
    this.createRecipientButton = page.getByRole("button", { name: /create new recipient/i });
    this.continueButton = page.getByRole("button", { name: "Continue" });
  }

  async addItem(): Promise<void> {
    await this.addItemButton.click();
  }

  async fillDocumentName(name: string): Promise<void> {
    await this.documentNameInput.fill(name);
  }

  async clickCreateRecipient(): Promise<void> {
    await this.recipientInput.click();
    await this.createRecipientButton.click();
  }

  async clickContinue(): Promise<void> {
    await this.continueButton.click();
  }
}
