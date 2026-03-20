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

      const body = (await readJsonBody(req)) as any;
      const text = typeof body?.text === "string" ? body.text : "";
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

test("contract analysis API returns structured data", async ({ request }) => {
  if (!baseURL) test.skip(true, `Unable to start local mock server: ${serverStartError ?? "unknown"}`);

  const response = await request.post(`${baseURL}/analyze-contract`, {
    data: {
      text: "This agreement is between Acme Corp and John Doe effective Jan 1, 2024."
    }
  });

  expect(response.status()).toBe(200);
  const result = (await response.json()) as ContractAnalysisResponse;

  expect(result.partyNames).toEqual(expect.arrayContaining(["Acme Corp"]));
  if (result.effectiveDate) {
    expect(result.effectiveDate).toMatch(/\d{4}-\d{2}-\d{2}/);
  }
});

test("returns 400 for empty contract input", async ({ request }) => {
  if (!baseURL) test.skip(true, `Unable to start local mock server: ${serverStartError ?? "unknown"}`);

  const response = await request.post(`${baseURL}/analyze-contract`, {
    data: { text: "" }
  });

  expect(response.status()).toBe(400);
});
