import { Page } from "@playwright/test";
import { createTestPerson } from "../fixtures/testData";

export interface TestPerson {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
}

export function createTestPersonWrapper(): TestPerson {
  return createTestPerson() as TestPerson;
}
import {
  Navigation,
  CookieBanner,
  DocumentsPage,
  DocumentWizard,
  CreateRecipientDialog,
  DocumentEditor,
  SigningPage,
  MailinatorPage
} from "./index";

export class AppActions {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(baseURL: string): Promise<void> {
    const base = baseURL.replace(/\/+$/, "");
    await this.page.goto(`${base}`, { waitUntil: "domcontentloaded" });
  }

  async sendJobOfferDocument(
    testPerson: TestPerson,
    mailinatorInbox: string,
    documentName: string
  ): Promise<string> {
    const cookieBanner = new CookieBanner(this.page);
    const navigation = new Navigation(this.page);
    const documentsPage = new DocumentsPage(this.page);
    const documentWizard = new DocumentWizard(this.page);
    const recipientEmail = `${mailinatorInbox}@mailinator.com`;

    await cookieBanner.acceptIfPresent();
    await navigation.clickDocuments();
    await documentsPage.clickCreateDocument();
    await documentsPage.selectTemplate("Job Offer Letter Template");
    await documentWizard.addItem();
    await documentWizard.fillDocumentName(documentName);
    await documentWizard.clickCreateRecipient();

    const createRecipientDialog = await CreateRecipientDialog.waitForDialog(this.page);
    await createRecipientDialog.fillForm(
      this.page,
      testPerson.firstName,
      testPerson.lastName,
      recipientEmail
    );

    await documentWizard.clickContinue();

    const editor = new DocumentEditor(this.page);
    await editor.clickReviewAndSend();
    await editor.handleVariablesPrompt();
    await editor.continue();
    await editor.sendDocument();
    await editor.waitForSentDialog();
    await editor.closeSentDialog();

    const mailPage = await this.page.context().newPage();
    try {
      const mailinator = new MailinatorPage(mailPage);
      return await mailinator.extractDocumentLink(mailinatorInbox, documentName);
    } finally {
      await mailPage.close();
    }
  }

  async verifyRecipientSigned(documentUrl: string): Promise<void> {
    const cookieBanner = new CookieBanner(this.page);
    const signingPage = new SigningPage(this.page);

    await signingPage.goto(documentUrl);
    await cookieBanner.acceptIfPresent();
    await signingPage.completeSigning();
    await signingPage.expectCompletion();
  }

  async verifyCompletionEmail(mailinatorInbox: string): Promise<void> {
    const mailPage = await this.page.context().newPage();
    try {
      const mailinator = new MailinatorPage(mailPage);
      await mailinator.waitForCompletionEmail(mailinatorInbox);
    } finally {
      await mailPage.close();
    }
  }
}
