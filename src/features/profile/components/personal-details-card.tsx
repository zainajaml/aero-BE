import { useEffect, useState } from "react";
import { User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import type { Me } from "@/features/auth/api/auth.api";
import type { PrivateProfile } from "@/features/users/api/profile.api";
import { errorMessage } from "@/shared/api/errors";
import { Input } from "@/shared/ui/input";
import { useUpdateMyPrivateProfile, useUpdateMyProfile } from "../hooks/profile-queries";
import { SectionCard, StackField } from "./section-card";

export function PersonalDetailsCard({
  me,
  privateProfile,
  firstName,
  lastName,
  onFirstNameChange,
  onLastNameChange,
}: {
  me: Me | null;
  privateProfile: PrivateProfile | undefined;
  /** Name fields are lifted so the identity header previews them while editing. */
  firstName: string;
  lastName: string;
  onFirstNameChange: (v: string) => void;
  onLastNameChange: (v: string) => void;
}) {
  const updateProfile = useUpdateMyProfile();
  const updatePrivate = useUpdateMyPrivateProfile(me?.id);
  const [mobile, setMobile] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (privateProfile) setMobile(privateProfile.mobile ?? "");
  }, [privateProfile]);

  function reset() {
    onFirstNameChange(me?.firstName ?? "");
    onLastNameChange(me?.lastName ?? "");
    setMobile(privateProfile?.mobile ?? "");
  }

  async function save() {
    if (!me) return;
    setSaving(true);
    try {
      await updateProfile.mutateAsync({
        firstName: firstName.trim() || null,
        lastName: lastName.trim() || null,
      });
      await updatePrivate.mutateAsync({ mobile: mobile.trim() || null });
      setEditing(false);
      toast.success("Details saved.");
    } catch (err) {
      toast.error(errorMessage(err, "Failed to save details."));
    } finally {
      setSaving(false);
    }
  }

  const email = me?.email ?? "";
  return (
    <SectionCard
      icon={<UserIcon className="h-3.5 w-3.5" />}
      title="Personal details"
      editing={editing}
      onEdit={() => setEditing(true)}
      onCancel={() => {
        reset();
        setEditing(false);
      }}
      onSave={() => void save()}
      saving={saving}
      saveLabel="Save details"
    >
      <StackField label="First name">
        <Input
          aria-label="First name"
          className="h-8 max-w-[240px] text-sm"
          value={firstName}
          onChange={(e) => onFirstNameChange(e.target.value)}
          maxLength={60}
          placeholder="First"
          disabled={!editing}
        />
      </StackField>
      <StackField label="Last name">
        <Input
          aria-label="Last name"
          className="h-8 max-w-[240px] text-sm"
          value={lastName}
          onChange={(e) => onLastNameChange(e.target.value)}
          maxLength={60}
          placeholder="Last"
          disabled={!editing}
        />
      </StackField>
      <StackField label="Email">
        <Input
          aria-label="Email"
          className="h-8 max-w-[340px] text-sm"
          value={email}
          readOnly
          disabled
        />
      </StackField>
      <StackField label="Mobile">
        <Input
          className="h-8 max-w-[240px] text-sm"
          type="tel"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          maxLength={30}
          placeholder="+1 555 123 4567"
          disabled={!editing}
        />
      </StackField>
    </SectionCard>
  );
}
