import { getAuthSkip, getAuthStatePath } from "./helpers/auth";
import {
  extractDocumentLinksFromLatestMailinatorEmail,
  waitForMailinatorEmailSubject
} from "./helpers/mailinator";
import { test, expect } from "./fixtures/uiTest";
import { createTestPerson, createMailinatorInbox } from "./fixtures/testData";

// spec: specs/documents-send-job-offer-letter.md
// seed: e2e/seed.spec.ts

const authStatePath = getAuthStatePath();

async function acceptCookiesIfPresent(page: import("@playwright/test").Page): Promise<void> {
  const acceptButton = page.locator("#onetrust-accept-btn-handler");
  try {
    await acceptButton.waitFor({ state: "visible", timeout: 5_000 });
    await acceptButton.click();
  } catch {
    // Cookie banner isn't always present; ignore.
  }
}

test.describe("Send “Job Offer Letter Template” Document to a New Recipient", () => {
  const { skip, reason } = getAuthSkip(authStatePath);
  test.skip(skip, reason);

  test.use({ storageState: authStatePath });

  test("send Job Offer Letter template to new recipient and complete signing", async ({
    page,
    baseURL
  }) => {
    const testInfo = test.info();
    testInfo.annotations.push({ type: "feature", description: "Feature: Documents - Sending" });
    testInfo.annotations.push({
      type: "scenario",
      description: "Scenario: Send “Job Offer Letter Template” to a new recipient"
    });
    testInfo.annotations.push({
      type: "gherkin",
      description:
        "Given I am authenticated\nWhen I create a document from the Job Offer Letter template and send it to a new recipient\nThen the recipient can open the email link, sign, and a completion email is received"
    });

    const base = (baseURL ?? "https://app.pandadoc.com").replace(/\/+$/, "");
    await page.goto(`${base}`, { waitUntil: "domcontentloaded" });

    await acceptCookiesIfPresent(page);

    // 1. In the left navigation, click Documents.
    await page
      .getByRole("link", { name: /^Documents$/i })
      .or(page.getByRole("button", { name: /^Documents$/i }))
      .click();

    // 2. Click the + Document button.
    await page.getByTestId("surfaces-main-action").click();

    // 3. Choose Job Offer Letter Template.
    // await page.getByRole("img", { name: "Job Offer Letter Template" }).first().click();
    await page
      .getByRole("img", {
        name: "Job Offer Letter Template",
        exact: true
      })
      .click();

    // 4. Click Add 1 item.
    await page.getByRole("button", { name: /^Add 1 item$/i }).click();

    const testPerson = createTestPerson();
    const mailinatorInbox = createMailinatorInbox();
    const recipientEmail = `${mailinatorInbox}@mailinator.com`;
    const documentName = `Job Offer Letter for ${testPerson.fullName}`;
    await page.getByTestId("document-name-wizard").locator("input").fill(documentName);

    // 6. Click into the Add recipient text box.
    await page.getByTestId("person-actor-card").locator("input").click();

    await page.getByRole("button", { name: /create new recipient/i }).click();

    // 7. In the Create new recipient dialog: fill First name, Last name, Email, leave Phone number empty, click Create.
    const createRecipientDialog = page
      .getByRole("dialog")
      .filter({ hasText: "Create new recipient" });
    await expect(createRecipientDialog).toBeVisible();
    await createRecipientDialog
      .getByTestId("firstName")
      .locator("input")
      .fill(testPerson.firstName);
    await createRecipientDialog.getByTestId("lastName").locator("input").fill(testPerson.lastName);
    const emailInput = createRecipientDialog.locator('input[name^="searchField"]').first();
    await emailInput.click();
    await emailInput.fill(recipientEmail);
    await page.waitForResponse(
      (response) => response.url().includes("/contacts") && response.status() === 200,
      { timeout: 10_000 }
    );
    await emailInput.press("Enter");
    await page.getByRole("button", { name: "Continue" }).click();

    // Wait for the editor iframe to load and become visible
    const frameHandle = page.frameLocator("#kolas-editor-iframe");
    await frameHandle.locator("body").waitFor();

    // 8. Click Review and send.
    await frameHandle.getByTestId("split-main-button").click();

    // 9. When prompted about variables, select Do not replace (variables will be displayed) and click Continue.
    await frameHandle.locator('//span[contains(., "Do not replace")]').click();
    await frameHandle.getByRole("button", { name: "Continue" }).click();

    // 10. Click Continue.
    await frameHandle.getByTestId("continue-button").click();

    // 11. Click Send document.
    await frameHandle.getByTestId("send-document-button").click();

    // 12. Verify the Document has been sent dialog appears.
    const sentDialog = frameHandle
      .getByRole("dialog")
      .filter({ hasText: /Document has been sent/i });
    await expect(sentDialog).toBeVisible({ timeout: 30_000 });

    // 13. Click the Close (X) icon on the dialog.
    await sentDialog.getByTestId("close-dialog").click();
    await expect(sentDialog).toBeHidden();

    // 14. Extract document links using Mailinator.
    const mailPage = await page.context().newPage();
    let documentUrl: string;
    try {
      // Mailinator can truncate the subject with "...", so avoid matching the full document name.
      // Expected subject shape: "[sender] sent you [document name]".
      const stablePrefixWords = documentName.split(/\s+/).filter(Boolean).slice(0, 3);
      const escapedPrefix = stablePrefixWords
        .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join(String.raw`\s+`);
      const subjectRegex = new RegExp(String.raw`sent you[\s\S]*${escapedPrefix}`, "i");

      const links = await extractDocumentLinksFromLatestMailinatorEmail(mailPage, {
        inbox: mailinatorInbox,
        timeoutMs: 120_000,
        subject: { type: "regex", value: subjectRegex },
        link: { type: "regex", value: /https:\/\/app\.pandadoc\.com\/document\/v2\?token=/i }
      });

      documentUrl = links[0]!;
    } finally {
      await mailPage.close();
    }

    // 15. Navigate to the document link and sign.
    const signingPage = await page.context().newPage();
    await signingPage.goto(documentUrl, { waitUntil: "domcontentloaded" });

    await acceptCookiesIfPresent(signingPage);

    // Best-effort signing flow (public token link pages can vary slightly).
    await signingPage.getByTestId("info-bar-action-button").click();

    // Try to adopt/confirm a signature if prompted.
    await signingPage.getByTestId("signature-field").click();

    // Try to click Accept and sign button
    await signingPage.locator("#dialogPrimaryButton").click();

    // Wait for response from /field-image/upload
    await signingPage.waitForResponse(
      (response) => response.url().includes("/field-image/upload") && response.status() === 200,
      { timeout: 10_000 }
    );

    // Click Finish button
    await signingPage.getByTestId("info-bar-action-button").click();

    // Assert we didn't land on an error page.
    await expect(signingPage.getByTestId("empty-state-title")).toHaveText(
      "All set — this document is complete!"
    );
    await signingPage.close();

    // 16. Verify signer received completed email using Mailinator.
    const completedMailPage = await page.context().newPage();
    try {
      await waitForMailinatorEmailSubject(completedMailPage, {
        inbox: mailinatorInbox,
        timeoutMs: 120_000,
        subject: { type: "contains", value: "document has been completed" }
      });
    } finally {
      await completedMailPage.close();
    }
  });
});
