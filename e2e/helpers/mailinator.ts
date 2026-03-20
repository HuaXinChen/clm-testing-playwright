import type { Page } from "@playwright/test";

export type MailinatorLinkMatch =
  | { type: "contains"; value: string }
  | { type: "regex"; value: RegExp };

export type MailinatorLatestEmailOptions = {
  inbox: string;
  timeoutMs?: number;
  pollIntervalMs?: number;
  subject?: MailinatorLinkMatch;
  link?: MailinatorLinkMatch;
};

function matches(value: string, matcher: MailinatorLinkMatch | undefined): boolean {
  if (!matcher) return true;
  if (matcher.type === "contains") return value.includes(matcher.value);
  // Guard against stateful /g or /y regexes.
  matcher.value.lastIndex = 0;
  return matcher.value.test(value);
}

function uniq(values: string[]): string[] {
  return [...new Set(values)];
}

export function getMailinatorPublicInboxUrl(inbox: string): string {
  return `https://www.mailinator.com/v4/public/inboxes.jsp?to=${encodeURIComponent(inbox)}`;
}

function getBySubjectText(page: Page, matcher: MailinatorLinkMatch): ReturnType<Page["getByText"]> {
  if (matcher.type === "regex") return page.getByText(matcher.value);
  return page.getByText(matcher.value, { exact: false });
}

async function findMatchingRowText(page: Page, matcher: MailinatorLinkMatch): Promise<string | undefined> {
  const tableRows = page.locator("table tbody tr");
  try {
    const count = await tableRows.count();
    for (let i = 0; i < count; i++) {
      const text = (await tableRows.nth(i).innerText().catch(() => "")).trim();
      if (matches(text, matcher)) return text;
    }
  } catch {
    // ignore
  }

  const roleRows = page.locator('[role="row"]');
  const count = await roleRows.count();
  for (let i = 0; i < count; i++) {
    const text = (await roleRows.nth(i).innerText().catch(() => "")).trim();
    if (matches(text, matcher)) return text;
  }

  return undefined;
}

export async function waitForMailinatorEmailSubject(
  page: Page,
  options: Pick<MailinatorLatestEmailOptions, "inbox" | "timeoutMs" | "pollIntervalMs" | "subject">
): Promise<string> {
  if (!options.subject) throw new Error("waitForMailinatorEmailSubject: options.subject is required");

  const timeoutMs = options.timeoutMs ?? 60_000;
  const pollIntervalMs = options.pollIntervalMs ?? 5_000;
  const deadline = Date.now() + timeoutMs;

  await page.goto(getMailinatorPublicInboxUrl(options.inbox), { waitUntil: "domcontentloaded" });

  let lastSeen: string | undefined;
  while (Date.now() < deadline) {
    // Prefer waiting for the subject text to appear in the inbox list.
    // This is more robust than scraping row text when the UI is virtualized/truncated.
    try {
      await getBySubjectText(page, options.subject)
        .first()
        .waitFor({ state: "visible", timeout: pollIntervalMs });
      const text = await getBySubjectText(page, options.subject)
        .first()
        .innerText()
        .catch(() => undefined);
      return (text ?? "").trim() || (await findMatchingRowText(page, options.subject)) || "matched";
    } catch {
      // Fall through to row scanning.
    }

    lastSeen = await findMatchingRowText(page, options.subject);
    if (lastSeen) return lastSeen;

    await page.waitForTimeout(pollIntervalMs);
    await page.reload({ waitUntil: "domcontentloaded" });
  }

  throw new Error(
    `Timed out after ${timeoutMs}ms waiting for an email subject match in Mailinator inbox "${options.inbox}".`
  );
}

async function openLatestEmail(page: Page, subjectMatcher: MailinatorLinkMatch | undefined): Promise<void> {
  // Prefer clicking the subject text itself (Mailinator UIs often make the subject a link).
  if (subjectMatcher) {
    try {
      await getBySubjectText(page, subjectMatcher).first().click({ timeout: 15_000 });
      await page.locator("iframe").first().waitFor({ state: "attached", timeout: 5_000 }).catch(() => {});
      return;
    } catch {
      // Fall through to row-based strategies.
    }
  }

  const tableRows = page.locator("table tbody tr");
  try {
    await tableRows.first().waitFor({ state: "visible", timeout: 10_000 });
    await tableRows.first().locator("a,button").first().click().catch(async () => {
      await tableRows.first().click();
    });
    await page.locator("iframe").first().waitFor({ state: "attached", timeout: 5_000 }).catch(() => {});
    return;
  } catch {
    // Fall through to role-row strategy.
  }

  const roleRows = page.locator('[role="row"]');
  await roleRows.first().waitFor({ state: "visible", timeout: 10_000 });
  const clickable = subjectMatcher
    ? roleRows.filter({
        hasText: subjectMatcher.type === "contains" ? subjectMatcher.value : subjectMatcher.value
      })
    : roleRows;
  await clickable.first().locator("a,button").first().click().catch(async () => {
    await clickable.first().click();
  });
  await page.locator("iframe").first().waitFor({ state: "attached", timeout: 5_000 }).catch(() => {});
}

async function extractLinksFromOpenEmail(page: Page): Promise<string[]> {
  const iframeCandidates = page.locator("iframe");
  const count = await iframeCandidates.count();

  for (let i = 0; i < count; i++) {
    const iframe = iframeCandidates.nth(i);
    const frameLocator = page.frameLocator("iframe").nth(i);
    try {
      await iframe.waitFor({ state: "visible", timeout: 2_000 });
      const links = await frameLocator.locator("a[href]").evaluateAll((anchors) =>
        anchors
          .map((a) => a.getAttribute("href") ?? "")
          .map((href) => href.trim())
          .filter(Boolean)
      );
      if (links.length > 0) return links;
    } catch {
      // ignore
    }
  }

  return await page.locator("a[href]").evaluateAll((anchors) =>
    anchors
      .map((a) => a.getAttribute("href") ?? "")
      .map((href) => href.trim())
      .filter(Boolean)
  );
}

export async function extractDocumentLinksFromLatestMailinatorEmail(
  page: Page,
  options: MailinatorLatestEmailOptions
): Promise<string[]> {
  const timeoutMs = options.timeoutMs ?? 60_000;
  const pollIntervalMs = options.pollIntervalMs ?? 3_000;
  const deadline = Date.now() + timeoutMs;

  await page.goto(getMailinatorPublicInboxUrl(options.inbox), { waitUntil: "domcontentloaded" });

  let lastError: unknown;
  while (Date.now() < deadline) {
    try {
      // If we can see the subject in the inbox listing, prefer it over blindly clicking the latest row.
      if (options.subject) {
        try {
          await getBySubjectText(page, options.subject).first().click({ timeout: 1_000 });
        } catch {
          await openLatestEmail(page, options.subject);
        }
      } else {
        await openLatestEmail(page, undefined);
      }
      const rawLinks = await extractLinksFromOpenEmail(page);
      const filtered = rawLinks.filter((href) => matches(href, options.link));
      if (filtered.length > 0) return uniq(filtered);
    } catch (err) {
      lastError = err;
    }

    await page.waitForTimeout(pollIntervalMs);
    await page.reload({ waitUntil: "domcontentloaded" });
  }

  throw new Error(
    `Timed out after ${timeoutMs}ms waiting for a matching email/link in Mailinator inbox "${options.inbox}".` +
      (lastError ? ` Last error: ${String(lastError)}` : "")
  );
}
