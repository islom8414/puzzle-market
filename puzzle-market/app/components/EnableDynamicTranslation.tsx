"use client";

import { useEffect } from "react";

const ROOT_TRANSLATION_ATTRIBUTES = [
  "translate",
  "data-no-translation",
  "data-linguise-ignore",
] as const;

export default function EnableDynamicTranslation() {
  useEffect(() => {
    const roots = [
      document.documentElement,
      document.body,
    ];

    for (const root of roots) {
      root.classList.remove("notranslate");

      for (const attribute of ROOT_TRANSLATION_ATTRIBUTES) {
        root.removeAttribute(attribute);
      }
    }
  }, []);

  return null;
}
