"use client";

import { useState } from "react";
import { toast } from "sonner";
import { UserMinus } from "lucide-react";
import type { TripWithMembers } from "@settl/types";
import { api, getApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Member = TripWithMembers["members"][number];

type Props = {
  trip: TripWithMembers;
  member: Member | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

function memberName(m: Member) {
  return m.displayName ?? m.user?.name ?? "Member";
}

export function RemoveMemberDialog({ trip, member, open, onOpenChange, onSuccess }: Props) {
  const [removing, setRemoving] = useState(false);

  async function handleRemove() {
    if (!member) return;
    setRemoving(true);
    try {
      await api.delete(`/trips/${trip.id}/members/${member.userId}`);
      toast.success(`${memberName(member)} removed from trip`);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(getApiError(error));
    } finally {
      setRemoving(false);
    }
  }

  const name = member ? memberName(member) : "";
  const username = member?.user?.username;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-white/10 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Remove member?</DialogTitle>
          <DialogDescription className="text-neutral-400 pt-1">
            {member ? (
              <>
                Remove <span className="text-white font-medium">{name}</span>
                {username && (
                  <span className="text-neutral-500"> (@{username})</span>
                )}{" "}
                from <span className="text-white font-medium">{trip.name}</span>? They will
                no longer see this trip or its expenses.
              </>
            ) : (
              "This member will be removed from the trip."
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            className="border-white/10"
            onClick={() => onOpenChange(false)}
            disabled={removing}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleRemove}
            disabled={removing || !member}
          >
            <UserMinus className="h-4 w-4 mr-2" />
            {removing ? "Removing…" : "Remove"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function canRemoveMember(
  member: Member,
  actorRole: TripWithMembers["members"][number]["role"] | undefined
): boolean {
  if (!actorRole || !["OWNER", "ADMIN"].includes(actorRole)) return false;
  if (member.role === "OWNER") return false;
  if (member.role === "ADMIN") return actorRole === "OWNER";
  return true;
}

export { canRemoveMember };
