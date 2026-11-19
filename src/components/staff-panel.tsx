import { useEffect, useState, type FormEvent } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { api } from "../lib/api";
import { StaffQueue } from "./staff-queue";

export function StaffPanel() {
  const [client, setClient] = useState<SupabaseClient | null>(null);
  const [user, setUser] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    let stop: (() => void) | undefined;
    api<{ url: string; key: string }>("/api/staff/config")
      .then(({ url, key }) => {
        if (!active) return;
        const connection = createClient(url, key, {
          auth: { persistSession: false, detectSessionInUrl: false },
        });
        setClient(connection);
        const { data } = connection.auth.onAuthStateChange((_event, session) => {
          if (!session) setUser("");
        });
        stop = () => {
          data.subscription.unsubscribe();
          connection.auth.stopAutoRefresh();
        };
      })
      .catch(() => {
        if (active)
          setMessage("Staff sign-in is unavailable. Check the Supabase setup and reload.");
      });
    return () => {
      active = false;
      stop?.();
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client || busy) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    const password = String(fields.get("password") || "");
    setBusy(true);
    setMessage("");
    try {
      if (user) {
        const { error } = await client.auth.updateUser({ password });
        if (error)
          throw new Error(
            "Password change failed. Sign in again and check the project's password requirements.",
          );
        setMessage("Password changed.");
      } else {
        const login = await client.auth.signInWithPassword({
          email: String(fields.get("email") || "").trim(),
          password,
        });
        if (login.error || !login.data.user)
          throw new Error("Sign-in failed. Check your email and password.");
        const membership = await client.rpc("is_ngo_staff");
        if (membership.error || membership.data !== true) {
          await client.auth.signOut({ scope: "local" });
          throw new Error(
            "Staff access is unavailable for this account. Contact the project owner.",
          );
        }
        setUser(login.data.user.email || "Staff");
      }
      form.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Connection failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setUser("");
    setBusy(true);
    setMessage("");
    try {
      await client?.auth.signOut({ scope: "local" });
    } finally {
      window.location.replace("/staff");
    }
  }
  return (
    <main className="mx-auto min-h-screen max-w-6xl space-y-6 px-5 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b pb-5">
        <div>
          <p className="text-sm text-muted-foreground">The House of Doctor</p>
          <h1 className="text-3xl">{user ? "Staff workspace" : "Staff sign-in"}</h1>
        </div>
        {user && (
          <button className="rounded-lg border px-4 py-2" onClick={signOut}>
            Sign out
          </button>
        )}
      </header>
      {user && client && <StaffQueue client={client} onDenied={signOut} />}
      <section className="max-w-md rounded-xl border bg-card p-5">
        {user && <h2 className="mb-3 text-lg">Change password</h2>}
        <form key={user} onSubmit={submit} className="space-y-4">
          {!user && (
            <label className="block">
              Staff email
              <input name="email" type="email" className="field" required autoComplete="username" />
            </label>
          )}
          <label className="block">
            {user ? "New password" : "Password"}
            <input
              name="password"
              type="password"
              required
              minLength={user ? 12 : 1}
              autoComplete={user ? "new-password" : "current-password"}
              className="field"
            />
          </label>
          <button
            disabled={!client || busy}
            className="btn-primary rounded-lg px-4 py-2 disabled:opacity-50"
          >
            {busy ? "Please wait…" : user ? "Save new password" : "Sign in"}
          </button>
        </form>
        {message && (
          <p role="status" className="mt-3 text-sm">
            {message}
          </p>
        )}
      </section>
    </main>
  );
}
