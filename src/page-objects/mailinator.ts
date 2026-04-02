import { Page } from "@playwright/test";
import {
  extractDocumentLinksFromLatestMailinatorEmail,
  waitForMailinatorEmailSubject
} from "../helpers/mailinator";

export class MailinatorPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async extractDocumentLink(
    inbox: string,
    documentName: string,
    timeoutMs = 120_000
  ): Promise<string> {
    const stablePrefixWords = documentName.split(/\s+/).filter(Boolean).slice(0, 3);
    const escapedPrefix = stablePrefixWords
      .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join(String.raw`\s+`);
    const subjectRegex = new RegExp(String.raw`sent you[\s\S]*${escapedPrefix}`, "i");

    const links = await extractDocumentLinksFromLatestMailinatorEmail(this.page, {
      inbox,
      timeoutMs,
      subject: { type: "regex", value: subjectRegex },
      link: { type: "regex", value: /https:\/\/app\.pandadoc\.com\/document\/v2\?token=/i }
    });

    return links[0]!;
  }

  async waitForCompletionEmail(inbox: string, timeoutMs = 120_000): Promise<void> {
    await waitForMailinatorEmailSubject(this.page, {
      inbox,
      timeoutMs,
      subject: { type: "contains", value: "document has been completed" }
    });
  }
}
