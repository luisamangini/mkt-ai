"use client";

import { useState } from "react";
import {
  permissionRows,
  settingsUsers,
} from "@/lib/mock-data/settings";
import type { SettingsTab } from "@/types/settings";
import { PermissionsTable } from "./PermissionsTable";
import { SettingsSidebar } from "./SettingsSidebar";
import { UsersTable } from "./UsersTable";

export function SettingsPageContent() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("users");

  return (
    <div className="flex min-h-0 min-w-0 flex-col gap-5 md:flex-row">
      <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="min-w-0 flex-1">
        {activeTab === "users" ? (
          <UsersTable users={settingsUsers} />
        ) : (
          <PermissionsTable rows={permissionRows} />
        )}
      </main>
    </div>
  );
}
