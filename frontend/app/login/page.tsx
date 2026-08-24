import { LoginBrandPanel } from "@/components/auth/LoginBrandPanel";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-w-0">
      <main className="grid min-h-screen grid-cols-1 gap-5 overflow-hidden lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <LoginBrandPanel />

        <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-8">
          <div className="w-full max-w-[420px]">
            <div className="mb-8">
              <div className="mb-8 text-sm font-semibold text-foreground">
                ConsorIA
              </div>
              <h1 className="text-2xl font-semibold text-foreground">
                Bem-vindo de volta
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Entre com sua conta para acessar a plataforma.
              </p>
            </div>

            <LoginForm />
          </div>
        </section>
      </main>
    </div>
  );
}
