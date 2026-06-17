import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { afterEach, describe, expect, it } from "vitest";
import { setup, upsertCodexMcpConfig } from "../mcp/setup";

const tempRoots: string[] = [];

function makeTempRoot() {
  const root = mkdtempSync(join(tmpdir(), "tuna-setup-"));
  tempRoots.push(root);
  return root;
}

function makeAppRoot(root: string) {
  const app = join(root, "app");
  mkdirSync(join(app, "public"), { recursive: true });
  writeFileSync(join(app, "vite.config.ts"), "export default {};\n");
  return app;
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe("upsertCodexMcpConfig", () => {
  it("adds Tuna as a Codex MCP server", () => {
    expect(upsertCodexMcpConfig("")).toBe([
      "[mcp_servers.tuna]",
      'command = "npx"',
      'args = ["-y", "@suryanewa/tuna"]',
      "",
    ].join("\n"));
  });

  it("preserves unrelated config and is idempotent", () => {
    const source = [
      'model = "gpt-5.5"',
      "",
      "[mcp_servers.linear]",
      'command = "linear-mcp"',
      "",
      "[mcp_servers.linear.env]",
      'LINEAR_TOKEN = "from-env"',
      "",
    ].join("\n");

    const first = upsertCodexMcpConfig(source);
    const second = upsertCodexMcpConfig(first);

    expect(second).toBe(first);
    expect(first).toContain("[mcp_servers.linear]");
    expect(first).toContain("[mcp_servers.linear.env]");
    expect(first.match(/\[mcp_servers\.tuna\]/g)).toHaveLength(1);
    expect(first).toContain('command = "npx"');
    expect(first).toContain('args = ["-y", "@suryanewa/tuna"]');
  });

  it("updates an existing Tuna MCP table without touching other servers", () => {
    const source = [
      "[mcp_servers.tuna]",
      'command = "old"',
      'args = ["old-package"]',
      'startup_timeout_sec = 20',
      "",
      "[mcp_servers.node_repl]",
      'command = "node-repl"',
      "",
    ].join("\n");

    const next = upsertCodexMcpConfig(source);

    expect(next).toContain("[mcp_servers.node_repl]");
    expect(next).toContain("startup_timeout_sec = 20");
    expect(next).toContain('command = "npx"');
    expect(next).toContain('args = ["-y", "@suryanewa/tuna"]');
    expect(next).not.toContain('command = "old"');
    expect(next).not.toContain('args = ["old-package"]');
  });
});

describe("setup", () => {
  it("auto-detects a Codex CLI on PATH", async () => {
    const root = makeTempRoot();
    const homeDir = join(root, "home");
    const cwd = makeAppRoot(root);
    const bin = join(root, "bin");
    const oldPath = process.env.PATH;
    mkdirSync(bin, { recursive: true });
    writeFileSync(join(bin, "codex"), "#!/bin/sh\n");

    try {
      process.env.PATH = bin;
      await setup({ homeDir, cwd, codexHome: null });
    } finally {
      process.env.PATH = oldPath;
    }

    const config = readFileSync(join(homeDir, ".codex", "config.toml"), "utf-8");
    expect(config).toContain("[mcp_servers.tuna]");
  });

  it("configures Codex in CODEX_HOME and installs the Codex skill", async () => {
    const root = makeTempRoot();
    const homeDir = join(root, "home");
    const codexHome = join(root, "codex-profile");
    const cwd = makeAppRoot(root);

    mkdirSync(codexHome, { recursive: true });
    writeFileSync(join(codexHome, "config.toml"), [
      'model = "gpt-5.5"',
      "",
      "[mcp_servers.linear]",
      'command = "linear-mcp"',
      "",
    ].join("\n"));

    await setup({ tools: ["codex"], homeDir, codexHome, cwd });

    const config = readFileSync(join(codexHome, "config.toml"), "utf-8");
    expect(config).toContain('model = "gpt-5.5"');
    expect(config).toContain("[mcp_servers.linear]");
    expect(config).toContain("[mcp_servers.tuna]");
    expect(config).toContain('command = "npx"');
    expect(config).toContain('args = ["-y", "@suryanewa/tuna"]');
    expect(readFileSync(join(homeDir, ".agents", "skills", "tuna-visual-changes", "SKILL.md"), "utf-8")).toContain("name: tuna-visual-changes");
  });

  it("auto-detects Codex, Claude Code, and Cursor without breaking existing JSON config", async () => {
    const root = makeTempRoot();
    const homeDir = join(root, "home");
    const cwd = makeAppRoot(root);

    mkdirSync(join(homeDir, ".codex"), { recursive: true });
    mkdirSync(join(homeDir, ".claude"), { recursive: true });
    mkdirSync(join(homeDir, ".cursor"), { recursive: true });
    writeFileSync(join(homeDir, ".claude", "claude_desktop_config.json"), JSON.stringify({
      mcpServers: {
        linear: { command: "linear-mcp" },
      },
    }, null, 2));
    writeFileSync(join(homeDir, ".cursor", "mcp.json"), JSON.stringify({
      mcpServers: {
        node_repl: { command: "node-repl" },
      },
    }, null, 2));

    await setup({ homeDir, cwd, codexHome: null });

    const codexConfig = readFileSync(join(homeDir, ".codex", "config.toml"), "utf-8");
    const claudeConfig = JSON.parse(readFileSync(join(homeDir, ".claude", "claude_desktop_config.json"), "utf-8"));
    const cursorConfig = JSON.parse(readFileSync(join(homeDir, ".cursor", "mcp.json"), "utf-8"));

    expect(codexConfig).toContain("[mcp_servers.tuna]");
    expect(claudeConfig.mcpServers.linear).toEqual({ command: "linear-mcp" });
    expect(claudeConfig.mcpServers.tuna).toEqual({ command: "npx", args: ["-y", "@suryanewa/tuna"] });
    expect(cursorConfig.mcpServers.node_repl).toEqual({ command: "node-repl" });
    expect(cursorConfig.mcpServers.tuna).toEqual({ command: "npx", args: ["-y", "@suryanewa/tuna"] });
  });

  it("does not write config, skill, or manifest files during dry run", async () => {
    const root = makeTempRoot();
    const homeDir = join(root, "home");
    const codexHome = join(root, "codex-profile");
    const cwd = makeAppRoot(root);
    writeFileSync(join(cwd, "style.css"), ":root { --color-brand: #e89999; }\n");

    await setup({ tools: ["codex"], homeDir, codexHome, cwd, dryRun: true });

    expect(existsSync(join(codexHome, "config.toml"))).toBe(false);
    expect(existsSync(join(homeDir, ".agents", "skills", "tuna-visual-changes", "SKILL.md"))).toBe(false);
    expect(existsSync(join(cwd, "public", "tuna.manifest.json"))).toBe(false);
  });
});
