import { useState } from "react";
import { adminApi } from "@/lib/api";
import { ErrorBanner, PageHeader } from "@/components/ui";

export function NotificationsPage() {
  const [titleEn, setTitleEn] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [bodyEn, setBodyEn] = useState("");
  const [bodyAr, setBodyAr] = useState("");
  const [userId, setUserId] = useState("");
  const [type, setType] = useState("promo");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Notifications"
        subtitle="Send global or user-targeted notices (promo / maintenance / security)"
      />
      {error ? <ErrorBanner message={error} /> : null}
      {message ? <div className="card text-sm text-emerald-300">{message}</div> : null}
      <form
        className="card grid gap-3 md:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          setMessage(null);
          void adminApi("notifications", "send", {
            titleEn,
            titleAr: titleAr || titleEn,
            bodyEn,
            bodyAr: bodyAr || bodyEn,
            type,
            userId: userId || undefined,
          })
            .then(() => setMessage("Notification queued/sent."))
            .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed"));
        }}
      >
        <input
          className="input"
          placeholder="Title EN"
          value={titleEn}
          onChange={(e) => setTitleEn(e.target.value)}
          required
        />
        <input
          className="input"
          placeholder="Title AR"
          value={titleAr}
          onChange={(e) => setTitleAr(e.target.value)}
        />
        <textarea
          className="textarea md:col-span-2"
          placeholder="Body EN"
          value={bodyEn}
          onChange={(e) => setBodyEn(e.target.value)}
          required
        />
        <textarea
          className="textarea md:col-span-2"
          placeholder="Body AR"
          value={bodyAr}
          onChange={(e) => setBodyAr(e.target.value)}
        />
        <select className="select" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="promo">promo</option>
          <option value="order">order</option>
          <option value="security">security</option>
          <option value="support">support</option>
        </select>
        <input
          className="input"
          placeholder="User ID (empty = global fan-out)"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
        <button className="btn md:col-span-2" type="submit">
          Send
        </button>
      </form>
    </div>
  );
}
