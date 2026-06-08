/** @type {import('next').NextConfig} */
const path = require("path");
const fs = require("fs");

function readRetuneVersion() {
  const candidates = [
    path.join(__dirname, "node_modules", "retune", "package.json"),
    path.join(__dirname, "..", "packages", "overlay", "package.json"),
  ];

  for (const pkgPath of candidates) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      if (pkg.version) return pkg.version;
    } catch {}
  }

  return "0.0.0";
}

const nextConfig = {
  transpilePackages: ["retune"],
  outputFileTracingRoot: path.join(__dirname, ".."),
  env: {
    RETUNE_VERSION: readRetuneVersion(),
  },
};

module.exports = nextConfig;
