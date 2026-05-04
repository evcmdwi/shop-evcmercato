import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/** @type {import('eslint').Rule.RuleModule} */
const noLinkInMapWithoutPrefetch = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Require prefetch={false} on Link components used in .map() iterations",
      category: "Performance",
    },
    fixable: "code",
    schema: [],
    messages: {
      missingPrefetchFalse:
        "Add prefetch={false} to <Link> inside .map() to prevent RSC prefetch storm (see docs/PREFETCH_GUIDELINE.md)",
    },
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        if (node.name.name !== "Link") return;

        // Check if inside a .map() callback
        let parent = node.parent;
        let inMap = false;
        while (parent) {
          if (
            parent.type === "ArrowFunctionExpression" ||
            parent.type === "FunctionExpression"
          ) {
            const grandParent = parent.parent;
            if (
              grandParent?.type === "CallExpression" &&
              grandParent?.callee?.property?.name === "map"
            ) {
              inMap = true;
              break;
            }
          }
          parent = parent.parent;
        }

        if (!inMap) return;

        // Check prefetch prop
        const hasPrefetchFalse = node.attributes.some(
          (attr) =>
            attr.type === "JSXAttribute" &&
            attr.name?.name === "prefetch" &&
            attr.value?.expression?.value === false
        );

        if (!hasPrefetchFalse) {
          context.report({
            node,
            messageId: "missingPrefetchFalse",
            fix(fixer) {
              // Insert prefetch={false} before the closing > or first attribute
              const firstAttr = node.attributes[0];
              if (firstAttr) {
                return fixer.insertTextBefore(firstAttr, 'prefetch={false} ');
              }
              // No attributes — insert before closing
              return fixer.insertTextBeforeRange(
                node,
                [node.range[1] - 1, node.range[1]],
                ' prefetch={false}'
              );
            },
          });
        }
      },
    };
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // EVC Performance rules — prevent RSC prefetch storm regression
  {
    plugins: {
      "evc-perf": {
        rules: {
          "no-link-in-map-without-prefetch": noLinkInMapWithoutPrefetch,
        },
      },
    },
    rules: {
      "evc-perf/no-link-in-map-without-prefetch": "warn",
    },
  },
]);

export default eslintConfig;
