import logo from "@/assets/barbearia-machado-logo.png.asset.json";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return <img src={logo.url} alt="Barbearia Machado" className={cn("h-auto w-40 select-none", className)} draggable={false} />;
}
