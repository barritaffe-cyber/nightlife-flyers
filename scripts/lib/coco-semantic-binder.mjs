function normalizeBinding(binding) {
  if (typeof binding === "string") return { semanticRole: binding };
  return binding && typeof binding === "object" ? binding : {};
}

function primaryFontFamily(value) {
  return String(value || "")
    .split(",")[0]
    .trim()
    .replace(/^['\"]|['\"]$/g, "");
}

export function bindSemanticRoles(document, semanticRoles = {}, fontMap = {}) {
  return {
    ...document,
    objects: document.objects.map((object) => {
      const binding = normalizeBinding(semanticRoles[object.id]);
      const semanticRole = binding.semanticRole ?? object.semanticRole ?? null;
      const mappedFamily = binding.fontFamily ?? fontMap[object.id] ?? fontMap[semanticRole];
      const textRuns = object.textRuns?.map((run) => {
        const runtimeFontFamily = fontMap[primaryFontFamily(run.fontFamily)];
        return runtimeFontFamily
          ? { ...run, runtimeFontFamily }
          : run;
      });
      return {
        ...object,
        ...(textRuns ? { textRuns } : {}),
        semanticRole,
        editable: binding.editable ?? object.editable ?? Boolean(semanticRole),
        binding: {
          ...binding,
          semanticRole,
        },
        ...(object.typography && mappedFamily
          ? {
              typography: {
                ...object.typography,
                sourceFontFamily: object.typography.fontFamily,
                fontFamily: mappedFamily,
              },
            }
          : {}),
      };
    }),
  };
}
