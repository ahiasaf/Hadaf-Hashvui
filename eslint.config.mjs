import js from "@eslint/js";
import ts from "typescript-eslint";
import hooks from "eslint-plugin-react-hooks";
export default ts.config(
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "src/generated/**",
      "src/shared/**",
      "src/features/**",
      "src/service-worker.js",
      "src/**/*.astro",
    ],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    languageOptions: {
      globals: Object.fromEntries(
        [
          "console",
          "process",
          "Buffer",
          "URL",
          "URLSearchParams",
          "fetch",
          "AbortSignal",
          "AbortController",
          "setTimeout",
          "clearTimeout",
          "Response",
          "Request",
          "window",
          "document",
          "location",
          "innerWidth",
          "localStorage",
          "sessionStorage",
          "navigator",
          "IntersectionObserver",
          "CustomEvent",
        ].map((name) => [name, "readonly"]),
      ),
    },
    rules: { "@typescript-eslint/no-explicit-any": "off" },
  },
  {
    files: ["src/**/*.tsx"],
    plugins: { "react-hooks": hooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
    },
  },
);
