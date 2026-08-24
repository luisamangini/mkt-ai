import type { SettingsTab } from "@/types/settings";

type SettingsSidebarProps = {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
};

const tabs: Array<{ id: SettingsTab; label: string }> = [
  { id: "account", label: "Minha conta" },
  { id: "users", label: "Usuários" },
];

export function SettingsSidebar({
  activeTab,
  onTabChange,
}: SettingsSidebarProps) {
  return (
    <aside className="shrink-0 border-border md:w-[220px] md:border-r md:pr-4">
      <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`h-9 shrink-0 rounded-md px-3 text-left text-[12px] font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
