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
  breakpoint?: string | null;
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
  applyChange(selector: string, property: string, value: string, breakpoint?: string | null) {
    // Remove existing rule for this selector+property+breakpoint if any
    this.removeChange(selector, property, breakpoint);

    const kebabProp = camelToKebab(property);
    const innerRule = `${selector} { ${kebabProp}: ${value} !important; }`;
    const rule = breakpoint ? `@media (max-width: ${breakpoint}) { ${innerRule} }` : innerRule;
    try {
      const index = this.sheet.insertRule(rule, this.sheet.cssRules.length);
      this.rules.push({ selector, property, value, index, breakpoint: breakpoint || null });
    } catch {
      // Invalid CSS value or selector — skip silently
    }
  }

  /** Remove a specific property change */
  removeChange(selector: string, property: string, breakpoint?: string | null) {
    const bp = breakpoint || null;
    const ruleIndex = this.rules.findIndex(
      (r) => r.selector === selector && r.property === property && (r.breakpoint || null) === bp
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
    for (const rule of toMigrate) {
      this.applyChange(toSelector, rule.property, rule.value, rule.breakpoint);
    }
    for (const rule of toMigrate) {
      this.removeChange(fromSelector, rule.property, rule.breakpoint);
    }
  }

  private rebuildSheet(newRules: AppliedRule[]) {
    this.sheet.replaceSync("");
    this.rules = [];
    for (const r of newRules) {
      this.applyChange(r.selector, r.property, r.value, r.breakpoint);
    }
  }

  destroy() {
    this.detach();
    this.clearAll();
  }
}

