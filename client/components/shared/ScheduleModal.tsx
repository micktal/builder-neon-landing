import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { addMinutes, format, isBefore, setHours, setMinutes } from "date-fns";
import { fr } from "date-fns/locale";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

interface ProspectLike { company_name: string; sector?: string; region?: string; contacts?: { name?: string; email?: string; phone?: string }[] }

export default function ScheduleModal({ open, onClose, prospect }: { open: boolean; onClose: () => void; prospect: ProspectLike }) {
  const { toast } = useToast();
  const [connected, setConnected] = useState(false);
  const [day, setDay] = useState<Date | undefined>(() => new Date());
  const [duration, setDuration] = useState(30);
  const [busy, setBusy] = useState<{ start: Date; end: Date }[]>([]);
  const [slot, setSlot] = useState<Date | null>(null);
  const [location, setLocation] = useState("Visio");
  const contactEmail = prospect?.contacts?.[0]?.email || "";

  useEffect(() => {
    if (!open) return;
    (async () => {
      const s = await fetch('/api/gcal/status').then(r=>r.json()).catch(()=>({connected:false}));
      setConnected(!!s?.connected);
    })();
  }, [open]);

  useEffect(() => {
    if (!open || !connected || !day) return;
    (async () => {
      const start = setMinutes(setHours(day, 8), 0);
      const end = setMinutes(setHours(day, 19), 0);
      const body = { timeMin: start.toISOString(), timeMax: end.toISOString() };
      const resp = await fetch('/api/gcal/freebusy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const json = await resp.json();
      if (!resp.ok) { toast({ title: json?.error || 'Erreur Google Calendar' }); return; }
      const ranges = (json?.calendars?.primary?.busy || []) as { start: string; end: string }[];
      setBusy(ranges.map(r => ({ start: new Date(r.start), end: new Date(r.end) })));
      setSlot(null);
    })();
  }, [open, connected, day]);

  const connectGcal = async () => {
    const data = await fetch('/api/gcal/auth-url').then(r=>r.json()).catch(()=>null);
    const url = data?.url; if (!url) { toast({ title: 'Config Google manquante' }); return; }
    const w = window.open(url, 'gcal_auth', 'width=600,height=700');
    const onMsg = (e: MessageEvent) => {
      if (e?.data?.type === 'gcal_connected') { setConnected(true); window.removeEventListener('message', onMsg); w?.close(); }
    };
    window.addEventListener('message', onMsg);
  };

  const slots = useMemo(() => {
    if (!day) return [] as Date[];
    const workStart = setMinutes(setHours(day, 9), 0);
    const workEnd = setMinutes(setHours(day, 18), 0);
    const out: Date[] = [];
    for (let d = workStart; isBefore(d, workEnd); d = addMinutes(d, 30)) {
      const end = addMinutes(d, duration);
      const overlaps = busy.some(b => !(end <= b.start || d >= b.end));
      if (!overlaps) out.push(d);
    }
    return out;
  }, [day, busy, duration]);

  const schedule = async () => {
    if (!slot) return;
    try {
      const start = slot.toISOString();
      const end = addMinutes(slot, duration).toISOString();
      const summary = `RDV FPSG — ${prospect?.company_name}`;
      const description = `Échange commercial (sécurité & prévention). Prospect: ${prospect?.company_name} (${prospect?.sector||''}/${prospect?.region||''}).`;
      const resp = await fetch('/api/gcal/create-event', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ summary, description, start, end, attendeeEmail: contactEmail || undefined, location }) });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json?.error || 'Erreur création événement');
      toast({ title: '✅ RDV planifié et invitation envoyée' });
      onClose();
    } catch (e:any) {
      toast({ title: e?.message || 'Erreur Google Calendar' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v)=>!v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Planifier un RDV</DialogTitle>
          <DialogDescription>Choisissez un créneau disponible et envoyez l'invitation (Google Calendar).</DialogDescription>
        </DialogHeader>

        {!connected ? (
          <div className="space-y-3">
            <div className="text-sm text-slate-700">Connectez votre Google Calendar pour récupérer vos disponibilités et envoyer des invitations automatiquement.</div>
            <Button onClick={connectGcal}>Connecter Google Calendar</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3">
              <DayPicker mode="single" selected={day} onSelect={setDay} locale={fr} disabled={(d)=>d.getDay()===0 || d.getDay()===6} />
            </div>
            <div className="lg:col-span-2 space-y-3">
              <div>
                <label className="text-sm font-medium">Durée</label>
                <select className="mt-1 w-full rounded-md border px-3 py-2 text-sm" value={duration} onChange={(e)=>setDuration(Number(e.target.value))}>
                  {[30,45,60].map((n) => <option key={n} value={n}>{n} min</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Lieu</label>
                <Input value={location} onChange={(e)=>setLocation(e.target.value)} placeholder="Visio / Adresse" />
              </div>
              <div className="max-h-[260px] overflow-auto rounded border p-2">
                {slots.length === 0 && <div className="text-sm text-slate-600">Aucun créneau dispo ce jour.</div>}
                <div className="grid grid-cols-2 gap-2">
                  {slots.map((d, i) => (
                    <button key={i} onClick={()=>setSlot(d)} className={`rounded-md border px-2 py-1 text-sm ${slot?.getTime()===d.getTime() ? 'bg-blue-600 text-white' : 'bg-white'}`}>{format(d, 'HH:mm', { locale: fr })}</button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onClose}>Annuler</Button>
                <Button onClick={schedule} disabled={!slot}>Planifier</Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
