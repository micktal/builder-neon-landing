import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// Minimal Leaflet typings
declare global { interface Window { L?: any } }

type Prospect = { id?: string; company_name: string; sector?: string; region?: string; priority_score?: number };

const REGION_CENTROIDS: Record<string, [number, number]> = {
  // Abbreviations
  "IDF": [48.8566, 2.3522],
  "PACA": [43.2965, 5.3698],
  "ARA": [45.7640, 4.8357],
  "HDF": [50.6292, 3.0573],
  "NA": [44.8378, -0.5792],
  "GE": [48.6921, 6.1844],
  // Full names
  "Île-de-France": [48.8566, 2.3522],
  "Ile-de-France": [48.8566, 2.3522],
  "Auvergne-Rhône-Alpes": [45.7640, 4.8357],
  "Hauts-de-France": [50.6292, 3.0573],
  "Grand Est": [48.6921, 6.1844],
  "Nouvelle-Aquitaine": [44.8378, -0.5792],
  "Provence-Alpes-Côte d'Azur": [43.2965, 5.3698],
  "Bretagne": [48.1173, -1.6778],
  "Normandie": [49.1829, -0.3707],
  "Occitanie": [43.6047, 1.4442],
  "Centre-Val de Loire": [47.9029, 1.9093],
  "Bourgogne-Franche-Comté": [47.3220, 5.0415],
  "Pays de la Loire": [47.2184, -1.5536],
  "Corse": [42.0396, 9.0129],
};

const SECTOR_COLORS = ["#2563eb","#059669","#d97706","#dc2626","#7c3aed","#0ea5e9","#16a34a","#ca8a04","#ef4444","#a21caf"];

function colorByScore(score?: number) {
  const v = typeof score === 'number' ? score : 50;
  if (v <= 30) return "#2563eb";
  if (v <= 70) return "#d97706";
  return "#dc2626";
}

function sectorColor(sector?: string) {
  if (!sector) return "#64748b";
  const i = Math.abs(hashCode(sector)) % SECTOR_COLORS.length;
  return SECTOR_COLORS[i];
}

function hashCode(s: string) { let h = 0; for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; } return h; }

function jitter(base: [number, number], seed: string) {
  const h = Math.abs(hashCode(seed)) % 1000;
  const dx = ((h % 100) - 50) / 5000; // ~ +/- 0.01°
  const dy = (((Math.floor(h / 100)) % 100) - 50) / 5000;
  return [base[0] + dy, base[1] + dx] as [number, number];
}

export default function ProspectsMap({ items, colorMode = 'score' }: { items: Prospect[]; colorMode?: 'score'|'sector' }) {
  const nav = useNavigate();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<any>(null);
  const layerGroup = useRef<any>(null);
  const [mode, setMode] = useState<'score'|'sector'>(colorMode);

  const L = typeof window !== 'undefined' ? window.L : undefined;

  const points = useMemo(() => {
    return (items || []).map((p) => {
      const center = REGION_CENTROIDS[p.region || ''] || [46.6, 2.2];
      const pos = jitter(center as [number, number], (p.id || p.company_name));
      return { ...p, pos } as Prospect & { pos: [number, number] };
    });
  }, [items]);

  // Initialize map
  useEffect(() => {
    if (!L) return;
    if (!mapInstance.current && mapRef.current) {
      const m = L.map(mapRef.current, { zoomControl: true, attributionControl: false }).setView([46.6, 2.2], 5);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(m);
      mapInstance.current = m;
      layerGroup.current = L.layerGroup().addTo(m);
      m.on('zoomend', updateLabels);
    }
    renderMarkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [L, points, mode]);

  const renderMarkers = () => {
    const m = mapInstance.current; const g = layerGroup.current; if (!m || !g || !L) return;
    g.clearLayers();
    const z = m.getZoom ? m.getZoom() : 5;
    points.forEach((p) => {
      const color = mode === 'score' ? colorByScore(p.priority_score) : sectorColor(p.sector);
      const r = Math.max(4, Math.min(14, (p.priority_score || 50) / 8));
      const marker = L.circleMarker(p.pos, { radius: r, color, fillColor: color, fillOpacity: 0.6, weight: 1 });
      if (z >= 8) marker.bindTooltip(p.company_name, { permanent: false, direction: 'top' });
      marker.on('click', () => nav(`/prospects/${p.id}`));
      marker.addTo(g);
    });
  };

  const updateLabels = () => renderMarkers();

  return (
    <div className="relative rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
      <div className="flex items-center justify-between px-2 pb-2">
        <div className="text-sm text-slate-700">Carte des prospects — couleur par {mode === 'score' ? 'score' : 'secteur'}</div>
        <div className="flex items-center gap-2">
          <button onClick={()=>setMode('score')} className={`rounded-md border px-2 py-1 text-xs ${mode==='score' ? 'bg-primary text-primary-foreground' : 'bg-white'}`}>Score</button>
          <button onClick={()=>setMode('sector')} className={`rounded-md border px-2 py-1 text-xs ${mode==='sector' ? 'bg-primary text-primary-foreground' : 'bg-white'}`}>Secteur</button>
        </div>
      </div>
      <div ref={mapRef} style={{ height: 520, borderRadius: 12, overflow: 'hidden' }} />
      <div className="px-2 pt-2 text-xs text-slate-500">Zoom pour révéler les labels. Cliquez sur un point pour ouvrir la fiche.</div>
    </div>
  );
}
