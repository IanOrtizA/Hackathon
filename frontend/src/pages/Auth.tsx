import { FormEvent, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { LogIn, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

type AuthMode = "login" | "register";

export default function Auth() {
  const { isAuthenticated, login, register } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginForm, setLoginForm] = useState({
    identifier: "",
    password: "",
  });
  const [registerForm, setRegisterForm] = useState({
    email: "",
    username: "",
    displayName: "",
    password: "",
  });

  if (isAuthenticated) {
    return <Navigate to="/profile" replace />;
  }

  async function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await login(loginForm);
      toast.success("Signed in.");
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Unable to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRegisterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await register(registerForm);
      toast.success("Account created.");
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Unable to create account.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container max-w-4xl py-12">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <section className="rounded-2xl border border-border bg-card/70 p-8 shadow-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Account Access</p>
          <h1 className="mt-3 font-display text-4xl font-bold">Create your profile and sign in.</h1>
          <p className="mt-4 max-w-xl text-sm text-muted-foreground">
            Accounts are stored in Mongo, login is handled by the backend, and the frontend keeps your signed-in
            session so profile and review actions can use real user data instead of placeholders.
          </p>

          <div className="mt-8 flex gap-2 rounded-xl bg-background/40 p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={cn(
                "flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                mode === "login" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={cn(
                "flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                mode === "register" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {mode === "login" ? (
            <form className="mt-6 space-y-4" onSubmit={handleLoginSubmit}>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Email or Username
                </label>
                <input
                  value={loginForm.identifier}
                  onChange={(event) => setLoginForm((current) => ({ ...current, identifier: event.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="you@example.com"
                  autoComplete="username"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Password
                </label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <LogIn className="h-4 w-4" />
                {isSubmitting ? "Signing in..." : "Sign In"}
              </button>
            </form>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={handleRegisterSubmit}>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Display Name
                </label>
                <input
                  value={registerForm.displayName}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, displayName: event.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Your public display name"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Username
                </label>
                <input
                  value={registerForm.username}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, username: event.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="unique_username"
                  autoComplete="username"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Email
                </label>
                <input
                  type="email"
                  value={registerForm.email}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, email: event.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Password
                </label>
                <input
                  type="password"
                  value={registerForm.password}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, password: event.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <UserPlus className="h-4 w-4" />
                {isSubmitting ? "Creating..." : "Create Account"}
              </button>
            </form>
          )}
        </section>

        <aside className="rounded-2xl border border-border bg-background/40 p-8">
          <h2 className="font-display text-3xl font-bold">What this unlocks</h2>
          <div className="mt-6 space-y-4 text-sm text-muted-foreground">
            <p>Profiles are now backed by the database, not the mock placeholder object.</p>
            <p>Login tokens come from the backend and persist in local storage until you log out.</p>
            <p>Review posting and profile rendering can now use the active authenticated user.</p>
          </div>
          <Link
            to="/"
            className="mt-8 inline-flex rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-secondary/40 transition-colors"
          >
            Back Home
          </Link>
        </aside>
      </div>
    </div>
  );
}
