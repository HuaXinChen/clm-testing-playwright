import { test, expect } from "@playwright/test";
import { getAuthSkip, getAuthStatePath } from "./helpers/auth";

// spec: specs/documents-send-job-offer-letter.md
// seed: e2e/seed.spec.ts

const authStatePath = getAuthStatePath();

test.describe("Send “Job Offer Letter Template” Document to a New Recipient", () => {
  const { skip, reason } = getAuthSkip(authStatePath);
  test.skip(skip, reason);

  test.use({ storageState: authStatePath });

  test("Send “Job Offer Letter Template” Document to a New Recipient", async ({ page, baseURL }) => {
    const base = (baseURL ?? "https://app.pandadoc.com").replace(/\/+$/, "");
    await page.goto(`${base}`, { waitUntil: "domcontentloaded" });

    // Accept cookies if the banner appears
    const acceptButton = page.locator('#onetrust-accept-btn-handler');
    try {
      await acceptButton.waitFor({ state: 'visible', timeout: 5000 });
      await acceptButton.click();
    } catch (e) {
      console.log('Accept button not found, skipping...');
    }

    // 1. In the left navigation, click Documents.
    await page
      .getByRole("link", { name: /^Documents$/i })
      .or(page.getByRole("button", { name: /^Documents$/i }))
      .click();

    // 2. Click the + Document button.
    await page.getByTestId("surfaces-main-action").click();

    // 3. Choose Job Offer Letter Template.
    await page
      .getByRole("button", { name: /Job Offer Letter Template/i })
      .or(page.getByRole("link", { name: /Job Offer Letter Template/i }))
      .or(page.getByText(/Job Offer Letter Template/i))
      .first()
      .click();

    // 4. Click Add 1 item.
    await page.getByRole("button", { name: /^Add 1 item$/i }).click();

    // 5. In the document name field, enter Job Offer Letter for John Doe.
    const documentName = "Job Offer Letter for John Doe";
    await page
      .getByTestId('document-name-wizard')
      .locator('input')
      .fill(documentName);

    // 6. Click into the Add recipient text box.
    await page
      .getByTestId('person-actor-card')
      .locator('input')
      .click();

    await page
      .getByTestId('dropdown-menu')
      .getByRole('button', { name: /create new recipient/i })
      .click();

    // 7. In the Create new recipient dialog: fill First name, Last name, Email, leave Phone number empty, click Create.
    const createRecipientDialog = page.getByRole('dialog').filter({ hasText: 'Create new recipient' });
    await expect(createRecipientDialog).toBeVisible();
    await createRecipientDialog.getByTestId('firstName').locator('input').fill('John');
    await createRecipientDialog.getByTestId('lastName').locator('input').fill("Doe");
    const emailInput = createRecipientDialog.locator('input[name^="searchField"]').first();
    await emailInput.click();
    await emailInput.fill('wd_tester@mailinator.com');
    await page.waitForResponse(response =>
      response.url().includes('/contacts') && response.status() === 200
    );
    await emailInput.press('Enter');
    await createRecipientDialog.getByRole("button", { name: 'Create' }).click();
    await page.getByTestId('add_recipients_step__continue_button').click();
    
    // Wait for the editor iframe to load and become visible
    const frameHandle = page.frameLocator('#kolas-editor-iframe');
    await frameHandle.locator('body').waitFor();

    // 8. Click Review and send.
    await frameHandle.getByTestId('split-main-button').click();

    // 9. When prompted about variables, select Do not replace (variables will be displayed) and click Continue.
    await frameHandle.locator('//span[contains(., "Do not replace")]').click();
    await frameHandle.getByRole('button', { name: 'Continue' }).click();

    // 10. Click Continue.
    await frameHandle.getByTestId('continue-button').click();  

    // 11. Click Send document.
    await frameHandle.getByTestId('send-document-button').click();

    // 12. Verify the Document has been sent dialog appears.
    const sentDialog = frameHandle.getByRole("dialog").filter({ hasText: /Document has been sent/i });
    await expect(sentDialog).toBeVisible({ timeout: 60_000 });

    // 13. Click the Close (X) icon on the dialog.
    await sentDialog.getByTestId('close-dialog').click();
    await expect(sentDialog).toBeHidden();
  });
});
