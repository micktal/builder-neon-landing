const PUBLIC_KEY = import.meta.env.VITE_BUILDER_PUBLIC_KEY as string | undefined;

export type BuilderItem<T> = { id?: string; data: T };

export async function fetchBuilderContent<T = any>(model: string, opts?: { limit?: number; cacheBust?: boolean }): Promise<{ items: T[]; total?: number }> {
  if (!PUBLIC_KEY) return { items: [] };
  const params = new URLSearchParams({ apiKey: PUBLIC_KEY, limit: String(opts?.limit ?? 100) });
  if (opts?.cacheBust) params.set("cachebust", String(Date.now()));
  params.set("fields", "data");
  const url = `https://cdn.builder.io/api/v3/content/${encodeURIComponent(model)}?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) return { items: [] };
  const json = await res.json();
  const results = Array.isArray(json?.results) ? json.results : [];
  const items: T[] = results.map((r: any) => (r?.data ?? r) as T);
  const total = (json?.count ?? json?.total) as number | undefined;
  return { items, total };
}

export async function fetchBuilderContentWithIds<T = any>(
  model: string,
  opts?: { limit?: number; cacheBust?: boolean }
): Promise<{ items: { id: string; data: T }[]; total?: number }> {
  if (!PUBLIC_KEY) return { items: [] };
  const params = new URLSearchParams({ apiKey: PUBLIC_KEY, limit: String(opts?.limit ?? 100) });
  if (opts?.cacheBust) params.set("cachebust", String(Date.now()));
  params.set("fields", "data,id");
  const url = `https://cdn.builder.io/api/v3/content/${encodeURIComponent(model)}?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) return { items: [] };
  const json = await res.json();
  const results = Array.isArray(json?.results) ? json.results : [];
  const items = results
    .map((r: any) => ({ id: r?.id || r?._id, data: (r?.data ?? r) as T }))
    .filter((x: any) => x.id);
  const total = (json?.count ?? json?.total) as number | undefined;
  return { items, total };
}

export async function fetchBuilderItem<T = any>(model: string, id: string): Promise<T | null> {
  if (!PUBLIC_KEY) return null;
  const params = new URLSearchParams({ apiKey: PUBLIC_KEY, limit: "1" });
  // Query by id
  params.set("query.id", id);
  params.set("fields", "data,id");
  const url = `https://cdn.builder.io/api/v3/content/${encodeURIComponent(model)}?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  const r = Array.isArray(json?.results) && json.results[0];
  return (r?.data ?? null) as T | null;
}
