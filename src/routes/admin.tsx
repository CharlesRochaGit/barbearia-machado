import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Logo } from "@/components/Logo";
import { AdminDashboard, AdminAgenda, AdminBlocks, AdminCustomers, AdminServices, AdminSettings } from "@/components/admin/sections";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Painel do barbeiro — Barbearia Machado" },
      { name: "description", content: "Agenda, clientes e serviços da Barbearia Machado." },
      { property: "og:title", content: "Painel do barbeiro — Barbearia Machado" },
      { property: "og:description", content: "Área restrita da Barbearia Machado." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setIsAdmin(null); return; }
    supabase.rpc("has_role", { _user_id: session.user.id, _role: "admin" }).then(({ data }) => setIsAdmin(!!data));
  }, [session]);

  if (!ready) return <div className="min-h-screen bg-background" />;
  if (!session) return <Login />;
  if (isAdmin === null) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Carregando…</div>;
  if (!isAdmin) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <p>Esta conta não tem acesso ao painel.</p>
      <Button variant="outline" onClick={() => supabase.auth.signOut()}>Sair</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/"><Logo className="w-20" /></Link>
          <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()}><LogOut className="h-4 w-4" /> Sair</Button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Tabs defaultValue="painel">
          <TabsList className="mb-6 flex h-auto w-full flex-wrap justify-start gap-1">
            <TabsTrigger value="painel">Painel</TabsTrigger>
            <TabsTrigger value="agenda">Agenda</TabsTrigger>
            <TabsTrigger value="bloqueios">Bloqueios</TabsTrigger>
            <TabsTrigger value="clientes">Leads e clientes</TabsTrigger>
            <TabsTrigger value="servicos">Serviços</TabsTrigger>
            <TabsTrigger value="config">Configuração</TabsTrigger>
          </TabsList>
          <TabsContent value="painel"><AdminDashboard /></TabsContent>
          <TabsContent value="agenda"><AdminAgenda /></TabsContent>
          <TabsContent value="bloqueios"><AdminBlocks /></TabsContent>
          <TabsContent value="clientes"><AdminCustomers /></TabsContent>
          <TabsContent value="servicos"><AdminServices /></TabsContent>
          <TabsContent value="config"><AdminSettings /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) toast.error("E-mail ou senha incorretos.");
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-hero px-5">
      <form onSubmit={submit} className="w-full max-w-sm space-y-5 rounded-2xl border border-border bg-card p-6">
        <div className="flex justify-center"><Logo className="w-36" /></div>
        <h1 className="text-center text-xl font-bold">Área do barbeiro</h1>
        <div className="space-y-2"><Label htmlFor="email">E-mail</Label><Input id="email" type="email" required className="h-12" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="pw">Senha</Label><Input id="pw" type="password" required className="h-12" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <Button type="submit" className="h-12 w-full font-bold" disabled={loading}>{loading ? "Entrando…" : "Entrar"}</Button>
      </form>
    </div>
  );
}
