# Test Case: Send “Job Offer Letter Template” Document to a New Recipient

## Goal

Create a new document from the “Job Offer Letter Template”, add a new recipient via the “Create new recipient” dialog, send the document, and confirm the “Document has been sent” confirmation dialog appears.

## Assumptions / Starting State (fresh)

- Tester is logged into PandaDoc (CLM) with permission to create and send documents.
- No modal dialogs are open and no unsent document composer is in progress.
- If a document with the name **Job Offer Letter for John Doe** already exists, delete it first or choose a unique name (e.g., append a timestamp).

## Test Data

- Template: **Job Offer Letter Template**
- Document name: **Job Offer Letter for John Doe**
- Recipient:
  - First name: **Jonn**
  - Last name: **Doe**
  - Email: randomized Mailinator address like **wd_tester_123456789012@mailinator.com**
  - Phone: _(leave empty)_

## Steps (Happy Path)

1. In the left navigation, click **Documents**.
2. Click the **+ Document** button.
3. Choose **Job Offer Letter Template**.
4. Click **Add 1 item**.
5. In the document name field, enter **Job Offer Letter for John Doe**.
6. Click into the **Add recipient** text box.
7. In the **Create new recipient** dialog:
   1. Fill **First name** with **Jonn**.
   2. Fill **Last name** with **Doe**.
   3. Fill **Email** with a randomized Mailinator address like **wd_tester_123456789012@mailinator.com**.
   4. Leave **Phone number** empty.
   5. Click **Create**.
8. Click **Review and send**.
9. When prompted about variables, select **Do not replace (variables will be displayed)** and click **Continue**.
10. Click **Continue**.
11. Click **Send document**.
12. Verify the **Document has been sent** dialog appears.
13. Click the **Close (X)** icon on the dialog.
14. Extract document links using Mailinator
15. Navigate to the document link and sign
16. Verify signer received completed email using Mailinator

## Expected Results

- The document can be created from the selected template and proceeds to the send flow.
- The recipient is created successfully with an empty phone number accepted.
- The send action completes and a **Document has been sent** confirmation dialog is displayed.
- Closing the confirmation dialog returns the tester to the expected post-send state (e.g., document list or document details), with no blocking modal remaining.

## Success Criteria

- The “Document has been sent” confirmation dialog is shown after clicking **Send document**.

## Failure Conditions (examples)

- **Create new recipient** dialog rejects an empty phone number or fails to create the recipient.
- Variable-handling selection cannot be made, or the flow cannot continue.
- No “Document has been sent” confirmation appears, or sending fails with an error.
