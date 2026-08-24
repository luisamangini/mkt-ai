"use client";

import { useTheme, type ThemePreference } from "@/components/theme/ThemeProvider";

const options: Array<{ value: ThemePreference; label: string }> = [
  { value: "light", label: "Claro" },
  { value: "dark", label: "Escuro" },
  { value: "system", label: "Sistema" },
];

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();

  return (
    <section className="rounded-[10px] border border-border bg-card text-card-foreground">
      <header className="border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold">Aparência</h2>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Escolha como a plataforma será exibida.
        </p>
      </header>
      <div className="flex flex-wrap gap-2 p-5" role="radiogroup" aria-label="Tema da aplicação">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={theme === option.value}
            onClick={() => setTheme(option.value)}
            className={`h-9 rounded-md border px-4 text-[11px] font-medium transition-colors ${
              theme === option.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-foreground hover:bg-muted"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </section>
  );
}
