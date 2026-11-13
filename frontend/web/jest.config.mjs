// Jest: fast unit tests for pure TypeScript logic (validation, formatting,
// API error handling) in a Node environment. Component tests use Vitest.

/** @type {import('jest').Config} */
const config = {
  testEnvironment: "node",
  roots: ["<rootDir>/tests/jest"],
  testMatch: ["**/*.test.ts"],
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        // isolatedModules = transpile only (type checking is done by `npm run typecheck`).
        tsconfig: {
          module: "commonjs",
          moduleResolution: "node",
          esModuleInterop: true,
          isolatedModules: true,
          jsx: "react-jsx",
        },
      },
    ],
  },
};

export default config;
