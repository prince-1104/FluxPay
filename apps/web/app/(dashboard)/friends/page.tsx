"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { UserPlus, Users, UserCheck, Clock, X, Check } from "lucide-react";
import { api, getApiError } from "@/lib/api";
import type { UserPublic } from "@settl/types";
import { PageHeader } from "@/components/shared/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserSearchPanel } from "@/components/friends/user-search-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type FriendEntry = { id: string; user: UserPublic; since: string };
type RequestEntry = { id: string; user: UserPublic; createdAt: string };

export default function FriendsPage() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["friends"] });
    queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
    queryClient.invalidateQueries({ queryKey: ["user-search"] });
  };

  const { data: friends = [] } = useQuery({
    queryKey: ["friends"],
    queryFn: async () => {
      const { data } = await api.get("/friends");
      return data.data as FriendEntry[];
    },
  });

  const { data: requests } = useQuery({
    queryKey: ["friend-requests"],
    queryFn: async () => {
      const { data } = await api.get("/friends/requests");
      return data.data as { incoming: RequestEntry[]; outgoing: RequestEntry[] };
    },
  });

  const incoming = requests?.incoming ?? [];
  const outgoing = requests?.outgoing ?? [];

  async function acceptRequest(friendshipId: string, username: string) {
    try {
      await api.post(`/friends/${friendshipId}/accept`);
      toast.success(`You and @${username} are now friends`);
      invalidate();
    } catch (error) {
      toast.error(getApiError(error));
    }
  }

  async function rejectRequest(friendshipId: string) {
    try {
      await api.post(`/friends/${friendshipId}/reject`);
      invalidate();
    } catch (error) {
      toast.error(getApiError(error));
    }
  }

  async function removeFriend(friendshipId: string, username: string) {
    if (!confirm(`Remove @${username} from your friends?`)) return;
    try {
      await api.delete(`/friends/${friendshipId}`);
      toast.success("Friend removed");
      invalidate();
    } catch (error) {
      toast.error(getApiError(error));
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Friends"
        description="Search users by username and build your friend list — like Facebook."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="saas-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-brand-light" />
            <h2 className="font-semibold">Find people</h2>
          </div>
          <UserSearchPanel onFriendAction={invalidate} />
        </div>

        <div className="space-y-4">
          {incoming.length > 0 && (
            <div className="saas-card p-5 space-y-3">
              <h2 className="font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-gold" />
                Friend requests ({incoming.length})
              </h2>
              {incoming.map(({ id, user }) => (
                <div
                  key={id}
                  className="flex items-center gap-3 rounded-xl border border-gold/20 bg-gold/5 px-3 py-2.5"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-brand/15 text-brand-light text-sm">
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-xs text-neutral-500">@{user.username}</p>
                  </div>
                  <Button
                    size="sm"
                    className="gradient-brand border-0 h-8"
                    onClick={() => acceptRequest(id, user.username)}
                  >
                    <Check className="h-3.5 w-3.5 mr-1" /> Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-neutral-500"
                    onClick={() => rejectRequest(id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="saas-card p-5">
            <Tabs defaultValue="friends">
              <TabsList className="glass h-auto p-1 w-full mb-4">
                <TabsTrigger
                  value="friends"
                  className="flex-1 data-[state=active]:bg-brand/20 data-[state=active]:text-brand-light"
                >
                  <UserCheck className="h-3.5 w-3.5 mr-1.5" />
                  Friends ({friends.length})
                </TabsTrigger>
                <TabsTrigger
                  value="sent"
                  className="flex-1 data-[state=active]:bg-brand/20 data-[state=active]:text-brand-light"
                >
                  Sent ({outgoing.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="friends" className="space-y-2 mt-0">
                {friends.length === 0 ? (
                  <p className="text-sm text-neutral-500 py-8 text-center">
                    No friends yet. Search for usernames above to connect.
                  </p>
                ) : (
                  friends.map(({ id, user }) => (
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
                        <p className="text-xs text-neutral-500">@{user.username}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-neutral-500 hover:text-red-400 h-8"
                        onClick={() => removeFriend(id, user.username)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="sent" className="space-y-2 mt-0">
                {outgoing.length === 0 ? (
                  <p className="text-sm text-neutral-500 py-8 text-center">No pending sent requests.</p>
                ) : (
                  outgoing.map(({ id, user }) => (
                    <div
                      key={id}
                      className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-brand/15 text-brand-light text-sm">
                          {user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-xs text-neutral-500">@{user.username}</p>
                      </div>
                      <span className="text-xs text-neutral-500">Pending</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-neutral-500"
                        onClick={() => rejectRequest(id)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-brand/20 bg-brand/5 p-4 flex items-start gap-3">
        <Users className="h-5 w-5 text-brand-light shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-brand-light">Add friends to trips</p>
          <p className="text-xs text-neutral-500 mt-1">
            Open any trip → Members tab → Add member. Pick from your friend list or search any username in the database.
          </p>
        </div>
      </div>
    </div>
  );
}
