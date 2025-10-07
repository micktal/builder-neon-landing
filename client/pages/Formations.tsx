import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type Formation = {
  title: string;
  domain?: string;
  format?: string[];
  duration?: string;
  audiences?: string[];
  sectors?: string[];
  objectives?: string;
  keywords?: string[];
};

export default function Formations() {
  const [items, setItems] = useState<{ id: string; data: Formation }[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [q, setQ] = useState("");
  const [sector, setSector] = useState<string>("all");
  const [audience, setAudience] = useState<string>("all");
  const [domain, setDomain] = useState<string>("all");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/formations?limit=200`);
        const json = await res.json();
        setItems(json?.items || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const options = useMemo(() => {
    const sectors = new Set<string>();
    const audiences = new Set<string>();
    const domains = new Set<string>();
    for (const it of items) {
      it.data.sectors?.forEach((s) => s && sectors.add(s));
      it.data.audiences?.forEach((a) => a && audiences.add(a));
      if (it.data.domain) domains.add(it.data.domain);
    }
    return {
      sectors: Array.from(sectors).sort(),
      audiences: Array.from(audiences).sort(),
      domains: Array.from(domains).sort(),
    };
  }, [items]);

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    return items.filter(({ data }) => {
      if (sector !== "all" && !(data.sectors || []).includes(sector)) return false;
      if (audience !== "all" && !(data.audiences || []).includes(audience)) return false;
      if (domain !== "all" && data.domain !== domain) return false;
      if (!text) return true;
      const hay = [
        data.title,
        data.domain,
        ...(data.format || []),
        data.duration,
        data.objectives,
        ...(data.keywords || []),
        ...(data.sectors || []),
        ...(data.audiences || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(text);
    });
  }, [items, q, sector, audience, domain]);

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Formations</h1>
          <p className="text-muted-foreground">Catalogue FPSG — filtrez par secteur, public, domaine et mot-clé.</p>
        </div>
        <div className="flex gap-2 items-center">
          <Input placeholder="Recherche…" value={q} onChange={(e) => setQ(e.target.value)} className="w-56" />
          <Select value={domain} onValueChange={setDomain}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Domaine" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous domaines</SelectItem>
              {options.domains.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={audience} onValueChange={setAudience}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Public" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous publics</SelectItem>
              {options.audiences.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sector} onValueChange={setSector}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Secteur" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous secteurs</SelectItem>
              {options.sectors.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-6 text-sm text-muted-foreground">
        {loading ? "Chargement…" : `${filtered.length} formation(s)`}
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(({ id, data }) => (
          <Link key={id} to={`/formations/${encodeURIComponent(id)}`} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow transition block">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">{data.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{data.domain} • {data.duration || "Durée N/A"}</p>
              </div>
            </div>
            {data.objectives && <p className="mt-3 text-sm text-slate-700 line-clamp-3">{data.objectives}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              {(data.audiences || []).slice(0, 3).map((a) => (
                <Badge key={a} variant="secondary">{a}</Badge>
              ))}
              {(data.sectors || []).slice(0, 3).map((s) => (
                <Badge key={s} variant="outline">{s}</Badge>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
