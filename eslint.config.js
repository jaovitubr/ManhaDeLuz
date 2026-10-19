// https://docs.expo.dev/guides/using-eslint/
const { defineConfig, globalIgnores } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  globalIgnores(["dist/*", "node_modules/*", ".expo/*", "android/*", "ios/*"]),
  expoConfig,
  {
    rules: {
      // Estilo de código seguindo o padrão do projeto
      "quotes": ["error", "double", { "avoidEscape": true }],
      "semi": ["error", "always"],
      "indent": ["error", 2, { "SwitchCase": 1 }],
      "comma-dangle": ["error", {
        "arrays": "always-multiline",
        "objects": "always-multiline",
        "imports": "always-multiline",
        "exports": "always-multiline",
        "functions": "never",
      }],

      // Espaçamento
      "object-curly-spacing": ["error", "always"],
      "array-bracket-spacing": ["error", "never"],
      "arrow-spacing": ["error", { "before": true, "after": true }],
      "key-spacing": ["error", { "beforeColon": false, "afterColon": true }],
      "keyword-spacing": ["error", { "before": true, "after": true }],
      "space-before-blocks": ["error", "always"],
      "space-infix-ops": "error",

      // Formatação de arquivo
      "no-trailing-spaces": "error",
      "no-multiple-empty-lines": ["error", { "max": 1, "maxBOF": 0, "maxEOF": 0 }],
      "eol-last": ["error", "always"],

      // Boas práticas
      "no-console": ["warn", { "allow": ["warn", "error"] }],
      "no-debugger": "warn",
      "prefer-const": "error",
      "no-var": "error",

      // React/React Native - Formatação de JSX
      "react/jsx-tag-spacing": ["error", {
        "closingSlash": "never",
        "beforeSelfClosing": "always",
        "afterOpening": "never",
        "beforeClosing": "never",
      }],
      "react/jsx-closing-bracket-location": ["error", {
        "nonEmpty": "after-props",
        "selfClosing": "line-aligned",
      }],
      "react/jsx-first-prop-new-line": ["error", "multiline-multiprop"],
      "react/jsx-max-props-per-line": ["error", {
        "maximum": 1,
        "when": "multiline",
      }],
      "react/jsx-indent-props": ["error", 2],
      "react/jsx-indent": ["error", 2],
      "react/jsx-curly-spacing": ["error", {
        "when": "never",
        "children": true,
      }],
      "react/jsx-equals-spacing": ["error", "never"],
      "react/jsx-wrap-multilines": ["error", {
        "declaration": "parens-new-line",
        "assignment": "parens-new-line",
        "return": "parens-new-line",
        "arrow": "parens-new-line",
        "condition": "parens-new-line",
        "logical": "parens-new-line",
        "prop": "parens-new-line",
      }],
      "react/self-closing-comp": ["error", {
        "component": true,
        "html": true,
      }],

      // React/React Native - Boas práticas
      "react/jsx-boolean-value": ["error", "never"],
      "react/jsx-no-duplicate-props": "error",
      "react/jsx-pascal-case": ["error", {
        "allowAllCaps": false,
        "allowNamespace": false,
      }],
      "react/no-children-prop": "error",
      "react/jsx-key": ["error", {
        "checkFragmentShorthand": true,
        "checkKeyMustBeforeSpread": true,
      }],

      // React Hooks
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // TypeScript
      "@typescript-eslint/no-require-imports": "off",

      // Import ordering
      "import/order": ["error", {
        "groups": [
          ["builtin", "external"],
          ["internal", "parent", "sibling", "index"],
        ],
        "pathGroups": [
          {
            "pattern": "@/**",
            "group": "internal",
          },
        ],
        "pathGroupsExcludedImportTypes": ["builtin"],
        "newlines-between": "always",
        "alphabetize": {
          "order": "asc",
          "caseInsensitive": true,
        },
      }],
      "import/newline-after-import": ["error", { "count": 1 }],
      "import/no-duplicates": "error",
    },
  },
]);
