import type { SettingsTab } from "@/types/settings";

type SettingsSidebarProps = {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
};

const tabs: Array<{ id: SettingsTab; label: string }> = [
  { id: "users", label: "Usuários" },
  { id: "permissions", label: "Permissões" },
];

export function SettingsSidebar({
  activeTab,
  onTabChange,
}: SettingsSidebarProps) {
  return (
    <aside className="shrink-0 border-black/10 md:w-[220px] md:border-r md:pr-4">
      <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`h-9 shrink-0 rounded-md px-3 text-left text-[12px] font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-gray-100 text-[#0A0A0A]"
                : "text-[#717182] hover:bg-gray-50 hover:text-[#0A0A0A]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
