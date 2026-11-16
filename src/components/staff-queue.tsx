import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";

type Queue = "requests" | "donations";
type BaseRow = {
  id: string;
  name: string;
  phone: string;
  status: string;
  created_at: string;
  staff_notes: string | null;
};
type RequestRow = BaseRow & {
  village: string;
  assistance_type: string;
  assigned_to: string | null;
  follow_up_at: string | null;
};
type DonationRow = BaseRow & {
  email: string;
  provider: string;
  mode: string;
  order_id: string | null;
  payment_id: string | null;
  amount_paise: number;
  amount_refunded: number;
  verified_at: string | null;
  settlement_reference: string | null;
  settled_at: string | null;
  receipt_reference: string | null;
};
type Props = { client: SupabaseClient; onDenied: () => void };
const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });
const date = (value: string | null) =>
  value ? new Date(value).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) + " IST" : "—";
const statuses = ["new", "contacted", "in_progress", "closed"];
const control = "rounded-lg border px-3 py-2 text-sm disabled:opacity-50";

function Fields({ entries }: { entries: [string, string | null][] }) {
  return (
    <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
      {entries.map(([label, value]) => (
        <div key={label}>
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="break-words">{value || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

function RequestCard({ row, client }: { row: RequestRow; client: SupabaseClient }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const cache = useQueryClient();
  async function update(next: string) {
    setSaving(true);
    setError("");
    try {
      const result = await client.rpc("staff_update_request", {
        request_id: row.id,
        previous_status: row.status,
        next_status: next,
      });
      if (result.error) setError("Status was not saved. Check the latest status and retry.");
    } catch {
      setError("Connection failed. Check the latest status before retrying.");
    } finally {
      await cache.invalidateQueries({ queryKey: ["staff"] });
      setSaving(false);
    }
  }
  return (
    <article className="rounded-xl border bg-card p-4">
      <h3 className="text-lg">
        {row.name} · {row.assistance_type}
      </h3>
      <Fields
        entries={[
          ["Reference", row.id],
          ["Received", date(row.created_at)],
          ["Phone", row.phone],
          ["Village / area", row.village],
          ["Assigned to", row.assigned_to],
          ["Follow-up", date(row.follow_up_at)],
          ["Staff notes", row.staff_notes],
        ]}
      />
      <label className="mt-4 inline-flex items-center gap-3 text-sm">
        Request status
        <select
          className={control}
          value={row.status}
          disabled={saving}
          onChange={(e) => void update(e.target.value)}
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status.replace("_", " ")}
            </option>
          ))}
        </select>
      </label>
      {error && <p role="alert">{error}</p>}
    </article>
  );
}

function DonationCard({ row }: { row: DonationRow }) {
  return (
    <article className="rounded-xl border bg-card p-4">
      <h3 className="text-lg">
        {row.name} · {currency.format(row.amount_paise / 100)}
      </h3>
      <Fields
        entries={[
          ["Payment status", row.status.replaceAll("_", " ")],
          ["Environment", row.mode],
          ["Gateway", row.provider],
          ["Transaction / payment ID", row.payment_id],
          ["Order ID", row.order_id],
          ["Donation reference", row.id],
          ["Created", date(row.created_at)],
          ["Verified", date(row.verified_at)],
          ["Refunded", currency.format(row.amount_refunded / 100)],
          ["Settlement reference", row.settlement_reference],
          ["Settled", date(row.settled_at)],
          ["Receipt reference", row.receipt_reference],
          ["Email", row.email],
          ["Phone", row.phone],
          ["Staff notes", row.staff_notes],
        ]}
      />
    </article>
  );
}

function Queues({ client, onDenied }: Props) {
  const [queue, setQueue] = useState<Queue>("requests");
  const [page, setPage] = useState(0);
  const [live, setLive] = useState(false);
  const cache = useQueryClient();
  const records = useQuery({
    queryKey: ["staff", queue, page],
    queryFn: async ({ signal }) => {
      const result = await client
        .rpc("staff_queue", { queue_name: queue, page_number: page })
        .abortSignal(signal);
      if (result.error) throw result.error;
      return result.data as (RequestRow | DonationRow)[];
    },
    retry: false,
    gcTime: 0,
    refetchInterval: 15000,
  });
  useEffect(() => {
    if (
      records.error &&
      "code" in records.error &&
      ["42501", "PGRST301", "PGRST303"].includes(String(records.error.code))
    )
      onDenied();
  }, [records.error, onDenied]);
  useEffect(() => {
    const refresh = () => {
      void cache.invalidateQueries({ queryKey: ["staff"] });
    };
    const channel = client
      .channel("staff-queue-changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "staff_queue_signal" },
        refresh,
      )
      .subscribe((status) => {
        setLive(status === "SUBSCRIBED");
        if (status === "SUBSCRIBED") refresh();
      });
    return () => {
      void client.removeChannel(channel);
    };
  }, [client, cache]);
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["requests", "donations"] as const).map((name) => (
          <button
            key={name}
            className={control}
            aria-pressed={queue === name}
            onClick={() => {
              setQueue(name);
              setPage(0);
            }}
          >
            {name === "requests" ? "Requests" : "Donations"}
          </button>
        ))}
        <button className={control} onClick={() => void records.refetch()}>
          Refresh
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        {live ? "Live updates connected" : "Checking for changes every 15 seconds"}
      </p>
      {records.isError ? (
        <p role="alert">Unable to load records. Refresh to retry.</p>
      ) : records.isPending ? (
        <p role="status">Loading records…</p>
      ) : records.data.length === 0 ? (
        <p>No records on this page.</p>
      ) : (
        records.data.map((row) =>
          "payment_id" in row ? (
            <DonationCard key={row.id} row={row} />
          ) : (
            <RequestCard key={row.id} row={row} client={client} />
          ),
        )
      )}
      <div className="flex items-center gap-3">
        <button className={control} disabled={page === 0} onClick={() => setPage(page - 1)}>
          Previous
        </button>
        <span>Page {page + 1}</span>
        <button
          className={control}
          disabled={records.data?.length !== 25}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </section>
  );
}

export function StaffQueue(props: Props) {
  // Each login has an isolated in-memory cache, destroyed when the staff session ends.
  const [cache] = useState(() => new QueryClient());
  useEffect(() => () => cache.clear(), [cache]);
  return (
    <QueryClientProvider client={cache}>
      <Queues {...props} />
    </QueryClientProvider>
  );
}
