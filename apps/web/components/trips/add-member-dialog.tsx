"use client";

import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { UserPlus, Users } from "lucide-react";
import type { TripWithMembers, UserPublic } from "@settl/types";
import { api, getApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserSearchPanel } from "@/components/friends/user-search-panel";
import { useState } from "react";

type Props = {
  trip: TripWithMembers;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

type FriendEntry = { id: string; user: UserPublic; since: string };

export function AddMemberDialog({ trip, open, onOpenChange, onSuccess }: Props) {
  const [adding, setAdding] = useState<string | null>(null);
  const memberIds = trip.members.map((m) => m.userId);

  const { data: friends = [], refetch: refetchFriends } = useQuery({
    queryKey: ["friends"],
    queryFn: async () => {
      const { data } = await api.get("/friends");
      return data.data as FriendEntry[];
    },
    enabled: open,
  });

  const availableFriends = friends.filter((f) => !memberIds.includes(f.user.id));

  async function addMember(target: { userId?: string; username?: string }) {
    const key = target.userId ?? target.username ?? "";
    setAdding(key);
    try {
      await api.post(`/trips/${trip.id}/members`, target);
      toast.success("Member added to trip!");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(getApiError(error));
      throw error;
    } finally {
      setAdding(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-white/10 sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add member to {trip.name}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-neutral-500 -mt-2">
          Add from your friends list or search by username.
        </p>

        <Tabs defaultValue="friends" className="mt-2">
          <TabsList className="glass h-auto p-1 w-full">
            <TabsTrigger
              value="friends"
              className="flex-1 data-[state=active]:bg-brand/20 data-[state=active]:text-brand-light text-xs sm:text-sm"
            >
              <Users className="h-3.5 w-3.5 mr-1.5" />
              Friends ({availableFriends.length})
            </TabsTrigger>
            <TabsTrigger
              value="search"
              className="flex-1 data-[state=active]:bg-brand/20 data-[state=active]:text-brand-light text-xs sm:text-sm"
            >
              Search
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="mt-3 space-y-2">
            {availableFriends.length === 0 ? (
              <p className="text-sm text-neutral-500 py-6 text-center">
                {friends.length === 0
                  ? "No friends yet. Search for users to add friends first."
                  : "All your friends are already in this trip."}
              </p>
            ) : (
              availableFriends.map(({ id, user }) => (
                <div
                  key={id}
                  className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5"
                >
                  <Avatar className="h-9 w-9 ring-1 ring-brand/10">
                    <AvatarFallback className="bg-brand/15 text-brand-light text-sm">
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-xs text-neutral-500 truncate">@{user.username}</p>
                  </div>
                  <Button
                    size="sm"
                    className="gradient-brand border-0 h-8 shrink-0"
                    disabled={adding === user.id}
                    onClick={() => addMember({ userId: user.id })}
                  >
                    <UserPlus className="h-3.5 w-3.5 mr-1" /> Add
                  </Button>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="search" className="mt-3">
            <UserSearchPanel
              excludeUserIds={memberIds}
              showFriendActions={false}
              actionLabel="Add to trip"
              onAction={(user) => addMember({ userId: user.id })}
              onFriendAction={() => refetchFriends()}
              placeholder="Search username to add to trip…"
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
