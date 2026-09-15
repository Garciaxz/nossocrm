import { criarClienteServidor } from "@/lib/supabase/servidor";

export default async function Painel() {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.from("vw_funil_atual").select("*");
  return <main className="p-8">{data?.length ?? 0} etapas</main>;
}
