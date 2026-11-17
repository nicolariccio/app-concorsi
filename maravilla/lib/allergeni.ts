// I 14 allergeni da dichiarare per legge (Reg. UE 1169/2011).
export const ALLERGENI = [
  { id: "glutine", nome: "Glutine" },
  { id: "crostacei", nome: "Crostacei" },
  { id: "uova", nome: "Uova" },
  { id: "pesce", nome: "Pesce" },
  { id: "arachidi", nome: "Arachidi" },
  { id: "soia", nome: "Soia" },
  { id: "latte", nome: "Latte" },
  { id: "frutta_guscio", nome: "Frutta a guscio" },
  { id: "sedano", nome: "Sedano" },
  { id: "senape", nome: "Senape" },
  { id: "sesamo", nome: "Sesamo" },
  { id: "solfiti", nome: "Solfiti" },
  { id: "lupini", nome: "Lupini" },
  { id: "molluschi", nome: "Molluschi" },
] as const;

export const ID_ALLERGENI: string[] = ALLERGENI.map((a) => a.id);

export function nomiAllergeni(ids: string[]): string {
  return ids
    .map((id) => ALLERGENI.find((a) => a.id === id)?.nome)
    .filter(Boolean)
    .join(", ");
}
