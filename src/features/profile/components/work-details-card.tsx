import { useEffect, useState } from "react";
import { Briefcase } from "lucide-react";
import { toast } from "sonner";
import type { PrivateProfile } from "@/features/users/api/profile.api";
import { TIMEZONES, useTimezone, type TzCode } from "@/features/users/lib/timezone";
import { errorMessage } from "@/shared/api/errors";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { useUpdateMyPrivateProfile } from "../hooks/profile-queries";
import { EMPLOYMENT_STATUSES, type EmploymentStatus } from "../lib/profile";
import { SectionCard, StackField } from "./section-card";

export function WorkDetailsCard({
  userId,
  privateProfile,
}: {
  userId: string | undefined;
  privateProfile: PrivateProfile | undefined;
}) {
  const { tz, setTz } = useTimezone();
  const updatePrivate = useUpdateMyPrivateProfile(userId);
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [employmentStatus, setEmploymentStatus] = useState<string>("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!privateProfile) return;
    setEmployeeNumber(privateProfile.employeeNumber ?? "");
    setEmploymentStatus(privateProfile.employmentStatus ?? "");
  }, [privateProfile]);

  function reset() {
    setEmployeeNumber(privateProfile?.employeeNumber ?? "");
    setEmploymentStatus(privateProfile?.employmentStatus ?? "");
  }

  async function save() {
    if (!userId) return;
    try {
      await updatePrivate.mutateAsync({
        employeeNumber: employeeNumber.trim() || null,
        employmentStatus: (employmentStatus || null) as EmploymentStatus | null,
      });
      setEditing(false);
      toast.success("Details saved.");
    } catch (err) {
      toast.error(errorMessage(err, "Failed to save details."));
    }
  }

  return (
    <SectionCard
      icon={<Briefcase className="h-3.5 w-3.5" />}
      title="Work & reporting"
      editing={editing}
      onEdit={() => setEditing(true)}
      onCancel={() => {
        reset();
        setEditing(false);
      }}
      onSave={() => void save()}
      saving={updatePrivate.isPending}
      saveLabel="Save details"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <StackField label="Employee #">
          <Input
            className="h-8 w-full text-sm"
            value={employeeNumber}
            onChange={(e) => setEmployeeNumber(e.target.value)}
            maxLength={40}
            placeholder="EMP-001"
            disabled={!editing}
          />
        </StackField>
        <StackField label="Employment">
          <Select value={employmentStatus} onValueChange={setEmploymentStatus} disabled={!editing}>
            <SelectTrigger className="h-8 w-full text-sm">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {EMPLOYMENT_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </StackField>
      </div>
      <StackField label="Timezone">
        <Select value={tz} onValueChange={(v) => setTz(v as TzCode)} disabled={!editing}>
          <SelectTrigger className="h-8 max-w-[200px] text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONES.map((t) => (
              <SelectItem key={t.code} value={t.code}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </StackField>
    </SectionCard>
  );
}
