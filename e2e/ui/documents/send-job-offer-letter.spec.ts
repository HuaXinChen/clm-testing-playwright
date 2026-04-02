import { getAuthSkip, getAuthStatePath } from "../../../src/helpers/auth";
import { test } from "../../../src/fixtures/uiTest";
import { createTestPerson, createMailinatorInbox } from "../../../src/fixtures/testData";
import { AppActions } from "../../../src/page-objects";

test.describe("@ui @documents", () => {
  const authStatePath = getAuthStatePath();

  test.describe('Send "Job Offer Letter Template" Document to a New Recipient', () => {
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
        description: 'Scenario: Send "Job Offer Letter Template" to a new recipient'
      });
      testInfo.annotations.push({
        type: "gherkin",
        description:
          "Given I am authenticated\nWhen I create a document from the Job Offer Letter template and send it to a new recipient\nThen the recipient can open the email link, sign, and a completion email is received"
      });

      const app = new AppActions(page);
      const base = baseURL ?? "https://app.pandadoc.com";
      const testPerson = createTestPerson();
      const mailinatorInbox = createMailinatorInbox();
      const documentName = `Job Offer Letter for ${testPerson.fullName}`;

      await app.goto(base);
      const documentUrl = await app.sendJobOfferDocument(testPerson, mailinatorInbox, documentName);
      await app.verifyRecipientSigned(documentUrl);
      await app.verifyCompletionEmail(mailinatorInbox);
    });
  });
});
