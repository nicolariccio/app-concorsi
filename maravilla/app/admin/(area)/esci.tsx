"use client";

import { useRouter } from "next/navigation";

export function EsciBottone() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="bottone-piccolo"
      onClick={async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        router.replace("/admin/login");
        router.refresh();
      }}
    >
      Esci
    </button>
  );
}
