import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";
import { computeScriptRecommendations } from "@/lib/recommendations";

type Prospect = {
  id?: string;
  company_name: string;
  sector?: string;
  region?: string;
  size_band?: string;
  priority_score?: number;
  createdAt?: string;
  contacts?: { name?: string; email?: string; role?: string }[];
};
type Formation = { id?: string; data?: any } & any;
type Template = { id?: string; data?: any } & any;

const SECTORS = [
  "Industrie",
  "Santé",
  "Retail/Luxe",
  "Transport",
  "BTP",
  "Tertiaire",
  "Public",
  "Éducation",
];
const REGIONS = [
  "IDF",
  "PACA",
  "ARA",
  "HDF",
  "NA",
  "GE",
  "Bretagne",
  "Normandie",
  "Occitanie",
  "Corse",
];
const FORMATS = ["Présentiel", "Distanciel", "Blended", "E-learning"];
const DOMAINS = [
  "Sûreté",
  "Gestion de conflit",
  "Prévention HSE",
  "Management",
  "Secourisme",
  "Accueil",
  "E-learning",
];
const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
  "#84CC16",
  "#F472B6",
];

export default function Analytics() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [formations, setFormations] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);

  const [filters, setFilters] = useState<{
    period: "90d" | "6m" | "12m" | "all";
    sector: string[];
    region: string[];
    format: string[];
    domain: string[];
  }>({ period: "6m", sector: [], region: [], format: [], domain: [] });

  useEffect(() => {
    (async () => {
      const [p, f, t] = await Promise.all([
        fetch("/api/prospects?limit=2000")
          .then((r) => r.json())
          .catch(() => ({ items: [] })),
        fetch("/api/formations?limit=2000")
          .then((r) => r.json())
          .catch(() => ({ items: [] })),
        fetch("/api/templates?limit=2000")
          .then((r) => r.json())
          .catch(() => ({ items: [] })),
      ]);
      setProspects(Array.isArray(p?.items) ? p.items.map((x: any) => x.data) : []);
      setFormations(Array.isArray(f?.items) ? f.items.map((x: any) => x.data) : []);
      setTemplates(Array.isArray(t?.items) ? t.items.map((x: any) => x.data) : []);
    })();
  }, []);

  const dateFrom = useMemo(() => {
    const now = new Date();
    const d = new Date(now);
    if (filters.period === "90d") d.setDate(d.getDate() - 90);
    else if (filters.period === "6m") d.setMonth(d.getMonth() - 6);
    else if (filters.period === "12m") d.setFullYear(d.getFullYear() - 1);
    else return null;
    return d;
  }, [filters.period]);

  const applyProspectFilters = (list: Prospect[]) =>
    list.filter((p) => {
      const created = p.createdAt ? new Date(p.createdAt) : null;
      if (dateFrom && created && created < dateFrom) return false;
      if (filters.sector.length && (!p.sector || !filters.sector.includes(p.sector)))
        return false;
      if (filters.region.length && (!p.region || !filters.region.includes(p.region)))
        return false;
      return true;
    });

  const applyFormationFilters = (list: any[]) =>
    list.filter((f) => {
      if (filters.domain.length && (!f.domain || !filters.domain.includes(f.domain)))
        return false;
      if (filters.format.length) {
        const fmts = Array.isArray(f.format) ? f.format : f.format ? [f.format] : [];
        if (!fmts.some((x: string) => filters.format.includes(x))) return false;
      }
      return true;
    });

  const applyTemplateFilters = (list: any[]) =>
    list.filter((t) => {
      if (filters.domain.length) {
        const ds = t.domain_filter || [];
        if (!ds.some((x: string) => filters.domain.includes(x))) return false;
      }
      if (filters.format.length) {
        const fs = t.format_filter || [];
        if (!fs.some((x: string) => filters.format.includes(x))) return false;
      }
      return true;
    });

  const filteredProspects = useMemo(
    () => applyProspectFilters(prospects),
    [prospects, filters, dateFrom],
  );
  const filteredFormations = useMemo(
    () => applyFormationFilters(formations),
    [formations, filters],
  );
  const filteredTemplates = useMemo(
    () => applyTemplateFilters(templates),
    [templates, filters],
  );

  const scriptMatches = useMemo(
    () =>
      filteredProspects.map((prospect) => ({
        prospect,
        recs: computeScriptRecommendations({
          prospect,
          formations: filteredFormations,
          templates: filteredTemplates,
          contact: Array.isArray(prospect.contacts)
            ? prospect.contacts[0]
            : undefined,
        }),
      })),
    [filteredProspects, filteredFormations, filteredTemplates],
  );

  const prospectsWithScripts = scriptMatches.filter((m) => m.recs.length > 0).length;
  const coveragePct = filteredProspects.length
    ? Math.round((prospectsWithScripts / filteredProspects.length) * 100)
    : 0;

  const useCaseDistrib = useMemo(() => {
    const counts: Record<string, number> = {};
    scriptMatches.forEach((match) => {
      if (!match.recs.length) return;
      const useCase = match.recs[0].template.use_case || "Autre";
      counts[useCase] = (counts[useCase] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [scriptMatches]);

  const topScripts = useMemo(
    () =>
      scriptMatches
        .filter((m) => m.recs.length)
        .slice(0, 10)
        .map((m) => ({
          prospect: m.prospect,
          recommendation: m.recs[0],
        })),
    [scriptMatches],
  );

  const prospectsWithoutScripts = useMemo(
    () => scriptMatches.filter((m) => !m.recs.length).slice(0, 10),
    [scriptMatches],
  );

  const kProspects = filteredProspects.length;
  const kAvgScore = Math.round(
    (filteredProspects.reduce((a, p) => a + (p.priority_score || 0), 0) /
      (kProspects || 1)) *
      1,
  );
  const kFormations = filteredFormations.length;
  const kTemplates = filteredTemplates.length;

  const bySector = useMemo(() => {
    const m: Record<string, number> = {};
    filteredProspects.forEach((p) => {
      const s = p.sector || "—";
      m[s] = (m[s] || 0) + 1;
    });
    return Object.entries(m)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredProspects]);

  const formatDistrib = useMemo(() => {
    const cnt: Record<string, number> = {
      Présentiel: 0,
      Distanciel: 0,
      Blended: 0,
      "E-learning": 0,
    } as any;
    filteredFormations.forEach((f) => {
      (Array.isArray(f.format) ? f.format : f.format ? [f.format] : []).forEach(
        (x: string) => {
          if (cnt[x] !== undefined) cnt[x]++;
        },
      );
    });
    return Object.entries(cnt).map(([name, value]) => ({ name, value }));
  }, [filteredFormations]);

  const byMonth = useMemo(() => {
    const m: Record<string, number> = {};
    const fmt = (d: Date) =>
      d.toLocaleDateString("fr-FR", { month: "short", year: "numeric" });
    const ref = dateFrom || new Date(new Date().setFullYear(new Date().getFullYear() - 1));
    filteredProspects.forEach((p) => {
      const d = p.createdAt ? new Date(p.createdAt) : new Date();
      if (d < ref) return;
      const label = fmt(new Date(d.getFullYear(), d.getMonth(), 1));
      m[label] = (m[label] || 0) + 1;
    });
    return Object.entries(m)
      .map(([name, value]) => ({ name, value }))
      .sort(
        (a, b) =>
          new Date((a as any).name).getTime() - new Date((b as any).name).getTime(),
      )
      .slice(-12);
  }, [filteredProspects, dateFrom]);

  const avgScoreBySector = useMemo(() => {
    const acc: Record<string, { sum: number; n: number }> = {};
    filteredProspects.forEach((p) => {
      const s = p.sector || "—";
      if (!acc[s]) acc[s] = { sum: 0, n: 0 };
      acc[s].sum += p.priority_score || 0;
      acc[s].n += 1;
    });
    return Object.entries(acc)
      .map(([name, v]) => ({ name, value: Math.round((v.sum / v.n) * 10) / 10 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [filteredProspects]);

  const byRegion = useMemo(() => {
    const m: Record<string, number> = {};
    filteredProspects.forEach((p) => {
      const r = p.region || "—";
      m[r] = (m[r] || 0) + 1;
    });
    return Object.entries(m)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredProspects]);

  const lastProspects = useMemo(
    () =>
      [...filteredProspects]
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
        )
        .slice(0, 30),
    [filteredProspects],
  );

  const resetFilters = () =>
    setFilters({ period: "6m", sector: [], region: [], format: [], domain: [] });

  return (
    <div className="container max-w-[1280px] px-4 sm:px-6 py-6">
      {/* Filters */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <div className="text-xs text-slate-600">Période</div>
            <select
              value={filters.period}
              onChange={(e) =>
                setFilters((f) => ({ ...f, period: e.target.value as any }))
              }
              className="rounded-md border px-3 py-2 text-sm"
            >
              <option value="90d">90 jours</option>
              <option value="6m">6 mois</option>
              <option value="12m">12 mois</option>
              <option value="all">Tout</option>
            </select>
          </div>
          <div>
            <div className="text-xs text-slate-600">Secteur</div>
            <select
              multiple
              value={filters.sector}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  sector: Array.from(e.target.selectedOptions).map((o) => o.value),
                }))
              }
              className="rounded-md border px-3 py-2 text-sm min-w-[180px]"
            >
              {SECTORS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="text-xs text-slate-600">Région</div>
            <select
              multiple
              value={filters.region}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  region: Array.from(e.target.selectedOptions).map((o) => o.value),
                }))
              }
              className="rounded-md border px-3 py-2 text-sm min-w-[180px]"
            >
              {REGIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="text-xs text-slate-600">Format cible</div>
            <select
              multiple
              value={filters.format}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  format: Array.from(e.target.selectedOptions).map((o) => o.value),
                }))
              }
              className="rounded-md border px-3 py-2 text-sm min-w-[180px]"
            >
              {FORMATS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="text-xs text-slate-600">Domaine</div>
            <select
              multiple
              value={filters.domain}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  domain: Array.from(e.target.selectedOptions).map((o) => o.value),
                }))
              }
              className="rounded-md border px-3 py-2 text-sm min-w-[180px]"
            >
              {DOMAINS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="ml-auto">
            <Button variant="outline" onClick={resetFilters}>
              Réinitialiser filtres
            </Button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Prospects (filtrés)", value: kProspects },
          { label: "Score moyen", value: isFinite(kAvgScore) ? kAvgScore : 0 },
          { label: "Formations dispo", value: kFormations },
          { label: "Templates dispo", value: kTemplates },
          {
            label: "Couverture scripts",
            value: `${prospectsWithScripts}/${kProspects || 0} (${coveragePct}%)`,
          },
        ].map((k, i) => (
          <div
            key={i}
            className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="text-xs text-slate-600">{k.label}</div>
            <div className="mt-1 text-2xl font-bold">{k.value}</div>
            <div className="text-xs text-slate-500 mt-1">Variation: —</div>
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="font-medium">Prospects par secteur</div>
            <div className="text-xs text-slate-600">Total: {kProspects}</div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bySector}>
                <XAxis dataKey="name" hide={false} />
                <YAxis allowDecimals={false} />
                <RTooltip />
                <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="font-medium">Répartition des formats</div>
            <div className="text-xs text-slate-600">
              Total: {filteredFormations.length}
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={formatDistrib} dataKey="value" nameKey="name" outerRadius={100}>
                  {formatDistrib.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <RTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="font-medium">Tendance mensuelle (prospects)</div>
            <div className="text-xs text-slate-600">Total: {kProspects}</div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={byMonth}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <RTooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="font-medium">Top secteurs par score moyen</div>
            <div className="text-xs text-slate-600">Total: {kProspects}</div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={avgScoreBySector} layout="vertical">
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="name" type="category" width={100} />
                <RTooltip />
                <Bar dataKey="value" fill="#10B981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="font-medium">Prospects par région</div>
            <div className="text-xs text-slate-600">Total: {kProspects}</div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byRegion}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <RTooltip />
                <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="font-medium">Use cases scripts recommandés</div>
            <div className="text-xs text-slate-600">
              Prospects couverts: {prospectsWithScripts}
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={useCaseDistrib} dataKey="value" nameKey="name" outerRadius={110}>
                  {useCaseDistrib.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <RTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recommended scripts table */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-0">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="font-medium">Top prospects avec script recommandé</div>
              <Badge variant="secondary" className="text-xs">
                {prospectsWithScripts}
              </Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left">Entreprise</th>
                    <th className="p-2 text-left">Script</th>
                    <th className="p-2 text-left">Use case</th>
                    <th className="p-2 text-left">Formation</th>
                  </tr>
                </thead>
                <tbody>
                  {topScripts.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-slate-500">
                        Aucun script recommandé sur ce périmètre
                      </td>
                    </tr>
                  )}
                  {topScripts.map(({ prospect, recommendation }, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="p-2 font-medium text-slate-900">
                        {prospect.company_name}
                      </td>
                      <td className="p-2 text-slate-700">
                        {recommendation.template.template_name}
                      </td>
                      <td className="p-2 text-slate-600">
                        {recommendation.template.use_case || "—"}
                      </td>
                      <td className="p-2 text-slate-600">
                        {recommendation.formation?.title || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="font-medium">Prospects sans script disponible</div>
              <Badge variant="outline" className="text-xs">
                {prospectsWithoutScripts.length}
              </Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left">Entreprise</th>
                    <th className="p-2 text-left">Secteur</th>
                    <th className="p-2 text-left">Région</th>
                  </tr>
                </thead>
                <tbody>
                  {prospectsWithoutScripts.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-4 text-center text-slate-500">
                        Tous les prospects filtrés disposent d’un script.
                      </td>
                    </tr>
                  )}
                  {prospectsWithoutScripts.map(({ prospect }, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="p-2">{prospect.company_name}</td>
                      <td className="p-2">{prospect.sector || "—"}</td>
                      <td className="p-2">{prospect.region || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Latest prospects */}
      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="font-medium">Derniers prospects (30)</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm mt-3">
            <thead>
              <tr className="border-b">
                <th className="p-2 text-left">Entreprise</th>
                <th className="p-2 text-left">Secteur</th>
                <th className="p-2 text-left">Région</th>
                <th className="p-2 text-left">Taille</thead>