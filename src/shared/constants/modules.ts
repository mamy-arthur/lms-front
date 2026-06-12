export const CATEGORY_OPTIONS = [
  { value: "formation", label: "Formation" },
  { value: "specialisation", label: "Spécialisation" },
  { value: "certification", label: "Certification" },
  { value: "parcours", label: "Parcours" },
] as const;

export type ModuleCategoryValue = (typeof CATEGORY_OPTIONS)[number]["value"];
