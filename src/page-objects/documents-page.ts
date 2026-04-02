import { Page, Locator } from "@playwright/test";

export class DocumentsPage {
  readonly page: Page;
  readonly createDocumentButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createDocumentButton = page.getByTestId("surfaces-main-action");
  }

  async clickCreateDocument(): Promise<void> {
    await this.createDocumentButton.click();
  }

  async selectTemplate(templateName: string): Promise<void> {
    await this.page
      .getByRole("img", {
        name: templateName,
        exact: true
      })
      .click();
  }
}
