"use client";

import { useEffect, useState } from "react";
import { fetchSettingsUsers, inviteSettingsUser } from "@/services/settings";
import type { SettingsTab, SettingsUser } from "@/types/settings";
import { MyAccount } from "./MyAccount";
import { SettingsSidebar } from "./SettingsSidebar";
import { UsersTable } from "./UsersTable";

export function SettingsPageContent() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");
  const [users, setUsers] = useState<SettingsUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");

  async function refreshUsers() {
    setUsersLoading(true);
    setUsersError("");
    try {
      setUsers(await fetchSettingsUsers());
      setUsersLoaded(true);
    } catch (cause) {
      setUsersError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível carregar os usuários.",
      );
    } finally {
      setUsersLoading(false);
    }
  }

  useEffect(() => {
    if (activeTab !== "users" || usersLoaded) return;
    let active = true;
    fetchSettingsUsers()
      .then((result) => {
        if (active) {
          setUsers(result);
          setUsersLoaded(true);
        }
      })
      .catch((cause) => {
        if (active) {
          setUsersError(
            cause instanceof Error
              ? cause.message
              : "Não foi possível carregar os usuários.",
          );
        }
      })
      .finally(() => {
        if (active) setUsersLoading(false);
      });
    return () => {
      active = false;
    };
  }, [activeTab, usersLoaded]);

  async function handleInvite(email: string) {
    setInviteSuccess("");
    await inviteSettingsUser({ email });
    setInviteSuccess(`Convite enviado para ${email}.`);
    await refreshUsers();
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-col gap-5 md:flex-row">
      <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="min-w-0 flex-1">
        {activeTab === "users" ? (
          <UsersTable
            users={users}
            loading={usersLoading}
            error={usersError}
            successMessage={inviteSuccess}
            onInvite={handleInvite}
          />
        ) : (
          <MyAccount />
        )}
      </main>
    </div>
  );
}
