import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

// jsdom lacks matchMedia (used by the theme) and scrollIntoView (used by the chat).
window.matchMedia ??= () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
Element.prototype.scrollIntoView ??= function scrollIntoView() {};
