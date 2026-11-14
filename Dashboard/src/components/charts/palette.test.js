import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { CHART_PALETTE } from "./palette.js";

const css = readFileSync(join(__dirname, "..", "..", "index.css"), "utf8");

function tokens(selector) {
  const start = css.indexOf(`${selector} {`);
  const block = css.slice(start, css.indexOf("}", start));
  return Object.fromEntries([...block.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
}

describe("chart palette", () => {
  it.each([
    ["light", ":root"],
    ["dark", ':root[data-theme="dark"]'],
  ])("matches the %s CSS tokens", (theme, selector) => {
    const defined = tokens(selector);
    for (const [name, hex] of Object.entries(CHART_PALETTE[theme])) {
      expect(defined[name], `--${name} in ${selector}`).toBe(hex);
    }
  });
});
