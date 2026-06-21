"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, UserPlus, Check, Clock, UserCheck } from "lucide-react";
import { toast } from "sonner";
import type { UserSearchResult } from "@settl/types";
import { api, getApiError } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type Props = {
  onFriendAction?: () => void;
  excludeUserIds?: string[];
  actionLabel?: string;
  onAction?: (user: UserSearchResult) => void | Promise<void>;
  showFriendActions?: boolean;
  placeholder?: string;
};

export function UserSearchPanel({
  onFriendAction,
  excludeUserIds = [],
  actionLabel,
  onAction,
  showFriendActions = true,
  placeholder = "Search by username or name…",
}: Props) {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const { data: results = [], isFetching } = useQuery({
    queryKey: ["user-search", debouncedQuery],
    queryFn: async () => {
      const { data } = await api.get("/users/search", { params: { q: debouncedQuery } });
      return data.data as UserSearchResult[];
    },
    enabled: debouncedQuery.length >= 2,
  });

  const filtered = results.filter((u) => !excludeUserIds.includes(u.id));

  async function sendFriendRequest(user: UserSearchResult) {
    setActionLoading(user.id);
    try {
      await api.post("/friends/request", { userId: user.id });
      toast.success(`Friend request sent to @${user.username}`);
      queryClient.invalidateQueries({ queryKey: ["user-search"] });
      onFriendAction?.();
    } catch (error) {
      toast.error(getApiError(error));
    } finally {
      setActionLoading(null);
    }
  }

  async function acceptRequest(user: UserSearchResult) {
    if (!user.friendshipId) return;
    setActionLoading(user.id);
    try {
      await api.post(`/friends/${user.friendshipId}/accept`);
      toast.success(`You and @${user.username} are now friends`);
      queryClient.invalidateQueries({ queryKey: ["user-search"] });
      onFriendAction?.();
    } catch (error) {
      toast.error(getApiError(error));
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCustomAction(user: UserSearchResult) {
    if (!onAction) return;
    setActionLoading(user.id);
    try {
      await onAction(user);
    } catch (error) {
      toast.error(getApiError(error));
    } finally {
      setActionLoading(null);
    }
  }

  function renderAction(user: UserSearchResult) {
    if (onAction) {
      return (
        <Button
          size="sm"
          className="gradient-brand border-0 h-8 shrink-0"
          disabled={actionLoading === user.id}
          onClick={() => handleCustomAction(user)}
        >
          {actionLabel ?? "Add"}
        </Button>
      );
    }

    if (!showFriendActions) return null;

    switch (user.friendshipStatus) {
      case "FRIENDS":
        return (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-400 shrink-0">
            <UserCheck className="h-3.5 w-3.5" /> Friends
          </span>
        );
      case "PENDING_SENT":
        return (
          <span className="inline-flex items-center gap-1 text-xs text-neutral-500 shrink-0">
            <Clock className="h-3.5 w-3.5" /> Request sent
          </span>
        );
      case "PENDING_RECEIVED":
        return (
          <Button
            size="sm"
            className="gradient-brand border-0 h-8 shrink-0"
            disabled={actionLoading === user.id}
            onClick={() => acceptRequest(user)}
          >
            <Check className="h-3.5 w-3.5 mr-1" /> Accept
          </Button>
        );
      default:
        return (
          <Button
            size="sm"
            variant="outline"
            className="border-brand/30 text-brand-light h-8 shrink-0"
            disabled={actionLoading === user.id}
            onClick={() => sendFriendRequest(user)}
          >
            <UserPlus className="h-3.5 w-3.5 mr-1" /> Add friend
          </Button>
        );
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-9 bg-white/5 border-white/10"
        />
      </div>

      {debouncedQuery.length >= 2 && (
        <div className="space-y-1">
          {isFetching && filtered.length === 0 && (
            <p className="text-sm text-neutral-500 py-4 text-center">Searching…</p>
          )}
          {!isFetching && filtered.length === 0 && (
            <p className="text-sm text-neutral-500 py-4 text-center">No users found for &quot;{debouncedQuery}&quot;</p>
          )}
          {filtered.map((user) => (
            <div
              key={user.id}
              className={cn(
                "flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5",
                "hover:bg-white/[0.04] transition-colors"
              )}
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
              {renderAction(user)}
            </div>
          ))}
        </div>
      )}

      {debouncedQuery.length < 2 && query.length > 0 && (
        <p className="text-xs text-neutral-500 text-center">Type at least 2 characters to search</p>
      )}
    </div>
  );
}
