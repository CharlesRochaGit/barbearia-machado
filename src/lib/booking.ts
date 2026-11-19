// Pure booking helpers shared by the client page, server functions and tests.
export const SHOP_TZ_OFFSET = "-03:00"; // America/Sao_Paulo (sem horário de verão)
const OFFSET_MS = 3 * 60 * 60 * 1000;

export type Shift = { start: string; end: string };
export type BlockRange = { start: number; end: number };
export type DaySlot = { time: string; startIso: string; available: boolean };

export function toUtcMs(date: string, hm: string): number {
  return Date.parse(`${date}T${hm}:00${SHOP_TZ_OFFSET}`);
}

export function hmToMinutes(hm: string): number {
  const [h = 0, m = 0] = hm.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToHm(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

export function weekdayOf(date: string): number {
  const [y = 1970, m = 1, d = 1] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Data local (America/Sao_Paulo) no formato YYYY-MM-DD. */
export function localDateOf(ms: number): string {
  return new Date(ms - OFFSET_MS).toISOString().slice(0, 10);
}

export function localTimeOf(ms: number): string {
  return new Date(ms - OFFSET_MS).toISOString().slice(11, 16);
}

export function addDays(date: string, n: number): string {
  const [y = 1970, m = 1, d = 1] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

export function nextDays(nowMs: number, count = 14): string[] {
  const today = localDateOf(nowMs);
  return Array.from({ length: count }, (_, i) => addDays(today, i));
}

export function roundDuration(totalMin: number, slotMinutes: number): number {
  if (totalMin <= 0) return 0;
  return Math.ceil(totalMin / slotMinutes) * slotMinutes;
}

export function generateDaySlots(opts: {
  date: string;
  shifts: Shift[];
  slotMinutes: number;
  closedWeekdays: number[];
  durationMin: number;
  busy: number[]; // UTC ms of occupied slot starts
  blocks: BlockRange[];
  now: number;
}): DaySlot[] {
  const { date, shifts, slotMinutes, closedWeekdays, now } = opts;
  if (closedWeekdays.includes(weekdayOf(date))) return [];
  const dur = roundDuration(Math.max(opts.durationMin, slotMinutes), slotMinutes);
  const busy = new Set(opts.busy);
  const out: DaySlot[] = [];
  for (const sh of shifts) {
    const s = hmToMinutes(sh.start);
    const e = hmToMinutes(sh.end);
    for (let t = s; t + slotMinutes <= e; t += slotMinutes) {
      const hm = minutesToHm(t);
      const start = toUtcMs(date, hm);
      const end = start + dur * 60000;
      let available = t + dur <= e && start > now;
      for (let k = 0; available && k < dur / slotMinutes; k++) {
        if (busy.has(start + k * slotMinutes * 60000)) available = false;
      }
      if (available && opts.blocks.some((b) => b.start < end && b.end > start)) available = false;
      out.push({ time: hm, startIso: new Date(start).toISOString(), available });
    }
  }
  return out;
}

export function phoneDigits(input: string): string {
  return input.replace(/\D/g, "");
}

/** Normaliza para 55 + DDD + 9 dígitos; retorna null se inválido. */
export function normalizeBrPhone(input: string): string | null {
  let d = phoneDigits(input);
  if (d.length === 11) d = "55" + d;
  return /^55[1-9][0-9]9[0-9]{8}$/.test(d) ? d : null;
}

export function maskBrPhone(input: string): string {
  const d = phoneDigits(input).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function formatPhone(full: string): string {
  const d = full.startsWith("55") ? full.slice(2) : full;
  return maskBrPhone(d);
}

export function brl(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDateBr(date: string, opts: Intl.DateTimeFormatOptions = { weekday: "long", day: "2-digit", month: "long" }): string {
  return new Date(`${date}T12:00:00${SHOP_TZ_OFFSET}`).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", ...opts });
}

export function waLink(phone: string, text: string): string {
  return `https://wa.me/${phoneDigits(phone)}?text=${encodeURIComponent(text)}`;
}

export const WEEKDAYS: readonly string[] = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  concluido: "Concluído",
  cancelado: "Cancelado",
  nao_compareceu: "Não compareceu",
};
