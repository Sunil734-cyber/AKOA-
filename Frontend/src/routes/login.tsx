import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Topology } from "@/components/topology";
import { Button, Input, Dot } from "@/components/ako";
import { authStore } from "@/lib/store";
import { LogoMark } from "@/components/logo";
import { loginApi } from "@/lib/api";

export const Route = createFileRoute("/login")({
  component: Login,
  head: () => ({
    meta: [
      { title: "AKOA · Sign in" },
      {
        name: "description",
        content: "Sign in to your AKOA operations workspace — autonomous Kubernetes operations.",
      },
      { property: "og:title", content: "AKOA · Sign in" },
      {
        property: "og:description",
        content: "Access your AKOA operations workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("sreenidhi@company.com");
  const [password, setPassword] = useState("akoa-demo-2026");
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginApi(email, password, keepSignedIn);
      authStore.signIn();
      navigate({ to: "/" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to sign in";
      toast.error("Sign in failed", { description: message });
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.15fr_1fr]">
      {/* left brand panel */}
      <div className="relative hidden flex-col justify-between border-r border-border bg-sidebar p-12 xl:flex">
        <LogoMark />
        <div>
          <h1 className="max-w-xl text-5xl leading-[1.1] font-semibold tracking-tight text-foreground">
            Autonomous Kubernetes Operations Agent
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Observe infrastructure. Understand behavior. Optimize safely.
          </p>
          <Topology className="mt-14 w-full max-w-2xl" />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck size={16} className="text-primary" />
          Enterprise SSO · Policy guarded · Fully auditable
        </div>
      </div>

      {/* right form panel */}
      <div className="flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden">
            <LogoMark />
          </div>
          <h2 className="mt-10 text-3xl font-semibold tracking-tight text-foreground lg:mt-0">Sign in</h2>
          <p className="mt-2 text-[15px] text-muted-foreground">
            Access your AKOA operations workspace.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-foreground">
                Work email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-foreground">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={keepSignedIn}
                  onChange={(e) => setKeepSignedIn(e.target.checked)}
                  className="h-4 w-4 rounded border-input bg-card accent-[var(--color-primary)]"
                />
                Keep me signed in
              </label>
              <button type="button" className="text-sm font-medium text-primary hover:underline">
                Forgot password?
              </button>
            </div>
            <Button type="submit" className="mt-2 w-full sm:w-auto sm:px-8">
              Sign In
            </Button>
          </form>

          <div className="mt-10 flex items-center justify-between">
            <span className="font-mono text-[11px] tracking-wider text-muted-foreground">
              AKOA Console v2.4.1
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-healthy">
              <Dot className="bg-healthy" />
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
