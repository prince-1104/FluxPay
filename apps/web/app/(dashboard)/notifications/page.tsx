"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await api.get("/notifications");
      return data.data;
    },
  });

  async function markAllRead() {
    await api.post("/notifications/read-all");
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-neutral-400">Stay updated on trip activity</p>
        </div>
        <Button variant="outline" className="border-white/10" onClick={markAllRead}>Mark all read</Button>
      </div>

      {isLoading ? (
        <p className="text-neutral-500">Loading...</p>
      ) : notifications.length === 0 ? (
        <Card className="border-white/10 bg-surface-elevated p-8 text-center text-neutral-500">No notifications</Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((n: { id: string; title: string; body: string; type: string; readAt: string | null; createdAt: string }) => (
            <Card key={n.id} className={`border-white/10 bg-surface-elevated ${!n.readAt ? "border-brand/30" : ""}`}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <p className="font-medium">{n.title}</p>
                    <p className="text-sm text-neutral-400 mt-1">{n.body}</p>
                    <p className="text-xs text-neutral-600 mt-2">{format(new Date(n.createdAt), "MMM d, yyyy h:mm a")}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0">{n.type.replace(/_/g, " ")}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
