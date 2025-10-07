import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

type Template = {
  template_name: string;
  use_case?: string;
  domain_filter?: string[];
  sector_filter?: string[];
  format_filter?: string[];
  audience_filter?: string[];
  email_subject?: string;
  email_body?: string;
  speech_text?: string;
};

export default function Templates() {
  const [items, setItems] = useState<{ id: string; data: Template }[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const fetchJson = async (url: string) => {
        try {
          const res = await fetch(url);
          const txt = await res.text();
          try { return { ok: res.ok, data: JSON.parse(txt) }; } catch { return { ok: res.ok, data: null }; }
        } catch (e) {
          return { ok: false, data: null } as const;
        }
      };
      try {
        let { ok, data } = await fetchJson('/api/templates?limit=200');
        let list = ok && data?.items ? data.items : [];
        if (!Array.isArray(list) || list.length === 0) {
          await fetch('/api/import/templates').catch(() => {});
          ({ ok, data } = await fetchJson('/api/templates?limit=200'));
          list = ok && data?.items ? data.items : [];
        }
        setItems(Array.isArray(list) ? list : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return items.filter(({ data }) => {
      if (!s) return true;
      const hay = [
        data.template_name,
        data.use_case,
        ...(data.domain_filter || []),
        ...(data.sector_filter || []),
        ...(data.format_filter || []),
        ...(data.audience_filter || []),
        data.email_subject,
        data.speech_text,
      ].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(s);
    });
  }, [items, q]);

  return (
    <div className="container py-8">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Templates</h1>
          <p className="text-muted-foreground">Modèles d'e-mails et de scripts — filtrables et prêts à copier.</p>
        </div>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Recherche…" className="w-64" />
      </div>

      <div className="mt-6 text-sm text-muted-foreground">{loading ? 'Chargement…' : `${filtered.length} template(s)`}</div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(({ id, data }) => (
          <div key={id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">{data.template_name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{data.use_case}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(data.domain_filter || []).map((x) => (<Badge key={`d:${x}`} variant="secondary">{x}</Badge>))}
              {(data.sector_filter || []).map((x) => (<Badge key={`s:${x}`} variant="outline">{x}</Badge>))}
              {(data.format_filter || []).map((x) => (<Badge key={`f:${x}`} variant="outline">{x}</Badge>))}
              {(data.audience_filter || []).map((x) => (<Badge key={`a:${x}`} variant="secondary">{x}</Badge>))}
            </div>
            {data.email_subject && <div className="mt-3 text-sm font-medium">{data.email_subject}</div>}
            {data.email_body && <pre className="mt-2 whitespace-pre-wrap text-xs text-slate-700">{data.email_body}</pre>}
          </div>
        ))}
      </div>
    </div>
  );
}
