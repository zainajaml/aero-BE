import { useEffect, useState } from "react";
import { CreditCard } from "lucide-react";
import { useAuth } from "@/features/auth/auth-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { ChangePasswordCard } from "../components/change-password-card";
import { ComingSoon } from "../components/coming-soon";
import { PersonalDetailsCard } from "../components/personal-details-card";
import { ProfileIdentityHeader } from "../components/profile-identity-header";
import { TimeOffPanel } from "../components/time-off-panel";
import { WorkDetailsCard } from "../components/work-details-card";
import { useMyPrivateProfile } from "../hooks/profile-queries";

export function ProfileView({ tab }: { tab?: string; view?: string }) {
  const { user, hasRole } = useAuth();
  const isSuperAdmin = hasRole("super_admin");
  const { data: privateProfile } = useMyPrivateProfile(user?.id);

  // Name fields are shared by the identity header (live preview) and the details card.
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName ?? "");
    setLastName(user.lastName ?? "");
  }, [user]);

  const email = user?.email ?? "";
  const displayName = `${firstName} ${lastName}`.trim() || (user?.email ?? "?");

  return (
    <div className="flex h-[calc(100vh-2rem)] flex-col">
      <div className="shrink-0">
        <h1 className="font-display text-2xl font-semibold tracking-tight">My Profile</h1>
        <p className="text-sm text-muted-foreground">
          {isSuperAdmin
            ? "Your personal details, time off and billing."
            : "Your personal details and billing."}
        </p>
      </div>

      <Tabs
        defaultValue={
          tab === "timeoff" && isSuperAdmin ? "timeoff" : tab === "billing" ? "billing" : "profile"
        }
        className="mt-6 flex min-h-0 flex-1 flex-col"
      >
        <TabsList className="shrink-0 self-start h-8 rounded-md border border-input bg-transparent p-1 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring [&_[data-state=active]]:bg-primary [&_[data-state=active]]:text-primary-foreground">
          <TabsTrigger value="profile">My Profile</TabsTrigger>
          {isSuperAdmin && <TabsTrigger value="timeoff">Time Off</TabsTrigger>}
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4 min-h-0 flex-1 overflow-auto">
          {/* Split layout: profile details on the left, security on the right,
              separated by a short centered vertical divider. */}
          <div className="px-3 pb-6">
            {/* Identity header spans both columns so the two sides start level */}
            <ProfileIdentityHeader
              avatarPath={user?.avatarUrl}
              displayName={displayName}
              email={email}
            />

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)]">
              {/* LEFT — details */}
              <div className="min-w-0 space-y-5">
                <PersonalDetailsCard
                  me={user}
                  privateProfile={privateProfile}
                  firstName={firstName}
                  lastName={lastName}
                  onFirstNameChange={setFirstName}
                  onLastNameChange={setLastName}
                />
                <WorkDetailsCard userId={user?.id} privateProfile={privateProfile} />
              </div>

              {/* Short centered divider */}
              <div
                aria-hidden
                className="hidden self-center lg:block lg:h-[60%] lg:w-px lg:bg-border/60"
              />

              {/* RIGHT — security */}
              <div className="min-w-0 space-y-5">
                <ChangePasswordCard email={email || null} />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="timeoff" className="mt-4 min-h-0 flex-1 overflow-auto">
          <TimeOffPanel userId={user?.id} />
        </TabsContent>

        <TabsContent value="billing" className="mt-4 min-h-0 flex-1 overflow-auto">
          <ComingSoon
            icon={<CreditCard className="h-4.5 w-4.5" />}
            title="Billing & Subscription"
            description="Manage your Space Scope plan, payment method and invoices from here once in-app purchases go live."
            bullets={[
              "Current plan, seat count and renewal date",
              "Upgrade, downgrade or cancel your subscription",
              "Saved payment methods and billing contact",
              "Downloadable invoices and receipts",
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
