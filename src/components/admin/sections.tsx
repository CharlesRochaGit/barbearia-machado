import { useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Ban, Bell, CalendarDays, Check, CheckCheck, Clock, DollarSign, MessageCircle, Plus, Trash2, UserCheck, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  STATUS_LABEL, WEEKDAYS, addDays, brl, formatDateBr, formatPhone, localDateOf, localTimeOf, toUtcMs, waLink, type Shift,
} from "@/lib/booking";

type Status = Database["public"]["Enums"]["appointment_status"];
type Appt = Database["public"]["Tables"]["appointments"]["Row"] & { appointment_services: { name: string; price: number }[] };

const ACTIVE: Status[] = ["pendente", "confirmado", "concluido"];

function useSettings() {
  return useQuery({
    queryKey: ["admin", "settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("shop_settings").select("*").eq("id", 1).single();
      if (error) throw error;
      return { ...data, shifts: data.shifts as unknown as Shift[] };
    },
  });
}

async function fetchAppts(fromDate: string, toDateExclusive: string): Promise<Appt[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select("*, appointment_services(name, price)")
    .gte("start_at", new Date(toUtcMs(fromDate, "00:00")).toISOString())
    .lt("start_at", new Date(toUtcMs(toDateExclusive, "00:00")).toISOString())
    .order("start_at");
  if (error) throw error;
  return data as unknown as Appt[];
}

function Stat({ icon, label, value, sub }: { icon: ReactNode; label: string; value: string; sub?: string | undefined }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground"><span className="text-primary">{icon}</span>{label}</div>
      <p className="mt-2 text-2xl font-extrabold">{value}</p>
      {sub && <p className="text-sm text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function AdminDashboard() {
  const today = localDateOf(Date.now());
  const q = useQuery({ queryKey: ["admin", "appts", today, addDays(today, 1)], queryFn: () => fetchAppts(today, addDays(today, 1)) });
  const list = (q.data ?? []).filter((a) => ACTIVE.includes(a.status));
  const revenue = list.reduce((s, a) => s + Number(a.total_price), 0);
  const next = list.find((a) => Date.parse(a.start_at) > Date.now() && a.status !== "concluido");
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold first-letter:uppercase">{formatDateBr(today)}</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat icon={<CalendarDays className="h-4 w-4" />} label="Agendamentos hoje" value={String(list.length)} />
        <Stat icon={<DollarSign className="h-4 w-4" />} label="Faturamento previsto" value={brl(revenue)} />
        <Stat icon={<Clock className="h-4 w-4" />} label="Próximo cliente" value={next ? localTimeOf(Date.parse(next.start_at)) : "—"} sub={next?.customer_name ?? "Nenhum por hoje"} />
      </div>
      <AppointmentList appts={q.data ?? []} loading={q.isLoading} />
    </div>
  );
}

export function AdminAgenda() {
  const [mode, setMode] = useState<"dia" | "semana">("dia");
  const [date, setDate] = useState(localDateOf(Date.now()));
  const end = addDays(date, mode === "dia" ? 1 : 7);
  const q = useQuery({ queryKey: ["admin", "appts", date, end], queryFn: () => fetchAppts(date, end) });
  const byDay = useMemo(() => {
    const m = new Map<string, Appt[]>();
    (q.data ?? []).forEach((a) => { const d = localDateOf(Date.parse(a.start_at)); m.set(d, [...(m.get(d) ?? []), a]); });
    return [...m.entries()];
  }, [q.data]);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-border p-1">
          {(["dia", "semana"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={cn("rounded-md px-4 py-1.5 text-sm font-medium capitalize", mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>{m}</button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={() => setDate(addDays(date, mode === "dia" ? -1 : -7))}>‹</Button>
        <Input type="date" className="w-auto" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
        <Button variant="outline" size="sm" onClick={() => setDate(addDays(date, mode === "dia" ? 1 : 7))}>›</Button>
        <Button variant="ghost" size="sm" onClick={() => setDate(localDateOf(Date.now()))}>Hoje</Button>
      </div>
      {q.isLoading ? <p className="text-muted-foreground">Carregando…</p> : byDay.length === 0 ? (
        <p className="rounded-xl border border-border bg-card p-6 text-center text-muted-foreground">Nenhum agendamento neste período.</p>
      ) : byDay.map(([d, list]) => (
        <div key={d}>
          {mode === "semana" && <h3 className="mb-2 mt-4 font-semibold first-letter:uppercase">{formatDateBr(d)}</h3>}
          <AppointmentList appts={list} />
        </div>
      ))}
    </div>
  );
}

function AppointmentList({ appts, loading }: { appts: Appt[]; loading?: boolean }) {
  const qc = useQueryClient();
  const settings = useSettings().data;
  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Database["public"]["Tables"]["appointments"]["Update"] }) => {
      const { error } = await supabase.from("appointments").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin"] }); },
    onError: (e: Error) => toast.error(e.message.includes("appointment_slots_active_unique") ? "Esse horário já foi ocupado por outro agendamento." : "Não foi possível atualizar."),
  });
  if (loading) return <p className="text-muted-foreground">Carregando…</p>;
  if (!appts.length) return <p className="rounded-xl border border-border bg-card p-6 text-center text-muted-foreground">Nenhum agendamento.</p>;

  const remind = (a: Appt) => {
    const services = a.appointment_services.map((s) => s.name).join(" + ");
    const msg = `Olá ${a.customer_name}, aqui é o ${settings?.barber_name ?? "Pablo"} da ${settings?.name ?? "Barbearia Machado"}. Confirmando seu horário de ${services} hoje às ${localTimeOf(Date.parse(a.start_at))}!`;
    window.open(waLink(a.phone, msg), "_blank", "noopener");
    update.mutate({ id: a.id, patch: { reminder_sent: true } });
  };

  return (
    <div className="space-y-2">
      {appts.map((a) => {
        const inactive = a.status === "cancelado" || a.status === "nao_compareceu";
        return (
          <div key={a.id} className={cn("rounded-xl border border-border bg-card p-4", inactive && "opacity-60")}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex gap-4">
                <div className="text-center"><p className="text-xl font-extrabold text-primary">{localTimeOf(Date.parse(a.start_at))}</p><p className="text-xs text-muted-foreground">{a.duration_min} min</p></div>
                <div>
                  <p className="font-semibold">{a.customer_name}</p>
                  <p className="text-sm text-muted-foreground">{formatPhone(a.phone)}</p>
                  <p className="text-sm">{a.appointment_services.map((s) => s.name).join(" + ")} · <span className="font-semibold">{brl(Number(a.total_price))}</span></p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={a.status} />
                <Badge variant="outline" className={a.reminder_sent ? "border-success text-success" : ""}><Bell className="mr-1 h-3 w-3" />{a.reminder_sent ? "Lembrete enviado" : "Sem lembrete"}</Badge>
                {a.origin === "whatsapp" && <Badge variant="secondary">WhatsApp</Badge>}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {a.status === "pendente" && <Button size="sm" onClick={() => update.mutate({ id: a.id, patch: { status: "confirmado" } })}><Check className="h-4 w-4" /> Confirmar</Button>}
              {(a.status === "pendente" || a.status === "confirmado") && <>
                <Button size="sm" variant="secondary" onClick={() => update.mutate({ id: a.id, patch: { status: "concluido" } })}><CheckCheck className="h-4 w-4" /> Concluir</Button>
                <Button size="sm" variant="outline" onClick={() => remind(a)}><MessageCircle className="h-4 w-4 text-whatsapp" /> Lembrar no WhatsApp</Button>
                <Button size="sm" variant="ghost" onClick={() => update.mutate({ id: a.id, patch: { status: "nao_compareceu" } })}>Não compareceu</Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => confirm("Cancelar este agendamento? O horário será liberado.") && update.mutate({ id: a.id, patch: { status: "cancelado" } })}><X className="h-4 w-4" /> Cancelar</Button>
              </>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const cls: Record<Status, string> = {
    pendente: "border-primary text-primary",
    confirmado: "border-success bg-success/15 text-success",
    concluido: "bg-success text-success-foreground",
    cancelado: "border-destructive text-destructive",
    nao_compareceu: "border-muted-foreground text-muted-foreground",
  };
  return <Badge variant="outline" className={cls[status]}>{STATUS_LABEL[status]}</Badge>;
}

export function AdminBlocks() {
  const qc = useQueryClient();
  const [date, setDate] = useState(localDateOf(Date.now()));
  const [allDay, setAllDay] = useState(false);
  const [from, setFrom] = useState("15:00");
  const [to, setTo] = useState("15:45");
  const [reason, setReason] = useState("");
  const q = useQuery({
    queryKey: ["admin", "blocks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("blocks").select("*").gte("ends_at", new Date().toISOString()).order("starts_at");
      if (error) throw error;
      return data;
    },
  });
  const add = useMutation({
    mutationFn: async () => {
      const starts = allDay ? toUtcMs(date, "00:00") : toUtcMs(date, from);
      const ends = allDay ? toUtcMs(addDays(date, 1), "00:00") : toUtcMs(date, to);
      if (ends <= starts) throw new Error("O horário final precisa ser depois do inicial.");
      const { error } = await supabase.from("blocks").insert({ starts_at: new Date(starts).toISOString(), ends_at: new Date(ends).toISOString(), reason: reason.trim().slice(0, 120) });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Bloqueio criado."); setReason(""); qc.invalidateQueries({ queryKey: ["admin", "blocks"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("blocks").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "blocks"] }),
  });
  return (
    <div className="space-y-6">
      <div className="grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2">
        <div className="space-y-2"><Label>Dia</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <div className="flex items-center gap-3 pt-6"><Switch checked={allDay} onCheckedChange={setAllDay} id="allday" /><Label htmlFor="allday">Dia inteiro</Label></div>
        {!allDay && <>
          <div className="space-y-2"><Label>De</Label><Input type="time" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div className="space-y-2"><Label>Até</Label><Input type="time" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        </>}
        <div className="space-y-2 sm:col-span-2"><Label>Motivo (opcional)</Label><Input value={reason} maxLength={120} placeholder="Folga, compromisso…" onChange={(e) => setReason(e.target.value)} /></div>
        <Button className="sm:col-span-2" onClick={() => add.mutate()} disabled={add.isPending}><Ban className="h-4 w-4" /> Bloquear</Button>
      </div>
      <div className="space-y-2">
        {(q.data ?? []).length === 0 && <p className="text-muted-foreground">Nenhum bloqueio futuro.</p>}
        {(q.data ?? []).map((b) => {
          const s = Date.parse(b.starts_at), e = Date.parse(b.ends_at);
          const full = localTimeOf(s) === "00:00" && localTimeOf(e) === "00:00";
          return (
            <div key={b.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
              <div>
                <p className="font-semibold first-letter:uppercase">{formatDateBr(localDateOf(s))}</p>
                <p className="text-sm text-muted-foreground">{full ? "Dia inteiro" : `${localTimeOf(s)} às ${localTimeOf(e)}`}{b.reason && ` · ${b.reason}`}</p>
              </div>
              <Button size="icon" variant="ghost" aria-label="Remover bloqueio" onClick={() => del.mutate(b.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AdminCustomers() {
  const [tab, setTab] = useState<"leads" | "clientes">("clientes");
  const [open, setOpen] = useState<string | null>(null);
  const q = useQuery({
    queryKey: ["admin", "customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const hist = useQuery({
    queryKey: ["admin", "history", open],
    enabled: !!open,
    queryFn: async () => {
      const { data, error } = await supabase.from("appointments").select("*, appointment_services(name, price)").eq("customer_id", open!).order("start_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Appt[];
    },
  });
  const list = (q.data ?? []).filter((c) => (tab === "clientes" ? c.is_client : !c.is_client));
  return (
    <div className="space-y-4">
      <div className="flex rounded-lg border border-border p-1 w-fit">
        {(["clientes", "leads"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn("rounded-md px-4 py-1.5 text-sm font-medium capitalize", tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
            {t} ({(q.data ?? []).filter((c) => (t === "clientes" ? c.is_client : !c.is_client)).length})
          </button>
        ))}
      </div>
      {list.length === 0 && <p className="text-muted-foreground">Nenhum registro.</p>}
      {list.map((c) => (
        <div key={c.id} className="rounded-xl border border-border bg-card">
          <button className="flex w-full items-center justify-between p-4 text-left" onClick={() => setOpen(open === c.id ? null : c.id)}>
            <div>
              <p className="font-semibold">{c.name}</p>
              <p className="text-sm text-muted-foreground">{formatPhone(c.phone)}</p>
            </div>
            <div className="text-right text-sm">
              <p><UserCheck className="mr-1 inline h-4 w-4 text-primary" />{c.visits} visita(s)</p>
              <p className="text-muted-foreground">{c.last_visit ? `Última: ${new Date(c.last_visit).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}` : "Sem visitas"}</p>
            </div>
          </button>
          {open === c.id && (
            <div className="border-t border-border p-4 text-sm">
              <div className="mb-3 flex justify-end">
                <Button asChild size="sm" variant="outline"><a href={waLink(c.phone, `Olá ${c.name}!`)} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4 text-whatsapp" /> WhatsApp</a></Button>
              </div>
              {hist.isLoading ? "Carregando…" : (hist.data ?? []).map((a) => (
                <div key={a.id} className="flex justify-between border-b border-border py-2 last:border-0">
                  <span>{new Date(a.start_at).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })} {localTimeOf(Date.parse(a.start_at))} · {a.appointment_services.map((s) => s.name).join(" + ")}</span>
                  <span className="flex items-center gap-2">{brl(Number(a.total_price))} <StatusBadge status={a.status} /></span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

type ServiceRow = Database["public"]["Tables"]["services"]["Row"];

export function AdminServices() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin", "services"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });
  const save = useMutation({
    mutationFn: async (s: Partial<ServiceRow> & { id?: string }) => {
      if (!s.name?.trim() || !s.category?.trim()) throw new Error("Preencha nome e categoria.");
      if (!(Number(s.duration_min) > 0) || Number(s.price) < 0) throw new Error("Duração e preço inválidos.");
      const row = { name: s.name.trim(), category: s.category.trim(), duration_min: Number(s.duration_min), price: Number(s.price), active: s.active ?? true };
      const { error } = s.id
        ? await supabase.from("services").update(row).eq("id", s.id)
        : await supabase.from("services").insert({ ...row, sort_order: (q.data?.length ?? 0) + 1 });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Serviço salvo."); qc.invalidateQueries({ queryKey: ["admin", "services"] }); qc.invalidateQueries({ queryKey: ["shop-info"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="space-y-3">
      {(q.data ?? []).map((s) => <ServiceEditor key={s.id} initial={s} onSave={(v) => save.mutate(v)} />)}
      <h3 className="pt-4 font-semibold">Novo serviço</h3>
      <ServiceEditor key={`new-${q.data?.length}`} initial={{ name: "", category: "", duration_min: 45, price: 0, active: true }} onSave={(v) => save.mutate(v)} isNew />
    </div>
  );
}

function ServiceEditor({ initial, onSave, isNew }: { initial: Partial<ServiceRow>; onSave: (v: Partial<ServiceRow>) => void; isNew?: boolean }) {
  const [v, setV] = useState(initial);
  return (
    <div className={cn("grid items-end gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-[2fr_1.5fr_1fr_1fr_auto_auto]", !v.active && "opacity-60")}>
      <div className="space-y-1"><Label className="text-xs">Nome</Label><Input value={v.name ?? ""} maxLength={80} onChange={(e) => setV({ ...v, name: e.target.value })} /></div>
      <div className="space-y-1"><Label className="text-xs">Categoria</Label><Input value={v.category ?? ""} maxLength={40} onChange={(e) => setV({ ...v, category: e.target.value })} /></div>
      <div className="space-y-1"><Label className="text-xs">Duração (min)</Label><Input type="number" min={5} value={v.duration_min ?? 45} onChange={(e) => setV({ ...v, duration_min: Number(e.target.value) })} /></div>
      <div className="space-y-1"><Label className="text-xs">Preço (R$)</Label><Input type="number" min={0} step="0.01" value={v.price ?? 0} onChange={(e) => setV({ ...v, price: Number(e.target.value) })} /></div>
      <div className="flex items-center gap-2 pb-2"><Switch checked={!!v.active} onCheckedChange={(c) => setV({ ...v, active: c })} /><span className="text-xs">{v.active ? "Ativo" : "Inativo"}</span></div>
      <Button onClick={() => onSave(v)}>{isNew ? <><Plus className="h-4 w-4" /> Adicionar</> : "Salvar"}</Button>
    </div>
  );
}

export function AdminSettings() {
  const qc = useQueryClient();
  const q = useSettings();
  if (!q.data) return <p className="text-muted-foreground">Carregando…</p>;
  return <SettingsForm initial={q.data} onSaved={() => { qc.invalidateQueries({ queryKey: ["admin", "settings"] }); qc.invalidateQueries({ queryKey: ["shop-info"] }); }} />;
}

function SettingsForm({ initial, onSaved }: { initial: NonNullable<ReturnType<typeof useSettings>["data"]>; onSaved: () => void }) {
  const [v, setV] = useState(initial);
  const [saving, setSaving] = useState(false);
  async function save() {
    const digits = v.whatsapp.replace(/\D/g, "");
    if (!/^55\d{10,11}$/.test(digits)) { toast.error("WhatsApp deve ter o formato 55 + DDD + número."); return; }
    if (!v.name.trim()) { toast.error("Informe o nome da barbearia."); return; }
    for (const s of v.shifts) if (!s.start || !s.end || s.end <= s.start) { toast.error("Confira os turnos: o fim deve ser depois do início."); return; }
    setSaving(true);
    const { error } = await supabase.from("shop_settings").update({
      name: v.name.trim(), barber_name: v.barber_name.trim(), whatsapp: digits, address: v.address.trim(),
      closed_weekdays: v.closed_weekdays, shifts: v.shifts, slot_minutes: v.slot_minutes, updated_at: new Date().toISOString(),
    }).eq("id", 1);
    setSaving(false);
    if (error) { toast.error("Não foi possível salvar."); return; }
    toast.success("Configuração salva.");
    onSaved();
  }
  return (
    <div className="space-y-5 rounded-xl border border-border bg-card p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label>Nome da barbearia</Label><Input value={v.name} maxLength={80} onChange={(e) => setV({ ...v, name: e.target.value })} /></div>
        <div className="space-y-2"><Label>Barbeiro</Label><Input value={v.barber_name} maxLength={60} onChange={(e) => setV({ ...v, barber_name: e.target.value })} /></div>
        <div className="space-y-2"><Label>WhatsApp (55 + DDD + número)</Label><Input value={v.whatsapp} maxLength={20} onChange={(e) => setV({ ...v, whatsapp: e.target.value })} /></div>
        <div className="space-y-2"><Label>Intervalo entre atendimentos (min)</Label><Input type="number" min={5} max={240} value={v.slot_minutes} onChange={(e) => setV({ ...v, slot_minutes: Number(e.target.value) })} /></div>
        <div className="space-y-2 sm:col-span-2"><Label>Endereço</Label><Input value={v.address} maxLength={200} onChange={(e) => setV({ ...v, address: e.target.value })} /></div>
      </div>
      <div>
        <Label>Dias fechados</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {WEEKDAYS.map((d, i) => {
            const on = v.closed_weekdays.includes(i);
            return <button key={d} type="button" onClick={() => setV({ ...v, closed_weekdays: on ? v.closed_weekdays.filter((x) => x !== i) : [...v.closed_weekdays, i] })}
              className={cn("rounded-lg border px-3 py-2 text-sm", on ? "border-destructive bg-destructive/15 text-destructive" : "border-border")}>{d}</button>;
          })}
        </div>
      </div>
      <div>
        <Label>Turnos de atendimento</Label>
        <div className="mt-2 space-y-2">
          {v.shifts.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input type="time" className="w-auto" value={s.start} onChange={(e) => setV({ ...v, shifts: v.shifts.map((x, j) => (j === i ? { ...x, start: e.target.value } : x)) })} />
              <span>às</span>
              <Input type="time" className="w-auto" value={s.end} onChange={(e) => setV({ ...v, shifts: v.shifts.map((x, j) => (j === i ? { ...x, end: e.target.value } : x)) })} />
              <Button size="icon" variant="ghost" aria-label="Remover turno" onClick={() => setV({ ...v, shifts: v.shifts.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={() => setV({ ...v, shifts: [...v.shifts, { start: "13:00", end: "14:00" }] })}><Plus className="h-4 w-4" /> Adicionar turno</Button>
        </div>
      </div>
      <Button onClick={save} disabled={saving} className="w-full sm:w-auto">{saving ? "Salvando…" : "Salvar configuração"}</Button>
    </div>
  );
}
