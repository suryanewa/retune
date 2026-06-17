/**
 * Tuna setup — auto-configure MCP server and install skill for detected AI tools.
 *
 * Usage: npx @suryanewa/tuna setup
 *
 * Detects Codex, Claude Code, and Cursor, then:
 * 1. Configures MCP server in the tool's settings
 * 2. Installs the Tuna skill for resolution guidance
 */

import { existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, dirname, extname, delimiter } from "path";
import { homedir } from "os";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export type SetupTool = "codex" | "claude-code" | "cursor";

export interface SetupOptions {
  tools?: SetupTool[];
  dryRun?: boolean;
  homeDir?: string;
  codexHome?: string | null;
  cwd?: string;
}

interface SetupResult {
  tool: SetupTool;
  mcp: boolean;
  skill: boolean;
}

interface SetupContext {
  homeDir: string;
  codexHome?: string;
  cwd: string;
  dryRun: boolean;
}

const TUNA_MCP_SERVER = {
  command: "npx",
  args: ["-y", "@suryanewa/tuna"],
};

const CODEX_TUNA_TABLE_RE = /^\s*\[mcp_servers\.tuna\]\s*(?:#.*)?$/;
const CODEX_TUNA_HEADER = "[mcp_servers.tuna]";
const CODEX_TUNA_COMMAND = `command = "${TUNA_MCP_SERVER.command}"`;
const CODEX_TUNA_ARGS = `args = ["${TUNA_MCP_SERVER.args.join('", "')}"]`;
const SUPPORTED_TOOLS: SetupTool[] = ["codex", "claude-code", "cursor"];

function log(msg: string) {
  console.log(`[tuna] ${msg}`);
}

function warn(msg: string) {
  console.warn(`[tuna] ⚠ ${msg}`);
}

function uniqueTools(tools: SetupTool[]): SetupTool[] {
  return SUPPORTED_TOOLS.filter(tool => tools.includes(tool));
}

function upsertTomlLine(block: string[], key: string, value: string): string[] {
  const keyRe = new RegExp(`^\\s*${key}\\s*=`);
  const existingIndex = block.findIndex((line, index) => index > 0 && keyRe.test(line));
  if (existingIndex !== -1) {
    const next = [...block];
    next[existingIndex] = value;
    return next;
  }

  const commandIndex = block.findIndex((line, index) => index > 0 && /^\s*command\s*=/.test(line));
  const insertIndex = key === "args" && commandIndex !== -1 ? commandIndex + 1 : 1;
  return [...block.slice(0, insertIndex), value, ...block.slice(insertIndex)];
}

export function upsertCodexMcpConfig(source: string): string {
  const normalized = source.replace(/\r\n/g, "\n").trimEnd();
  const lines = normalized ? normalized.split("\n") : [];
  const tableStart = lines.findIndex(line => CODEX_TUNA_TABLE_RE.test(line));

  if (tableStart === -1) {
    return `${normalized}${normalized ? "\n\n" : ""}${CODEX_TUNA_HEADER}\n${CODEX_TUNA_COMMAND}\n${CODEX_TUNA_ARGS}\n`;
  }

  let tableEnd = tableStart + 1;
  while (tableEnd < lines.length && !/^\s*\[/.test(lines[tableEnd])) {
    tableEnd += 1;
  }

  const currentBlock = lines.slice(tableStart, tableEnd);
  const nextBlock = upsertTomlLine(upsertTomlLine(currentBlock, "command", CODEX_TUNA_COMMAND), "args", CODEX_TUNA_ARGS);

  return [...lines.slice(0, tableStart), ...nextBlock, ...lines.slice(tableEnd)].join("\n") + "\n";
}

/** Find the skill directory (bundled with the npm package) */
function findSkillSource(): string | null {
  // In dist/: dist/cli.js → ../skill/SKILL.md (package root)
  const fromDist = join(__dirname, "..", "skill", "SKILL.md");
  if (existsSync(fromDist)) return dirname(fromDist);

  // During development: src/mcp/ → ../../skill/
  const fromSrc = join(__dirname, "..", "..", "skill", "SKILL.md");
  if (existsSync(fromSrc)) return dirname(fromSrc);

  return null;
}

function createSetupContext(options: SetupOptions = {}): SetupContext {
  return {
    homeDir: options.homeDir ?? homedir(),
    codexHome: options.codexHome === null ? undefined : options.codexHome ?? process.env.CODEX_HOME,
    cwd: options.cwd ?? process.cwd(),
    dryRun: options.dryRun ?? false,
  };
}

function getSkillDir(tool: SetupTool, homeDir: string): string {
  switch (tool) {
    case "codex":
      return join(homeDir, ".agents", "skills", "tuna-visual-changes");
    case "claude-code":
      return join(homeDir, ".claude", "skills", "tuna-visual-changes");
    case "cursor":
      return join(homeDir, ".cursor", "skills", "tuna-visual-changes");
  }
}

function getToolLabel(tool: SetupTool): string {
  switch (tool) {
    case "codex":
      return "Codex";
    case "claude-code":
      return "Claude Code";
    case "cursor":
      return "Cursor";
  }
}

function getCodexConfigDir(ctx: SetupContext): string {
  return ctx.codexHome || join(ctx.homeDir, ".codex");
}

function commandExistsOnPath(command: string): boolean {
  const pathValue = process.env.PATH || "";
  const extensions = process.platform === "win32"
    ? (process.env.PATHEXT || ".EXE;.CMD;.BAT;.COM").split(";")
    : [""];

  for (const dir of pathValue.split(delimiter)) {
    if (!dir) continue;
    for (const ext of extensions) {
      const candidate = join(dir, `${command}${ext}`);
      try {
        if (existsSync(candidate) && statSync(candidate).isFile()) {
          return true;
        }
      } catch {
        // Ignore unreadable PATH entries.
      }
    }
  }

  return false;
}

function installSkill(tool: SetupTool, skillSource: string, ctx: SetupContext): boolean {
  const skillDir = getSkillDir(tool, ctx.homeDir);
  const targetFile = join(skillDir, "SKILL.md");
  const sourceFile = join(skillSource, "SKILL.md");
  const label = getToolLabel(tool);

  try {
    if (ctx.dryRun) {
      log(`Would install ${label} skill: ${targetFile}`);
      return true;
    }

    mkdirSync(skillDir, { recursive: true });
    copyFileSync(sourceFile, targetFile);
    log(`Skill installed: ${targetFile}`);
    return true;
  } catch (err: any) {
    warn(`Could not install ${label} skill: ${err.message}`);
    return false;
  }
}

function setupJsonMcp(tool: Extract<SetupTool, "claude-code" | "cursor">, ctx: SetupContext): boolean {
  const configPath = tool === "claude-code"
    ? join(ctx.homeDir, ".claude", "claude_desktop_config.json")
    : join(ctx.homeDir, ".cursor", "mcp.json");
  const configDir = dirname(configPath);
  const label = getToolLabel(tool);

  try {
    if (ctx.dryRun) {
      log(`Would configure ${label} MCP: ${configPath}`);
      return true;
    }

    mkdirSync(configDir, { recursive: true });

    let config: any = {};
    if (existsSync(configPath)) {
      config = JSON.parse(readFileSync(configPath, "utf-8"));
    }

    if (!config.mcpServers) config.mcpServers = {};

    config.mcpServers.tuna = TUNA_MCP_SERVER;

    writeFileSync(configPath, JSON.stringify(config, null, 2));
    log(`MCP configured: ${configPath}`);
    return true;
  } catch (err: any) {
    warn(`Could not configure ${label} MCP: ${err.message}`);
    return false;
  }
}

function setupCodexMcp(ctx: SetupContext): boolean {
  const configPath = join(getCodexConfigDir(ctx), "config.toml");
  const configDir = dirname(configPath);

  try {
    const existing = existsSync(configPath) ? readFileSync(configPath, "utf-8") : "";
    const next = upsertCodexMcpConfig(existing);

    if (ctx.dryRun) {
      log(`Would configure Codex MCP: ${configPath}`);
      return true;
    }

    mkdirSync(configDir, { recursive: true });
    if (next !== existing) {
      writeFileSync(configPath, next);
    }
    log(`MCP configured: ${configPath}`);
    return true;
  } catch (err: any) {
    warn(`Could not configure Codex MCP: ${err.message}`);
    return false;
  }
}

/** Detect which AI tools are installed */
function detectTools(ctx: SetupContext): SetupTool[] {
  const tools: SetupTool[] = [];

  // Codex — check for CODEX_HOME, ~/.codex, or the CLI on PATH
  if (ctx.codexHome || existsSync(getCodexConfigDir(ctx)) || commandExistsOnPath("codex")) {
    tools.push("codex");
  }

  // Claude Code — check for ~/.claude directory
  if (existsSync(join(ctx.homeDir, ".claude"))) {
    tools.push("claude-code");
  }

  // Cursor — check for ~/.cursor directory
  if (existsSync(join(ctx.homeDir, ".cursor"))) {
    tools.push("cursor");
  }

  return tools;
}

/** Find the public directory for the project's framework.
 *  Checks cwd first, then common monorepo app directories. */
function findPublicDir(cwd: string): string | null {
  // Check if a framework config exists in cwd (indicates this IS the app root)
  const frameworkConfigs = ["next.config.js", "next.config.ts", "next.config.mjs", "vite.config.ts", "vite.config.js", "remix.config.js"];
  const isAppRoot = frameworkConfigs.some(f => existsSync(join(cwd, f)));

  if (isAppRoot) {
    // Direct app root -- check for public/static
    for (const dir of ["public", "static"]) {
      const path = join(cwd, dir);
      if (existsSync(path) && statSync(path).isDirectory()) return path;
    }
    return join(cwd, "public");
  }

  // Monorepo -- look for common app subdirectories with framework configs
  const appDirs = ["app", "client", "web", "frontend", "packages/app", "packages/web", "apps/web", "apps/client"];
  for (const appDir of appDirs) {
    const appPath = join(cwd, appDir);
    if (!existsSync(appPath)) continue;
    const hasConfig = frameworkConfigs.some(f => existsSync(join(appPath, f)));
    if (hasConfig) {
      for (const dir of ["public", "static"]) {
        const path = join(appPath, dir);
        if (existsSync(path) && statSync(path).isDirectory()) return path;
      }
      return join(appPath, "public");
    }
  }

  // Fallback: cwd/public
  return join(cwd, "public");
}

/** Scan CSS files for custom properties and extract tokens */
function extractTokensFromCss(cwd: string): Record<string, Record<string, { value: string; variable: string }>> {
  const tokens: Record<string, Record<string, { value: string; variable: string }>> = {};
  const cssVarRe = /--([\w-]+)\s*:\s*([^;]+)/g;

  // Framework internal prefixes to skip
  const skipPrefixes = ["tw-", "chakra-", "mantine-", "radix-", "nextui-"];

  function scanDir(dir: string) {
    if (!existsSync(dir)) return;
    try {
      for (const entry of readdirSync(dir)) {
        const fullPath = join(dir, entry);
        try {
          const stat = statSync(fullPath);
          if (stat.isDirectory()) {
            // Skip node_modules, .git, dist, build
            if (["node_modules", ".git", "dist", "build", ".next", ".cache"].includes(entry)) continue;
            scanDir(fullPath);
          } else if ([".css", ".scss", ".less"].includes(extname(entry))) {
            const content = readFileSync(fullPath, "utf-8");
            let match;
            while ((match = cssVarRe.exec(content)) !== null) {
              const name = match[1];
              const value = match[2].trim();

              // Skip framework internals
              if (skipPrefixes.some(p => name.startsWith(p))) continue;
              // Skip empty or var() reference values
              if (!value || value.startsWith("var(")) continue;

              // Categorize by name pattern
              let category: string | null = null;
              if (/^(color|bg|text-color|border-color|foreground|background|accent|brand|primary|secondary|success|danger|warning|error)/i.test(name)) {
                category = "colors";
              } else if (/^(spacing|space|gap|pad|margin)/i.test(name)) {
                category = "spacing";
              } else if (/^(size|width|height)/i.test(name)) {
                category = "sizing";
              } else if (/^(radius|border-radius)/i.test(name)) {
                category = "radii";
              } else if (/^(border-width)/i.test(name)) {
                category = "borderWidths";
              } else if (/^(shadow|elevation)/i.test(name)) {
                category = "shadows";
              } else if (/^(font|text|leading|tracking|letter)/i.test(name)) {
                category = "typography";
              }

              if (!category) continue;

              if (!tokens[category]) tokens[category] = {};
              tokens[category][name] = { value, variable: `--${name}` };
            }
          }
        } catch { /* permission errors, etc. */ }
      }
    } catch { /* read errors */ }
  }

  // Scan common source directories
  for (const dir of ["src", "app", "styles", "css", "."]) {
    scanDir(join(cwd, dir === "." ? "" : dir));
  }

  return tokens;
}

/** Generate or update the manifest with extracted tokens */
function generateManifest(ctx: SetupContext): boolean {
  const publicDir = findPublicDir(ctx.cwd);
  if (!publicDir) return false;

  const manifestPath = join(publicDir, "tuna.manifest.json");

  // Check if manifest already exists
  let manifest: Record<string, any> = {};
  if (existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
      if (manifest.tokens) {
        // Tokens already exist, don't overwrite
        return false;
      }
    } catch { /* invalid JSON, regenerate */ }
  }

  const tokens = extractTokensFromCss(ctx.cwd);
  const tokenCount = Object.values(tokens).reduce((sum, cat) => sum + Object.keys(cat).length, 0);

  if (tokenCount === 0) {
    log("No CSS custom properties found in the project.");
    return false;
  }

  manifest.version = 2;
  manifest.tokens = tokens;

  // Ensure public directory exists
  if (ctx.dryRun) {
    log(`Would generate manifest: ${manifestPath} (${tokenCount} tokens)`);
    return true;
  }

  if (!existsSync(publicDir)) {
    mkdirSync(publicDir, { recursive: true });
  }

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  log(`Manifest generated: ${manifestPath} (${tokenCount} tokens)`);
  return true;
}

export async function setup(options: SetupOptions = {}) {
  const ctx = createSetupContext(options);
  log(`Setting up Tuna${ctx.dryRun ? " (dry run)" : ""}...\n`);

  const tools = options.tools ? uniqueTools(options.tools) : detectTools(ctx);
  if (tools.length === 0) {
    warn("No supported AI tools detected (Codex, Claude Code, Cursor).");
    log("Install Codex, Claude Code, or Cursor, then run this command again.");
    log("You can also target a tool explicitly, for example: npx @suryanewa/tuna setup --codex");
    return;
  }

  log(`Detected: ${tools.join(", ")}\n`);

  const skillSource = findSkillSource();
  if (!skillSource) {
    warn("Could not find skill files. The package may be incomplete.");
  }

  const results: SetupResult[] = [];

  for (const tool of tools) {
    const result: SetupResult = { tool, mcp: false, skill: false };

    switch (tool) {
      case "codex":
        result.mcp = setupCodexMcp(ctx);
        if (skillSource) {
          result.skill = installSkill("codex", skillSource, ctx);
        }
        break;

      case "claude-code":
        result.mcp = setupJsonMcp("claude-code", ctx);
        if (skillSource) {
          result.skill = installSkill("claude-code", skillSource, ctx);
        }
        break;

      case "cursor":
        result.mcp = setupJsonMcp("cursor", ctx);
        if (skillSource) {
          result.skill = installSkill("cursor", skillSource, ctx);
        }
        break;
    }

    results.push(result);
  }

  // Generate manifest with tokens
  const manifestGenerated = generateManifest(ctx);

  // Summary
  console.log("\n--- Setup Summary ---\n");
  for (const r of results) {
    const mcpStatus = r.mcp ? (ctx.dryRun ? "would configure" : "configured") : "manual setup needed";
    const skillStatus = r.skill ? (ctx.dryRun ? "would install" : "installed") : "not installed";
    console.log(`  ${r.tool}: MCP ${mcpStatus}, Skill ${skillStatus}`);
  }
  if (manifestGenerated) {
    console.log(`  manifest: ${ctx.dryRun ? "would extract tokens" : "tokens extracted"}`);
  }
  console.log("");

  // Prompt the agent to complete the manifest with components
  if (manifestGenerated) {
    console.log("--- Next Step ---\n");
    console.log("The manifest has design tokens but needs component definitions.");
    console.log("Scan the project's React components and add them to the");
    console.log("\"components\" section of tuna.manifest.json.\n");
    console.log("For each component, include:");
    console.log("  - Props with types (string, number, boolean, enum, function)");
    console.log("  - For enum props, list all allowed values");
    console.log("  - For props that map to CSS classes, include class_map");
    console.log("  - For components with useState, include state hooks");
    console.log("");
    console.log("After updating the manifest, call tuna_manifest_loaded");
    console.log("to notify the overlay.\n");
  }
}
