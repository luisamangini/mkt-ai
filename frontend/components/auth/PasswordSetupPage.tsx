import { LoginBrandPanel } from "./LoginBrandPanel";
import { SetPasswordForm, type PasswordMode } from "./SetPasswordForm";

type PasswordSetupPageProps = {
  mode: PasswordMode;
};

export function PasswordSetupPage({ mode }: PasswordSetupPageProps) {
  const recovery = mode === "recovery";

  return (
    <div className="min-w-0">
      <main className="grid min-h-[calc(100vh-96px)] grid-cols-1 gap-5 overflow-hidden lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <LoginBrandPanel />

        <section className="flex min-h-[calc(100vh-96px)] items-center justify-center px-4 py-8 sm:px-8">
          <div className="w-full max-w-[420px]">
            <div className="mb-8">
              <div className="mb-8 text-sm font-semibold text-foreground">
                ConsorIA
              </div>
              <h1 className="text-2xl font-semibold text-foreground">
                {recovery ? "Redefina sua senha" : "Crie sua senha"}
              </h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {recovery ? (
                  "Escolha uma nova senha para continuar acessando sua conta."
                ) : (
                  <>
                    Sua conta foi criada com sucesso.
                    <br />
                    Defina uma senha para acessar a plataforma.
                  </>
                )}
              </p>
            </div>

            <SetPasswordForm mode={mode} />
          </div>
        </section>
      </main>
    </div>
  );
}
