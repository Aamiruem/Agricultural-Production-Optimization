import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { ICON_NAMES, iconFontUrl } from "./icons.js";

const SRC = join(__dirname, "..");

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return files(p);
    return /\.(jsx?|js)$/.test(name) && !name.endsWith(".test.js") ? [p] : [];
  });
}

/** Icon names referenced in source: icon="x", icon: "x", name="x" on <Icon>, and strings inside icon/name={…}. */
function usedIcons() {
  const found = new Set();
  for (const file of files(SRC)) {
    const text = readFileSync(file, "utf8");
    for (const m of text.matchAll(/\bicon(?:=|:\s*)"([a-z_]+)"/g)) found.add(m[1]);
    for (const m of text.matchAll(/<Icon[^>]*?\bname="([a-z_]+)"/g)) found.add(m[1]);
    for (const m of text.matchAll(/(?:<Icon[^>]*?\bname|\bicon)=\{([^}]*)\}/g)) {
      // only the results of a ternary (? "a" : "b"), not strings it compares against
      for (const s of m[1].matchAll(/[?:]\s*"([a-z_]+)"/g)) found.add(s[1]);
    }
    for (const m of text.matchAll(/_ICONS\s*=\s*\{([^}]*)\}/g)) {
      for (const s of m[1].matchAll(/:\s*"([a-z_]+)"/g)) found.add(s[1]);
    }
    for (const m of text.matchAll(/STATUS\s*=\s*\{([\s\S]*?)\n\};/g)) {
      for (const s of m[1].matchAll(/icon:\s*"([a-z_]+)"/g)) found.add(s[1]);
    }
  }
  return found;
}

describe("Material Symbols subset", () => {
  it("includes every icon the source uses", () => {
    const known = new Set(ICON_NAMES);
    const missing = [...usedIcons()].filter((n) => !known.has(n));
    expect(missing).toEqual([]);
  });

  it("requests names sorted and de-duplicated (Google Fonts requirement)", () => {
    const names = new URL(iconFontUrl()).searchParams.get("icon_names").split(",");
    expect(names).toEqual([...new Set(names)].sort());
  });
});
