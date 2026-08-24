"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isPublicAuthRoute =
    pathname === "/login" ||
    pathname === "/definir-senha" ||
    pathname === "/redefinir-senha";
  const [collapsed, setCollapsed] = useState(false);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const metadataName = authUser?.user_metadata.name;
  const userLabel = typeof metadataName === "string" && metadataName.trim()
    ? metadataName.trim()
    : authUser?.email ?? "";

  useEffect(() => {
    let active = true;

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;

      const user = session?.user ?? null;
      setAuthUser(user);
      setCheckingSession(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;

      const user = session?.user ?? null;
      setAuthUser(user);
      setCheckingSession(false);
    });

    function handleNameUpdate(event: Event) {
      const name = (event as CustomEvent<string>).detail;
      setAuthUser((current) => current
        ? {
            ...current,
            user_metadata: { ...current.user_metadata, name },
          }
        : current);
    }

    window.addEventListener("mkt-ai-user-name-updated", handleNameUpdate);

    return () => {
      active = false;
      subscription.unsubscribe();
      window.removeEventListener("mkt-ai-user-name-updated", handleNameUpdate);
    };
  }, []);

  useEffect(() => {
    if (checkingSession) return;
    if (pathname === "/login" && authUser) {
      router.replace("/");
    } else if (!isPublicAuthRoute && !authUser) {
      router.replace("/login");
    }
  }, [authUser, checkingSession, isPublicAuthRoute, pathname, router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    setAuthUser(null);
    router.replace("/login");
  }

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-[12px] text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (pathname === "/login") {
    if (authUser) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background text-[12px] text-muted-foreground">
          Carregando...
        </div>
      );
    }

    return <>{children}</>;
  }

  if (pathname === "/definir-senha" || pathname === "/redefinir-senha") {
    return <>{children}</>;
  }

  if (!authUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-[12px] text-muted-foreground">
        Carregando...
      </div>
    );
  }

  return (
    <div className="private-app-density flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((current) => !current)}
        userLabel={userLabel}
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
