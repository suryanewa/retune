/**
 * Debug script — run via MCP or paste into Claude Code:
 *   node -e "import('./packages/overlay/src/debug-tokens.ts')"
 *
 * Or paste this into Claude Code connected to your work project's retune MCP:
 *
 * retune_status
 *
 * Then paste the following into the BROWSER CONSOLE on your work project:
 */

// === PASTE THIS ENTIRE BLOCK INTO BROWSER CONSOLE ===
(function retuneTokenDebug() {
  const results = { manifest: null, scannedVars: {}, utilityClasses: {}, categories: {}, overlap: {} };

  // 1. Check manifest
  try {
    const manifestEl = document.querySelector('link[href*="retune.manifest"], script[src*="retune.manifest"]');
    const fetches = performance.getEntriesByType('resource').filter(r => r.name.includes('retune.manifest'));
    results.manifest = { found: fetches.length > 0, urls: fetches.map(f => f.name) };
  } catch(e) { results.manifest = { error: e.message }; }

  // 2. Count CSS variables by category
  const varsByCategory = { spacing: [], color: [], radius: [], shadow: [], font: [], other: [] };
  try {
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (!rule.style) continue;
          for (let i = 0; i < rule.style.length; i++) {
            const prop = rule.style[i];
            if (!prop.startsWith('--')) continue;
            const val = rule.style.getPropertyValue(prop).trim();
            if (prop.match(/spacing|space|gap/i)) varsByCategory.spacing.push({ prop, val });
            else if (prop.match(/color|bg|foreground|line-color|brand|purple|alert|positive/i)) varsByCategory.color.push({ prop, val });
            else if (prop.match(/radius|rounded/i)) varsByCategory.radius.push({ prop, val });
            else if (prop.match(/shadow|elevation/i)) varsByCategory.shadow.push({ prop, val });
            else if (prop.match(/font|text|line-height|letter/i)) varsByCategory.font.push({ prop, val });
          }
        }
      } catch(e) {} // cross-origin
    }
  } catch(e) {}
  results.scannedVars = {
    spacing: varsByCategory.spacing.length,
    color: varsByCategory.color.length,
    radius: varsByCategory.radius.length,
    shadow: varsByCategory.shadow.length,
    font: varsByCategory.font.length,
    spacingSample: varsByCategory.spacing.slice(0, 10),
    colorSample: varsByCategory.color.slice(0, 10),
  };

  // 3. Count utility classes in DOM by category
  const classes = { spacing: new Set(), color: new Set(), radius: new Set(), font: new Set(), other: new Set() };
  document.querySelectorAll('*').forEach(el => {
    el.classList.forEach(c => {
      if (c.match(/^(p|m|gap|space)-|^p[xytblr]-|^m[xytblr]-/)) classes.spacing.add(c);
      else if (c.match(/^(bg-|text-|border-|from-|to-|via-)/) && !c.match(/^text-(xs|sm|base|lg|xl|2xl)/)) classes.color.add(c);
      else if (c.match(/^rounded/)) classes.radius.add(c);
      else if (c.match(/^(font-|text-(xs|sm|base|lg|xl)|leading-|tracking-)/)) classes.font.add(c);
    });
  });
  results.utilityClasses = {
    spacing: classes.spacing.size,
    color: classes.color.size,
    radius: classes.radius.size,
    font: classes.font.size,
    spacingSample: [...classes.spacing].sort().slice(0, 15),
    colorSample: [...classes.color].sort().slice(0, 15),
  };

  // 4. Check manifest fetch
  fetch('/retune.manifest.json').then(r => r.ok ? r.json() : null).then(manifest => {
    if (manifest) {
      results.manifestData = {
        hasTokens: !!manifest.tokens,
        hasComponents: !!manifest.components,
        tokenCategories: manifest.tokens ? Object.keys(manifest.tokens) : [],
        componentCount: manifest.components ? Object.keys(manifest.components).length : 0,
        componentNames: manifest.components ? Object.keys(manifest.components) : [],
        spacingTokenCount: manifest.tokens?.spacing ? Object.keys(manifest.tokens.spacing).length : 0,
        colorGroupCount: manifest.tokens?.colors ? Object.keys(manifest.tokens.colors).length : 0,
      };
    } else {
      results.manifestData = { notFound: true };
    }
    console.log('\n=== RETUNE TOKEN DEBUG ===');
    console.log(JSON.stringify(results, null, 2));
    console.log('=== END DEBUG ===\n');
  }).catch(() => {
    console.log('\n=== RETUNE TOKEN DEBUG ===');
    console.log(JSON.stringify(results, null, 2));
    console.log('=== END DEBUG ===\n');
  });
})();
