import { test, expect } from "@playwright/test";
import * as http from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";

type ContractAnalysisResponse = {
  partyNames: string[];
  effectiveDate?: string;
  riskFlags?: string[];
};

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.setEncoding("utf8");
    req.on("data", (chunk: string) => {
      raw += chunk;
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

let server: http.Server | undefined;
let baseURL: string | undefined;
let serverStartError: string | undefined;

test.beforeAll(async () => {
  // API-only suite: keep real `request` calls, but serve a mocked response without launching a browser.
  server = http.createServer(async (req: IncomingMessage, res: ServerResponse) => {
    try {
      if (req.method !== "POST" || req.url !== "/analyze-contract") {
        res.writeHead(404);
        res.end();
        return;
      }

      const body = (await readJsonBody(req)) as { text?: unknown };
      const text = typeof body.text === "string" ? body.text : "";
      if (text.trim().length === 0) {
        res.writeHead(400, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: "Missing `text`" }));
        return;
      }

      const payload: ContractAnalysisResponse = {
        partyNames: ["Acme Corp", "John Doe"],
        effectiveDate: "2024-01-01",
        riskFlags: ["auto-renewal"]
      };

      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(payload));
    } catch {
      res.writeHead(500);
      res.end();
    }
  });

  try {
    await new Promise<void>((resolve, reject) => {
      server!.once("error", reject);
      // Avoid binding to a specific interface; some environments restrict 127.0.0.1 binds.
      server!.listen(0, () => resolve());
    });
    const address = server!.address();
    if (!address || typeof address === "string") throw new Error("Failed to bind mock server");
    baseURL = `http://localhost:${address.port}`;
  } catch (err) {
    serverStartError = String(err);
  }
});

test.afterAll(async () => {
  if (!server) return;
  await new Promise<void>((resolve) => server!.close(() => resolve()));
});

async function attachApiResponse(
  name: string,
  testInfo: import("@playwright/test").TestInfo,
  response: import("@playwright/test").APIResponse,
  payload?: unknown
): Promise<void> {
  const contentType = response.headers()["content-type"] ?? "unknown";
  const statusLine = `${response.status()} ${response.statusText()}`.trim();
  const bodyText = await response.text();
  await testInfo.attach(name, {
    body: Buffer.from(
      JSON.stringify(
        {
          status: statusLine,
          contentType,
          requestBody: payload,
          body: bodyText
        },
        null,
        2
      ),
      "utf8"
    ),
    contentType: "application/json"
  });
}

test("contract analysis API returns structured data", async ({ request }) => {
  const testInfo = test.info();
  testInfo.annotations.push({ type: "feature", description: "Feature: Contract analysis API" });
  testInfo.annotations.push({
    type: "scenario",
    description: "Scenario: Analyze contract text returns structured fields"
  });
  testInfo.annotations.push({
    type: "gherkin",
    description:
      "Given a contract analysis API endpoint\nWhen I submit valid contract text\nThen I receive structured contract analysis data"
  });

  if (!baseURL)
    test.skip(true, `Unable to start local mock server: ${serverStartError ?? "unknown"}`);

  const requestBody = {
    text: "This agreement is between Acme Corp and John Doe effective Jan 1, 2024."
  };
  const response = await request.post(`${baseURL}/analyze-contract`, { data: requestBody });

  try {
    expect(response.status()).toBe(200);
  } catch (err) {
    await attachApiResponse("api-response", testInfo, response, requestBody);
    throw err;
  }

  const result = (await response.json()) as ContractAnalysisResponse;

  try {
    expect(result.partyNames).toEqual(expect.arrayContaining(["Acme Corp"]));
    if (result.effectiveDate) {
      expect(result.effectiveDate).toMatch(/\d{4}-\d{2}-\d{2}/);
    }
  } catch (err) {
    await attachApiResponse("api-response", testInfo, response, requestBody);
    await testInfo.attach("parsed-result", {
      body: Buffer.from(JSON.stringify(result, null, 2), "utf8"),
      contentType: "application/json"
    });
    throw err;
  }
});

test("returns 400 for empty contract input", async ({ request }) => {
  const testInfo = test.info();
  testInfo.annotations.push({ type: "feature", description: "Feature: Contract analysis API" });
  testInfo.annotations.push({
    type: "scenario",
    description: "Scenario: Empty contract text is rejected"
  });
  testInfo.annotations.push({
    type: "gherkin",
    description:
      "Given a contract analysis API endpoint\nWhen I submit an empty contract text\nThen the API responds with a 400 error"
  });

  if (!baseURL)
    test.skip(true, `Unable to start local mock server: ${serverStartError ?? "unknown"}`);

  const requestBody = { text: "" };
  const response = await request.post(`${baseURL}/analyze-contract`, { data: requestBody });

  try {
    expect(response.status()).toBe(400);
  } catch (err) {
    await attachApiResponse("api-response", testInfo, response, requestBody);
    throw err;
  }
});
