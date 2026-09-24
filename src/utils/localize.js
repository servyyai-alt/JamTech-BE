// Lightweight locale resolver for multilingual database content.
// Models store the default (English) value on the top-level field buckets
// (e.g. `name`, `title`) plus optional overrides under `translations.{lang}`.
// When a `lang` query param is present and differs from the default, the
// matching overrides are copied onto the document (including populated refs).
const NESTED_PATHS = [
  "category",
  "deviceCategory",
  "brand",
  "deviceModel",
  "deviceVariant",
  "repairService",
  "repairPrice",
  "product",
];

export function localizeDoc(doc, lang) {
  if (!doc || !lang || lang === "en") return doc;

  const apply = (node) => {
    if (!node) return;
    if (Array.isArray(node)) {
      node.forEach(apply);
      return;
    }
    if (typeof node !== "object") return;

    const isMongooseDoc = typeof node.toObject === "function";
    const raw = isMongooseDoc ? node : node;

    if (raw.translations && raw.translations[lang]) {
      // If it's a Mongoose document, we need to convert the translations to a JS object
      const translations = isMongooseDoc && typeof raw.translations[lang].toObject === "function" 
        ? raw.translations[lang].toObject() 
        : raw.translations[lang];
        
      for (const [key, value] of Object.entries(translations)) {
        if (value !== undefined && value !== null && value !== "" && raw[key] !== undefined) {
          raw[key] = value;
        }
      }
    }

    NESTED_PATHS.forEach((path) => {
      if (raw[path]) apply(raw[path]);
    });
  };

  apply(doc);
  return doc;
}

export function localizeDocs(docs, lang) {
  if (!docs || !lang || lang === "en") return docs;
  if (Array.isArray(docs)) {
    docs.forEach((doc) => localizeDoc(doc, lang));
    return docs;
  }
  return localizeDoc(docs, lang);
}