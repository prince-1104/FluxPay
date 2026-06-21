"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  Receipt,
  Users,
  Wallet,
  CheckCheck,
} from "lucide-react";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";

type Notification = {
  id: string;
  title: string;
  body: string;
  type: string;
  readAt: string | null;
  createdAt: string;
};

const typeIcons: Record<string, typeof Bell> = {
  EXPENSE_ADDED: Receipt,
  SETTLEMENT_DUE: Wallet,
  MEMBER_JOINED: Users,
  TRIP_INVITE: Users,
};

function getIcon(type: string) {
  return typeIcons[type] ?? Bell;
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await api.get("/notifications");
      return data.data as Notification[];
    },
  });

  async function markAllRead() {
    await api.post("/notifications/read-all");
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  const unread = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="space-y-8">
      <PageHeader title="Notifications" description="Stay updated on trip activity and settlements.">
        {notifications.length > 0 && (
          <Button variant="outline" className="border-white/10 gap-2" onClick={markAllRead}>
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        )}
      </PageHeader>

      {unread > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-brand/20 bg-brand/5 px-4 py-3 text-sm">
          <span className="flex h-2 w-2 rounded-full bg-brand animate-pulse" />
          <span className="text-brand-light">{unread} unread notification{unread !== 1 ? "s" : ""}</span>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="saas-card h-20 animate-pulse bg-white/[0.02]" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="All caught up"
          description="You'll see notifications here when someone adds expenses, settles up, or invites you to a trip."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const Icon = getIcon(n.type);
            return (
              <div
                key={n.id}
                className={cn(
                  "saas-card flex items-start gap-4 p-4 transition-colors",
                  !n.readAt && "border-brand/25 bg-brand/[0.03]"
                )}
              >
                <div className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  !n.readAt ? "bg-brand/15 text-brand-light" : "bg-white/5 text-neutral-500"
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <p className={cn("font-medium", !n.readAt && "text-white")}>{n.title}</p>
                    <Badge variant="outline" className="shrink-0 text-xs border-white/10 capitalize">
                      {n.type.replace(/_/g, " ").toLowerCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-neutral-400 mt-1">{n.body}</p>
                  <p className="text-xs text-neutral-600 mt-2">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {!n.readAt && (
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
