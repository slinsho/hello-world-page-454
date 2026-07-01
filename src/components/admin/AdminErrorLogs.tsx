/**
 * ============================================================
 *  ADMIN → ERROR LOGS
 * ============================================================
 *  Real production error monitoring, backed by the error_logs
 *  table. Every uncaught error or warning captured by
 *  src/lib/debug.ts is fire-and-forget inserted here, so admins
 *  can review real crashes from real users without needing an
 *  external service (Sentry, LogRocket, etc.).
 * ============================================================
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCw, Trash2, Copy, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ErrorRow {
  id: string;
  user_id: string | null;
  level: string;
  message: string;
  stack: string | null;
  route: string | null;
  user_agent: string | null;
  context: any;
  created_at: string;
}

export function AdminErrorLogs() {
  const [rows, setRows] = useState<ErrorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "error" | "warn">("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("error_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      toast({ title: "Failed to load", description: error.message, variant: "destructive" });
    } else {
      setRows((data ?? []) as ErrorRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(
    () => (filter === "all" ? rows : rows.filter((r) => r.level === filter)),
    [rows, filter]
  );

  const counts = useMemo(
    () => ({
      total: rows.length,
      error: rows.filter((r) => r.level === "error").length,
      warn: rows.filter((r) => r.level === "warn").length,
      last24: rows.filter(
        (r) => Date.now() - new Date(r.created_at).getTime() < 24 * 3600 * 1000
      ).length,
    }),
    [rows]
  );

  const clearAll = async () => {
    const { error } = await supabase
      .from("error_logs")
      .delete()
      .gte("created_at", "1970-01-01");
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Cleared", description: "All error logs have been deleted." });
      load();
    }
  };

  const copyRow = async (row: ErrorRow) => {
    const text = [
      `Time: ${row.created_at}`,
      `Level: ${row.level}`,
      `Route: ${row.route ?? "-"}`,
      `User: ${row.user_id ?? "anonymous"}`,
      `UA: ${row.user_agent ?? "-"}`,
      `Message: ${row.message}`,
      row.stack ? `Stack:\n${row.stack}` : null,
      row.context ? `Context: ${JSON.stringify(row.context, null, 2)}` : null,
    ]
      .filter(Boolean)
      .join("\n");
    await navigator.clipboard.writeText(text);
    setCopiedId(row.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" /> Production Error Logs
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Real errors captured from real users. Auto-recorded — no external service needed.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={load}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline" disabled={rows.length === 0}>
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear all
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete all error logs?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes every stored production error. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={clearAll}>Delete all</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{counts.total}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Last 24h</p>
          <p className="text-2xl font-bold text-amber-500">{counts.last24}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Errors</p>
          <p className="text-2xl font-bold text-red-500">{counts.error}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Warnings</p>
          <p className="text-2xl font-bold text-yellow-500">{counts.warn}</p>
        </Card>
      </div>

      <div className="flex items-center gap-2">
        {(["all", "error", "warn"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded capitalize ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/70"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : (
        <ScrollArea className="max-h-[65vh]">
          {visible.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No errors recorded 🎉 Your app is running clean.
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {visible.map((row) => (
                <Card key={row.id} className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant={row.level === "error" ? "destructive" : "secondary"}
                        className="text-[10px]"
                      >
                        {row.level}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">
                        {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
                      </span>
                      {row.route && (
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {row.route}
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2"
                      onClick={() => copyRow(row)}
                    >
                      {copiedId === row.id ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm font-medium mt-1.5 break-words">{row.message}</p>
                  {row.stack && (
                    <details className="mt-2">
                      <summary className="text-xs text-muted-foreground cursor-pointer">
                        Stack trace
                      </summary>
                      <pre className="mt-1 text-[10px] text-muted-foreground whitespace-pre-wrap break-all bg-muted/40 p-2 rounded max-h-48 overflow-auto">
                        {row.stack}
                      </pre>
                    </details>
                  )}
                  {row.context && (
                    <details className="mt-1">
                      <summary className="text-xs text-muted-foreground cursor-pointer">
                        Context
                      </summary>
                      <pre className="mt-1 text-[10px] text-muted-foreground whitespace-pre-wrap break-all bg-muted/40 p-2 rounded max-h-32 overflow-auto">
                        {JSON.stringify(row.context, null, 2)}
                      </pre>
                    </details>
                  )}
                  <div className="mt-1.5 text-[10px] text-muted-foreground truncate">
                    {row.user_id ? `user: ${row.user_id.slice(0, 8)}…` : "anonymous"}
                    {row.user_agent ? ` · ${row.user_agent.slice(0, 60)}` : ""}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      )}
    </div>
  );
}

export default AdminErrorLogs;
