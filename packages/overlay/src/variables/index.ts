export type { DesignVariable, VariableCategory, VariableRegistry, VariableMatch, CssFramework } from "./types";
export { getVariableRegistry, invalidateVariableRegistry, isTailwind } from "./registry";
export { getCategoryForProperty, getPropertiesForCategory, getCategoryForCamelProp } from "./categories";
export { resolveVariablesForElement, findVariableForValue, isTailwindUtility, isRawUtility, getVariablesForProperty, hasVariablesForProperty, setManifestTokens } from "./resolver";
