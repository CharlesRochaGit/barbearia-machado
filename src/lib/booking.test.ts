import { describe, expect, it } from "vitest";
import { generateDaySlots, normalizeBrPhone, maskBrPhone, roundDuration, toUtcMs, weekdayOf } from "./booking";

const base = {
  shifts: [{ start: "09:00", end: "10:00" }, { start: "15:00", end: "21:00" }],
  slotMinutes: 45,
  closedWeekdays: [1],
  busy: [] as number[],
  blocks: [],
  now: Date.parse("2026-11-01T00:00:00-03:00"),
};
// 2026-11-17 é terça; 2026-11-16 é segunda
const TUE = "2026-11-17";

describe("geração de slots", () => {
  it("segunda-feira fica fechada", () => {
    expect(weekdayOf("2026-11-16")).toBe(1);
    expect(generateDaySlots({ ...base, date: "2026-11-16", durationMin: 45 })).toEqual([]);
  });

  it("turnos 09–10 e 15–21 com slots de 45 min", () => {
    const times = generateDaySlots({ ...base, date: TUE, durationMin: 45 }).map((s) => s.time);
    expect(times).toEqual(["09:00", "15:00", "15:45", "16:30", "17:15", "18:00", "18:45", "19:30", "20:15"]);
  });

  it("duração arredondada para múltiplos de 45 e não ultrapassa o turno", () => {
    expect(roundDuration(60, 45)).toBe(90);
    const slots = generateDaySlots({ ...base, date: TUE, durationMin: 90 });
    expect(slots.find((s) => s.time === "09:00")?.available).toBe(false);
    expect(slots.find((s) => s.time === "19:30")?.available).toBe(true);
    expect(slots.find((s) => s.time === "20:15")?.available).toBe(false);
  });

  it("horários passados de hoje ficam bloqueados", () => {
    const now = toUtcMs(TUE, "16:00");
    const slots = generateDaySlots({ ...base, date: TUE, durationMin: 45, now });
    expect(slots.find((s) => s.time === "15:45")?.available).toBe(false);
    expect(slots.find((s) => s.time === "16:30")?.available).toBe(true);
  });

  it("horário ocupado bloqueia também quem precisaria dele", () => {
    const busy = [toUtcMs(TUE, "16:30")];
    const slots = generateDaySlots({ ...base, date: TUE, durationMin: 90, busy });
    expect(slots.find((s) => s.time === "15:45")?.available).toBe(false);
    expect(slots.find((s) => s.time === "16:30")?.available).toBe(false);
    expect(slots.find((s) => s.time === "17:15")?.available).toBe(true);
  });

  it("bloqueios do barbeiro desabilitam o horário", () => {
    const blocks = [{ start: toUtcMs(TUE, "18:00"), end: toUtcMs(TUE, "18:45") }];
    const slots = generateDaySlots({ ...base, date: TUE, durationMin: 45, blocks });
    expect(slots.find((s) => s.time === "18:00")?.available).toBe(false);
    expect(slots.find((s) => s.time === "18:45")?.available).toBe(true);
  });
});

describe("telefone brasileiro", () => {
  it("aceita celular com DDD e normaliza com 55", () => {
    expect(normalizeBrPhone("(48) 98436-5051")).toBe("5548984365051");
    expect(normalizeBrPhone("5548984365051")).toBe("5548984365051");
  });
  it("recusa fixo, DDD inválido e tamanho errado", () => {
    expect(normalizeBrPhone("(48) 3436-5051")).toBeNull();
    expect(normalizeBrPhone("(08) 98436-5051")).toBeNull();
    expect(normalizeBrPhone("98436-5051")).toBeNull();
  });
  it("aplica a máscara", () => {
    expect(maskBrPhone("48984365051")).toBe("(48) 98436-5051");
  });
});
