import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const messagesRoot = join(currentDirectory, "..", "messages");
const locales = ["en", "ar"];

function flattenKeys(value, prefix = "") {
  if (value === null || Array.isArray(value) || typeof value !== "object") {
    return [prefix];
  }

  return Object.entries(value).flatMap(([key, nestedValue]) =>
    flattenKeys(nestedValue, prefix ? `${prefix}.${key}` : key),
  );
}

function readCatalog(locale, fileName) {
  const catalogPath = join(messagesRoot, locale, fileName);
  return JSON.parse(readFileSync(catalogPath, "utf8"));
}

const [defaultLocale, ...otherLocales] = locales;
const defaultFiles = readdirSync(join(messagesRoot, defaultLocale)).filter(
  (fileName) => fileName.endsWith(".json"),
);

let hasError = false;

for (const locale of otherLocales) {
  const localeFiles = readdirSync(join(messagesRoot, locale)).filter(
    (fileName) => fileName.endsWith(".json"),
  );

  const missingFiles = defaultFiles.filter(
    (fileName) => !localeFiles.includes(fileName),
  );
  const extraFiles = localeFiles.filter(
    (fileName) => !defaultFiles.includes(fileName),
  );

  for (const fileName of missingFiles) {
    hasError = true;
    console.error(`${locale}/${fileName} is missing`);
  }

  for (const fileName of extraFiles) {
    hasError = true;
    console.error(`${locale}/${fileName} has no ${defaultLocale} match`);
  }

  for (const fileName of defaultFiles) {
    if (!localeFiles.includes(fileName)) {
      continue;
    }

    const defaultKeys = flattenKeys(
      readCatalog(defaultLocale, fileName),
    ).sort();
    const localeKeys = flattenKeys(readCatalog(locale, fileName)).sort();
    const missingKeys = defaultKeys.filter((key) => !localeKeys.includes(key));
    const extraKeys = localeKeys.filter((key) => !defaultKeys.includes(key));

    for (const key of missingKeys) {
      hasError = true;
      console.error(`${locale}/${fileName} missing key: ${key}`);
    }

    for (const key of extraKeys) {
      hasError = true;
      console.error(`${locale}/${fileName} extra key: ${key}`);
    }
  }
}

if (hasError) {
  process.exitCode = 1;
} else {
  console.log("i18n catalogs are in parity");
}
