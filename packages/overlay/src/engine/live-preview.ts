/**
 * Live preview engine using Constructable Stylesheets.
 *
 * Applies CSS changes to the host document without touching existing
 * stylesheets. Changes are instantly reversible by removing the sheet
 * from adoptedStyleSheets.
 */

import { camelToKebab } from "../utils";

interface AppliedRule {
  selector: string;
  property: string;
  value: string;
  index: number;
}

export class LivePreviewEngine {
  private sheet: CSSStyleSheet;
  private rules: AppliedRule[] = [];
  private attached = false;

  constructor() {
    this.sheet = new CSSStyleSheet();
  }

  /** Attach the preview stylesheet to the document */
  attach() {
    if (this.attached) return;
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, this.sheet];
    this.attached = true;
  }

  /** Detach — instantly reverts all preview changes */
  detach() {
    if (!this.attached) return;
    document.adoptedStyleSheets = document.adoptedStyleSheets.filter(
      (s) => s !== this.sheet
    );
    this.attached = false;
  }

  /** Apply a single property change with !important to override existing styles */
  applyChange(selector: string, property: string, value: string) {
    // Remove existing rule for this selector+property if any
    this.removeChange(selector, property);

    const kebabProp = camelToKebab(property);
    const rule = `${selector} { ${kebabProp}: ${value} !important; }`;
    try {
      const index = this.sheet.insertRule(rule, this.sheet.cssRules.length);
      this.rules.push({ selector, property, value, index });
    } catch {
      // Invalid CSS value or selector — skip silently
    }
  }

  /** Remove a specific property change */
  removeChange(selector: string, property: string) {
    const ruleIndex = this.rules.findIndex(
      (r) => r.selector === selector && r.property === property
    );
    if (ruleIndex === -1) return;

    // Delete from stylesheet — indices shift, so rebuild
    this.rebuildSheet(
      this.rules.filter((_, i) => i !== ruleIndex)
    );
  }

  /** Remove all changes for a selector */
  removeAllChanges(selector: string) {
    this.rebuildSheet(
      this.rules.filter((r) => r.selector !== selector)
    );
  }

  /** Clear all preview changes */
  clearAll() {
    this.sheet.replaceSync("");
    this.rules = [];
  }

  /** Get all currently applied changes */
  getChanges(): ReadonlyArray<AppliedRule> {
    return this.rules;
  }

  /** Migrate all changes from one selector to another */
  migrateChanges(fromSelector: string, toSelector: string) {
    const toMigrate = this.rules.filter((r) => r.selector === fromSelector);
    if (toMigrate.length === 0) return;
    // Remove old rules
    this.removeAllChanges(fromSelector);
    // Re-apply under new selector
    for (const rule of toMigrate) {
      this.applyChange(toSelector, rule.property, rule.value);
    }
  }

  private rebuildSheet(newRules: AppliedRule[]) {
    this.sheet.replaceSync("");
    this.rules = [];
    // Re-insert rules individually; applyChange handles errors per-rule
    for (const r of newRules) {
      this.applyChange(r.selector, r.property, r.value);
    }
  }

  destroy() {
    this.detach();
    this.clearAll();
  }
}

