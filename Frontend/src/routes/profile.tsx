import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/app-layout";
import { Card, Button, Dot, MonoLabel, Badge, Input } from "@/components/ako";
import { fetchProfile, updateProfile, type BackendProfile } from "@/lib/api";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [
      { title: "AKOA · Profile" },
      {
        name: "description",
        content: "Identity, organization and infrastructure permissions for your AKOA enterprise account.",
      },
      { property: "og:title", content: "AKOA · Profile" },
      {
        property: "og:description",
        content: "Identity, organization and infrastructure permissions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function ProfilePage() {
  const [profile, setProfile] = useState<BackendProfile | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoadError(null);
        const data = await fetchProfile();
        setProfile(data);
        setName(data.name);
        setEmail(data.email);
        setCompany(data.company);
        setRole(data.role);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load profile";
        setLoadError(message);
      }
    };
    void run();
  }, []);

  const save = async () => {
    try {
      const next = await updateProfile({ name, email, company, role });
      setProfile(next);
      toast.success("Profile updated");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update profile";
      toast.error("Profile update failed", { description: message });
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">Profile</h1>
            <p className="mt-2 text-[15px] text-muted-foreground">
              Identity, organization, and infrastructure permissions.
            </p>
            <p className="mt-3 font-mono text-xs tracking-wider text-muted-foreground uppercase">
              Enterprise account
            </p>
          </div>
          <Button onClick={save}>Save changes</Button>
        </div>

        {loadError ? (
          <Card className="mb-6 border-critical/30 bg-critical/5 p-4">
            <p className="text-sm text-critical">Unable to load profile from backend.</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{loadError}</p>
          </Card>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* left column */}
          <div className="space-y-6">
            <Card className="p-6 text-center">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-2 border-primary/50 bg-primary/10">
                <span className="font-mono text-2xl font-bold text-primary">SG</span>
              </div>
              <h2 className="mt-4 text-lg font-semibold text-foreground">{name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{role}</p>
              <div className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-healthy">
                <Dot className="bg-healthy" />
                Active
              </div>
              <div className="mt-4">
                <Badge tone="info">
                  <Dot className="bg-primary" />
                  Standard approver
                </Badge>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-[15px] font-semibold text-foreground">Account security</h2>
              <div className="mt-4 divide-y divide-border">
                <div className="flex items-center justify-between gap-4 pb-3.5">
                  <span className="text-sm text-muted-foreground">Single sign-on</span>
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-healthy">
                    <Dot className="bg-healthy" />
                    Enabled
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 pt-3.5">
                  <span className="text-sm text-muted-foreground">Last sign in</span>
                  <span className="font-mono text-xs text-foreground">{profile?.lastSignIn ?? "Unknown"}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* right column */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-[15px] font-semibold text-foreground">Profile information</h2>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="fullname" className="mb-2 block text-sm text-muted-foreground">
                    Full name
                  </label>
                  <Input id="fullname" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm text-muted-foreground">
                    Email
                  </label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="company" className="mb-2 block text-sm text-muted-foreground">
                    Company
                  </label>
                  <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="role" className="mb-2 block text-sm text-muted-foreground">
                    Role
                  </label>
                  <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-[15px] font-semibold text-foreground">Permissions</h2>
                <MonoLabel>Role-based access</MonoLabel>
              </div>
              <div className="mt-4 divide-y divide-border">
                {(profile?.permissions ?? []).map((p) => (
                  <div key={p} className="flex items-center justify-between gap-4 py-3.5">
                    <span className="inline-flex items-center gap-3 text-sm text-foreground">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-healthy/50">
                        <Check size={11} className="text-healthy" />
                      </span>
                      {p}
                    </span>
                    <Badge tone="healthy">
                      <Dot className="bg-healthy" />
                      Allowed
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-start gap-3 rounded-lg border border-warning/50 bg-warning/10 px-4 py-3.5">
                <ShieldAlert size={18} className="mt-0.5 shrink-0 text-warning" />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Critical actions require Administrator approval
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Console permissions are enforced by backend authorization and cluster policy at
                    execution time.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
