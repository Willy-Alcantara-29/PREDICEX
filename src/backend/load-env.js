const fs = require("fs");
const path = require("path");

function loadEnvFile(filePath = path.resolve(process.cwd(), ".env")) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) {
      continue;
    }

    const [, key, value] = match;
    const normalizedValue = value.trim();
    const unquoted =
      (normalizedValue.startsWith('"') && normalizedValue.endsWith('"')) ||
      (normalizedValue.startsWith("'") && normalizedValue.endsWith("'"))
        ? normalizedValue.slice(1, -1)
        : normalizedValue;

    if (!process.env[key]) {
      process.env[key] = unquoted;
    }
  }
}

loadEnvFile();

module.exports = { loadEnvFile };
