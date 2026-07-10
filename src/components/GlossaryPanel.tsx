import { useMemo, useState } from "react";
import { glossaryTerms } from "../lib/glossary";
import type { GlossaryCategory } from "../lib/glossary";
import type { Language } from "../lib/i18n";

const categoryKeys: Array<"all" | GlossaryCategory> = ["all", "market", "options", "risk", "model", "filters"];

export function GlossaryPanel({ language }: { language: Language }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | GlossaryCategory>("all");

  const filteredTerms = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return glossaryTerms.filter((term) => {
      const matchesCategory = category === "all" || term.category === category;
      const matchesQuery =
        !normalizedQuery ||
        term.label.toLowerCase().includes(normalizedQuery) ||
        term.short.toLowerCase().includes(normalizedQuery) ||
        term.long.toLowerCase().includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  return (
    <section className="glossary-panel" aria-label={language === "es" ? "Glosario rapido" : "Quick glossary"}>
      <div className="audit-title-row">
        <div>
          <p className="terminal-label">{language === "es" ? "Terminos tecnicos" : "Technical terms"}</p>
          <h2>{language === "es" ? "Glosario rapido" : "Quick Glossary"}</h2>
        </div>
        <label className="glossary-search">
          <span>{language === "es" ? "Buscar" : "Search"}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Max Pain, IV, DTE..."
          />
        </label>
      </div>

      <div className="glossary-tabs" aria-label="Filtrar glosario por categoria">
        {categoryKeys.map((item) => (
          <button
            className={category === item ? "is-active" : ""}
            key={item}
            onClick={() => setCategory(item)}
            type="button"
          >
            {categoryLabel(item, language)}
          </button>
        ))}
      </div>

      <div className="glossary-grid">
        {filteredTerms.map((term) => (
          <article className="glossary-card" key={term.key}>
            <span>{categoryLabel(term.category, language)}</span>
            <h3>{term.label}</h3>
            <p>{term.short}</p>
            <small>{term.long}</small>
          </article>
        ))}
      </div>

      <p className="glossary-disclaimer">
        {language === "es"
          ? "Estas definiciones ayudan a interpretar el dashboard. No son senales automaticas de compra o venta."
          : "These definitions help interpret the dashboard. They are not automatic buy or sell signals."}
      </p>
    </section>
  );
}

function categoryLabel(category: "all" | GlossaryCategory, language: Language): string {
  const labels: Record<"all" | GlossaryCategory, { es: string; en: string }> = {
    all: { es: "Todos", en: "All" },
    market: { es: "Mercado", en: "Market" },
    options: { es: "Opciones", en: "Options" },
    risk: { es: "Riesgo", en: "Risk" },
    model: { es: "Modelo", en: "Model" },
    filters: { es: "Filtros", en: "Filters" },
  };

  return labels[category][language];
}
