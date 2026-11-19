import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { generateDaySlots, normalizeBrPhone, toUtcMs, addDays, type Shift } from "./booking";

function publicClient() {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const getShopInfo = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const [{ data: settings, error: e1 }, { data: services, error: e2 }] = await Promise.all([
    sb.from("shop_settings").select("*").eq("id", 1).single(),
    sb.from("services").select("id, category, name, duration_min, price, sort_order").eq("active", true).order("sort_order"),
  ]);
  if (e1 || e2 || !settings) throw new Error("Não foi possível carregar os dados da barbearia.");
  return {
    settings: { ...settings, shifts: settings.shifts as unknown as Shift[] },
    services: (services ?? []).map((s) => ({ ...s, price: Number(s.price) })),
  };
});

export const getAvailability = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), durationMin: z.number().int().min(1).max(600) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const dayStart = new Date(toUtcMs(data.date, "00:00")).toISOString();
    const dayEnd = new Date(toUtcMs(addDays(data.date, 1), "00:00")).toISOString();
    const [{ data: s }, { data: slots }, { data: blocks }] = await Promise.all([
      supabaseAdmin.from("shop_settings").select("shifts, slot_minutes, closed_weekdays").eq("id", 1).single(),
      supabaseAdmin.from("appointment_slots").select("slot_start").eq("active", true).gte("slot_start", dayStart).lt("slot_start", dayEnd),
      supabaseAdmin.from("blocks").select("starts_at, ends_at").lt("starts_at", dayEnd).gt("ends_at", dayStart),
    ]);
    if (!s) throw new Error("Configuração indisponível.");
    return generateDaySlots({
      date: data.date,
      shifts: s.shifts as unknown as Shift[],
      slotMinutes: s.slot_minutes,
      closedWeekdays: s.closed_weekdays,
      durationMin: data.durationMin,
      busy: (slots ?? []).map((x) => Date.parse(x.slot_start)),
      blocks: (blocks ?? []).map((b) => ({ start: Date.parse(b.starts_at), end: Date.parse(b.ends_at) })),
      now: Date.now(),
    });
  });

export const createAppointment = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        name: z.string().trim().min(3).max(100),
        phone: z.string().max(30),
        startIso: z.string().datetime(),
        serviceIds: z.array(z.string().uuid()).min(1).max(10),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const phone = normalizeBrPhone(data.phone);
    if (!phone) return { ok: false as const, error: "Número de WhatsApp inválido." };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: id, error } = await supabaseAdmin.rpc("create_appointment", {
      p_name: data.name,
      p_phone: phone,
      p_start: data.startIso,
      p_service_ids: data.serviceIds,
      p_origin: "site",
    });
    if (error) {
      if (error.code === "P0001") return { ok: false as const, error: error.message };
      console.error(error);
      return { ok: false as const, error: "Não foi possível concluir o agendamento. Tente novamente." };
    }
    return { ok: true as const, id: id as string };
  });
