"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  getStoredMockAuthUser,
  removeStoredMockAuthUser,
} from "@/lib/mock-auth";
import type { MockAuthUser } from "@/types/auth";

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [authUser, setAuthUser] = useState<MockAuthUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let active = true;

    queueMicrotask(() => {
      if (!active) {
        return;
      }

      const storedUser = getStoredMockAuthUser();
      setAuthUser(storedUser);
      setCheckingSession(false);

      if (pathname === "/login" && storedUser) {
        router.replace("/");
        return;
      }

      if (pathname !== "/login" && !storedUser) {
        router.replace("/login");
      }
    });

    return () => {
      active = false;
    };
  }, [pathname, router]);

  function handleLogout() {
    removeStoredMockAuthUser();
    setAuthUser(null);
    router.replace("/login");
  }

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-[12px] text-[#717182]">
        Carregando...
      </div>
    );
  }

  if (pathname === "/login") {
    if (authUser) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-white text-[12px] text-[#717182]">
          Carregando...
        </div>
      );
    }

    return <>{children}</>;
  }

  if (!authUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-[12px] text-[#717182]">
        Carregando...
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white text-gray-950">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((current) => !current)}
        user={authUser}
        onLogout={handleLogout}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="min-h-0 flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
