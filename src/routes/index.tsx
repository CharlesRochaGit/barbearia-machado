import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Calendar, Check, ChevronLeft, Clock, MapPin, MessageCircle, Scissors, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";
import { createAppointment, getAvailability, getShopInfo } from "@/lib/booking.functions";
import {
  WEEKDAYS, brl, formatDateBr, localDateOf, maskBrPhone, nextDays, normalizeBrPhone, roundDuration, waLink, weekdayOf, type Shift,
} from "@/lib/booking";

const shopQuery = queryOptions({ queryKey: ["shop-info"], queryFn: () => getShopInfo() });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Barbearia Machado — Agende seu horário com o Pablo" },
      { name: "description", content: "Seu estilo sem fila de espera. Escolha o serviço, o dia e o horário e agende online na Barbearia Machado." },
      { property: "og:title", content: "Barbearia Machado — Agendamento online" },
      { property: "og:description", content: "Seu estilo sem fila de espera. Agende em poucos cliques." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(shopQuery),
  component: Index,
});

type Step = "services" | "datetime" | "details" | "done";

function hoursText(closed: number[], shifts: Shift[]) {
  const open = [2, 3, 4, 5, 6, 0, 1].filter((d) => !closed.includes(d)).map((d) => WEEKDAYS[d]);
  const range = open.length > 1 ? `${open[0]} a ${open[open.length - 1]}` : open[0] ?? "";
  return { days: range, shifts: shifts.map((s) => `${s.start} às ${s.end}`).join(" e "), closed: closed.map((d) => WEEKDAYS[d]).join(", ") };
}

function Index() {
  const { data } = useSuspenseQuery(shopQuery);
  const { settings, services } = data;
  const [step, setStep] = useState<Step | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [date, setDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<{ time: string; startIso: string } | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const flowRef = useRef<HTMLDivElement>(null);

  const fetchSlots = useServerFn(getAvailability);
  const submit = useServerFn(createAppointment);

  const chosen = services.filter((s) => selected.includes(s.id));
  const totalPrice = chosen.reduce((a, s) => a + s.price, 0);
  const totalDur = roundDuration(chosen.reduce((a, s) => a + s.duration_min, 0), settings.slot_minutes);
  const days = useMemo(() => nextDays(Date.now(), 14), []);
  const grouped = useMemo(() => {
    const m = new Map<string, typeof services>();
    services.forEach((s) => m.set(s.category, [...(m.get(s.category) ?? []), s]));
    return [...m.entries()];
  }, [services]);
  const hours = hoursText(settings.closed_weekdays, settings.shifts);

  const slotsQ = useQuery({
    queryKey: ["slots", date, totalDur],
    queryFn: () => fetchSlots({ data: { date: date!, durationMin: totalDur } }),
    enabled: !!date && totalDur > 0 && step === "datetime",
  });

  const start = () => {
    setStep("services");
    setTimeout(() => flowRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const shopWa = (text: string) => waLink(settings.whatsapp, text);

  async function confirm() {
    if (name.trim().length < 3 || !name.trim().includes(" ")) { toast.error("Informe seu nome completo."); return; }
    if (!normalizeBrPhone(phone)) { toast.error("Informe um WhatsApp válido com DDD, ex: (48) 98436-5051."); return; }
    if (!slot) return;
    setSubmitting(true);
    try {
      const r = await submit({ data: { name: name.trim(), phone, startIso: slot.startIso, serviceIds: selected } });
      if (!r.ok) {
        toast.error(r.error);
        if (/horário|reservar|bloqueado|passou/i.test(r.error)) { setSlot(null); setStep("datetime"); slotsQ.refetch(); }
        return;
      }
      setStep("done");
      setTimeout(() => flowRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch {
      toast.error("Não foi possível concluir. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  const summaryText = date && slot
    ? `Olá! Sou ${name.trim()} e agendei pelo site: ${chosen.map((s) => s.name).join(" + ")} em ${formatDateBr(date, { weekday: "long", day: "2-digit", month: "2-digit" })} às ${slot.time}. Total: ${brl(totalPrice)}.`
    : "";

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Landing */}
      <section className="bg-hero px-5 pb-12 pt-10">
        <div className="mx-auto flex max-w-xl flex-col items-center text-center">
          <Logo className="w-48 sm:w-56" />
          <h1 className="mt-8 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Seu estilo <span className="text-primary">sem fila de espera</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Escolha o serviço, o dia e o horário. Seu agendamento fica pronto em poucos cliques.
          </p>
          <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm">
            <User className="h-4 w-4 text-primary" /> Atendimento com o {settings.barber_name}
          </p>
          <div className="mt-8 grid w-full gap-3 sm:grid-cols-2">
            <Button size="lg" className="h-14 bg-gradient-primary text-base font-bold shadow-glow" onClick={start}>
              <Calendar className="h-5 w-5" /> Agendar horário
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 text-base">
              <a href={shopWa(`Olá, ${settings.barber_name}! Vim pelo site da ${settings.name}.`)} target="_blank" rel="noreferrer">
                <MessageCircle className="h-5 w-5 text-whatsapp" /> WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-xl gap-3 px-5 sm:grid-cols-2">
        <InfoCard icon={<MapPin className="h-5 w-5" />} title="Endereço" text={settings.address} />
        <InfoCard icon={<Clock className="h-5 w-5" />} title="Horários" text={`${hours.days}, ${hours.shifts}`} sub={hours.closed ? `Fechado: ${hours.closed}` : undefined} />
      </section>

      <section className="mx-auto max-w-xl px-5 py-10">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold"><Scissors className="h-5 w-5 text-primary" /> Tabela de preços</h2>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {services.map((s, i) => (
            <div key={s.id} className={cn("flex items-center justify-between px-4 py-3", i > 0 && "border-t border-border")}>
              <div><p className="font-medium">{s.name}</p><p className="text-xs text-muted-foreground">{s.category} · {s.duration_min} min</p></div>
              <p className="font-bold text-primary">{brl(s.price)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Booking flow */}
      <div ref={flowRef} className="mx-auto max-w-xl px-5 pb-32">
        {step && step !== "done" && <Stepper step={step} />}

        {step === "services" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Escolha os serviços</h2>
            {grouped.map(([cat, list]) => (
              <div key={cat}>
                <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{cat}</p>
                <div className="grid gap-2">
                  {list.map((s) => {
                    const on = selected.includes(s.id);
                    return (
                      <button key={s.id} type="button" onClick={() => setSelected((p) => (on ? p.filter((x) => x !== s.id) : [...p, s.id]))}
                        className={cn("flex min-h-16 items-center justify-between rounded-xl border bg-card px-4 py-3 text-left transition", on ? "border-primary ring-2 ring-primary/40" : "border-border hover:border-primary/50")}
                        aria-pressed={on}>
                        <div className="flex items-center gap-3">
                          <span className={cn("flex h-6 w-6 items-center justify-center rounded-md border", on ? "border-primary bg-primary text-primary-foreground" : "border-input")}>{on && <Check className="h-4 w-4" />}</span>
                          <div><p className="font-semibold">{s.name}</p><p className="text-xs text-muted-foreground">{s.duration_min} min</p></div>
                        </div>
                        <span className="font-bold">{brl(s.price)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {step === "datetime" && (
          <div className="space-y-6">
            <BackBtn onClick={() => setStep("services")} />
            <h2 className="text-2xl font-bold">Escolha o dia e o horário</h2>
            <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2">
              {days.map((d) => {
                const closed = settings.closed_weekdays.includes(weekdayOf(d));
                const isToday = d === localDateOf(Date.now());
                return (
                  <button key={d} type="button" disabled={closed} onClick={() => { setDate(d); setSlot(null); }}
                    className={cn("flex min-w-16 flex-col items-center rounded-xl border px-3 py-3 transition",
                      closed ? "cursor-not-allowed border-border bg-muted/40 text-muted-foreground opacity-50" : date === d ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/50")}>
                    <span className="text-xs font-medium uppercase">{isToday ? "Hoje" : (WEEKDAYS[weekdayOf(d)] ?? "").slice(0, 3)}</span>
                    <span className="text-xl font-bold">{d.slice(8)}</span>
                    <span className="text-[10px]">{closed ? "fechado" : d.slice(5, 7) + "/" + d.slice(2, 4)}</span>
                  </button>
                );
              })}
            </div>
            {!date && <p className="text-muted-foreground">Selecione um dia para ver os horários.</p>}
            {date && slotsQ.isLoading && <p className="text-muted-foreground">Carregando horários…</p>}
            {date && slotsQ.data && (
              slotsQ.data.some((s) => s.available) ? (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {slotsQ.data.map((s) => (
                    <button key={s.startIso} type="button" disabled={!s.available} onClick={() => setSlot(s)}
                      className={cn("h-12 rounded-lg border font-semibold transition",
                        !s.available ? "cursor-not-allowed border-border bg-muted/30 text-muted-foreground line-through opacity-50"
                          : slot?.startIso === s.startIso ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/60")}>
                      {s.time}
                    </button>
                  ))}
                </div>
              ) : <p className="rounded-xl border border-border bg-card p-4 text-muted-foreground">Sem horários livres neste dia. Tente outra data.</p>
            )}
          </div>
        )}

        {step === "details" && date && slot && (
          <div className="space-y-6">
            <BackBtn onClick={() => setStep("datetime")} />
            <h2 className="text-2xl font-bold">Seus dados</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input id="name" className="h-12 text-base" value={name} maxLength={100} autoComplete="name" onChange={(e) => setName(e.target.value)} placeholder="Ex: João da Silva" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">WhatsApp</Label>
                <Input id="phone" className="h-12 text-base" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(maskBrPhone(e.target.value))} placeholder="(48) 98436-5051" />
              </div>
            </div>
            <Summary chosen={chosen} date={date} time={slot.time} total={totalPrice} />
          </div>
        )}

        {step === "done" && date && slot && (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/15 text-success"><Check className="h-10 w-10" /></div>
            <div>
              <h2 className="text-3xl font-extrabold">Horário agendado!</h2>
              <p className="mt-2 text-muted-foreground">Te esperamos, {name.trim().split(" ")[0]}. Envie a confirmação para o {settings.barber_name}:</p>
            </div>
            <div className="text-left"><Summary chosen={chosen} date={date} time={slot.time} total={totalPrice} /></div>
            <Button asChild size="lg" className="h-14 w-full bg-whatsapp text-base font-bold text-whatsapp-foreground hover:bg-whatsapp/90">
              <a href={shopWa(summaryText)} target="_blank" rel="noreferrer"><MessageCircle className="h-5 w-5" /> Enviar no WhatsApp da barbearia</a>
            </Button>
            <Button variant="ghost" onClick={() => { setStep(null); setSelected([]); setDate(null); setSlot(null); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
              Fazer outro agendamento
            </Button>
          </div>
        )}
      </div>

      {/* Sticky action bar */}
      {step && step !== "done" && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 px-5 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-xl items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground">{chosen.length} serviço(s) · {totalDur} min</p>
              <p className="text-xl font-extrabold text-primary">{brl(totalPrice)}</p>
            </div>
            {step === "services" && <Button size="lg" className="h-12 px-6 font-bold" disabled={!chosen.length} onClick={() => setStep("datetime")}>Continuar</Button>}
            {step === "datetime" && <Button size="lg" className="h-12 px-6 font-bold" disabled={!slot} onClick={() => setStep("details")}>Continuar</Button>}
            {step === "details" && <Button size="lg" className="h-12 px-6 font-bold" disabled={submitting} onClick={confirm}>{submitting ? "Agendando…" : "Confirmar"}</Button>}
          </div>
        </div>
      )}

      <footer className="border-t border-border px-5 py-6 text-center text-xs text-muted-foreground">
        {settings.name} · <Link to="/admin" className="underline-offset-2 hover:underline">Área do barbeiro</Link>
      </footer>
    </main>
  );
}

function InfoCard({ icon, title, text, sub }: { icon: ReactNode; title: string; text: string; sub?: string | undefined }) {
  return (
    <div className="flex gap-3 rounded-xl border border-border bg-card p-4">
      <div className="text-primary">{icon}</div>
      <div><p className="text-sm font-semibold">{title}</p><p className="text-sm text-muted-foreground">{text}</p>{sub && <p className="text-xs text-muted-foreground">{sub}</p>}</div>
    </div>
  );
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return <button type="button" onClick={onClick} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ChevronLeft className="h-4 w-4" /> Voltar</button>;
}

function Stepper({ step }: { step: Step }) {
  const steps: [Step, string][] = [["services", "Serviços"], ["datetime", "Horário"], ["details", "Dados"]];
  const idx = steps.findIndex(([s]) => s === step);
  return (
    <div className="mb-6 flex items-center gap-2 border-t border-border pt-8">
      {steps.map(([s, label], i) => (
        <div key={s} className="flex flex-1 items-center gap-2">
          <span className={cn("flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold", i <= idx ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{i + 1}</span>
          <span className={cn("text-sm", i === idx ? "font-semibold" : "text-muted-foreground")}>{label}</span>
        </div>
      ))}
    </div>
  );
}

function Summary({ chosen, date, time, total }: { chosen: { id: string; name: string; price: number }[]; date: string; time: string; total: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="mb-3 flex items-center gap-2 font-semibold"><Sparkles className="h-4 w-4 text-primary" /> Resumo</p>
      {chosen.map((s) => <div key={s.id} className="flex justify-between py-1 text-sm"><span>{s.name}</span><span>{brl(s.price)}</span></div>)}
      <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
        <p className="first-letter:uppercase"><Calendar className="mr-2 inline h-4 w-4 text-primary" />{formatDateBr(date)}</p>
        <p><Clock className="mr-2 inline h-4 w-4 text-primary" />{time}</p>
      </div>
      <div className="mt-3 flex justify-between border-t border-border pt-3 text-lg font-extrabold"><span>Total</span><span className="text-primary">{brl(total)}</span></div>
    </div>
  );
}
