import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const catalog = fs.readFileSync(
  new URL("../src/catalog.ts", import.meta.url),
  "utf8",
);
const ids = [
  "tax-events",
  "progressive-tax",
  "withholding",
  "year-end-settlement",
  "value-added-tax",
  "investment-taxes",
  "tax-accounts",
  "housing-taxes",
  "gifts-inheritance",
  "deductions-credits",
  "tax-timeline",
  "reading-tax-documents",
];
test("tax catalog publishes the completed planned prefix with stable IDs", () => {
  const rows = [
    ...catalog.matchAll(
      /id: "([^"]+)", bookId: "tax", readId: "([^"]+)", number: "(\d+)"/g,
    ),
  ];
  assert([2, 4, 6, 8, 10, 12].includes(rows.length));
  assert.deepEqual(
    rows.map((r) => r[1]),
    ids.slice(0, rows.length),
  );
  rows.forEach((r, i) => {
    assert.equal(r[2], `tax/${ids[i]}`);
    assert.equal(Number(r[3]), i + 1);
  });
  assert.match(catalog, /id: "tax", categoryId: "money"/);
  assert.match(
    catalog,
    new RegExp(
      `소개·01–${String(rows.length).padStart(2, "0")}장 공개 · 과세 사건`,
    ),
  );
});
test("tax complete content has actual MDX sources, distinct labs, examples, reasoned checks", () => {
  const names = [
    "Intro",
    "TaxEvents",
    "ProgressiveTax",
    "Withholding",
    "YearEndSettlement",
    "ValueAddedTax",
    "InvestmentTaxes",
    "TaxAccounts",
    "HousingTaxes",
    "GiftsInheritance",
    "DeductionsCredits",
    "TaxTimeline",
    "ReadingTaxDocuments",
  ];
  const count = [...catalog.matchAll(/bookId: "tax", readId:/g)].length;
  for (const name of names.slice(0, count + 1)) {
    const s = fs.readFileSync(
      new URL(`../src/content/tax/${name}.mdx`, import.meta.url),
      "utf8",
    );
    assert(s.length > 2000, `${name} needs substantive narrative`);
    assert.match(s, /<[A-Za-z]+Lab \/>/);
    assert.match(s, /2026-10-20/);
    assert.match(s, /https:\/\/(?:www\.)?(?:nts|law)\.go\.kr/);
    assert.match(s, /가상/);
    assert.match(s, /<Check question=/);
    assert(!s.includes("원문 대조는 별도 검증 전"));
  }
});
test("tax visual source keeps static tables, focus and reduced-motion alternatives", () => {
  const css = fs.readFileSync(
    new URL("../src/components/tax/tax.css", import.meta.url),
    "utf8",
  );
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /@media\s*\(max-width:\s*540px\)/);
  const shared = fs.readFileSync(
    new URL("../src/components/tax/shared.tsx", import.meta.url),
    "utf8",
  );
  assert.match(shared, /tabIndex=\{0\}/);
  assert.match(shared, /aria-label=\{title\}/);
  assert.match(shared, /<caption>/);
});
