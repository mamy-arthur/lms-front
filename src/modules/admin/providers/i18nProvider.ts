import polyglotI18nProvider from "ra-i18n-polyglot";
import fr from "ra-language-french";

const customFrMessages = {
  ...fr,
  ra: {
    ...fr.ra,
    page: {
      ...fr.ra.page,
      dashboard: "Tableau de bord",
    },
  },
};

export const i18nProvider = polyglotI18nProvider(() => customFrMessages, "fr");
