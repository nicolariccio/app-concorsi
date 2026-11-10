"""Valuta l'estrazione sul set di prova in tests/bandi.

Ogni cartella tests/bandi/<id_inpa>/ contiene `testo.txt` (testo del bando) e
`atteso.json` (requisiti annotati a mano). Lo script estrae i requisiti con
Claude, li confronta con le annotazioni e stampa gli errori.

Uso:
    python worker/valuta.py               # tutti i bandi del set
    python worker/valuta.py --solo d442   # solo i bandi il cui id inizia così
    python worker/valuta.py --riusa       # rivaluta l'ultima estrazione salvata, senza chiamare l'API

Le estrazioni vengono salvate in dati/valutazione/ per poterle rivedere.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import date
from pathlib import Path

if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from worker.raccolta import CARTELLA_DATI, RADICE
from worker.schema_requisiti import Estrazione, normalizza_classe

CARTELLA_SET = RADICE / "tests" / "bandi"


def _categorie_patente(valori: list[str]) -> set[str]:
    categorie = set()
    for v in valori:
        v = re.sub(r"(?i)\b(patente|categoria|cat\.?|di guida|tipo)\b", " ", v)
        categorie |= set(re.findall(r"\b(AM|A1|A2|A|B|BE|C1|C|CE|D1|D|DE)\b", v.upper()))
    return categorie


def confronta(estrazione: Estrazione, atteso: dict) -> list[str]:
    """Differenze tra estrazione e annotazione manuale (vuoto = tutto giusto)."""
    errori: list[str] = []
    req = estrazione.requisiti
    titoli = [r for r in req if r.tipo == "titolo_studio"]

    attese = {normalizza_classe(c) for c in atteso["titolo_studio"]["classi_laurea"]}
    trovate = {normalizza_classe(c) for r in titoli for c in r.classi_laurea}
    if mancanti := attese - trovate:
        errori.append(f"classi di laurea mancanti: {', '.join(sorted(mancanti))}")
    if in_piu := trovate - attese:
        errori.append(f"classi di laurea in più (inventate?): {', '.join(sorted(in_piu))}")

    valori_titolo = " | ".join(v.lower() for r in titoli for v in r.valori_ammessi + [r.descrizione])
    for diploma in atteso["titolo_studio"]["diplomi"]:
        if diploma.lower() not in valori_titolo:
            errori.append(f"titolo mancante: {diploma}")

    ambiguo_atteso = atteso["titolo_studio"].get("ambiguo")
    if ambiguo_atteso is not None:
        ambiguo = any(r.ambiguo for r in titoli)
        if ambiguo != ambiguo_atteso:
            errori.append(f"titolo di studio ambiguo: atteso {ambiguo_atteso}, trovato {ambiguo}")

    patenti = _categorie_patente([v for r in req if r.tipo == "patente" for v in r.valori_ammessi + [r.descrizione]])
    if patenti != set(atteso["patente"]):
        errori.append(f"patente: attesa {sorted(atteso['patente']) or 'nessuna'}, trovata {sorted(patenti) or 'nessuna'}")

    for tipo in ("abilitazione", "albo"):
        trovato = any(r.tipo == tipo and r.obbligatorio for r in req)
        if trovato != atteso[tipo]:
            errori.append(f"{tipo} obbligatorio: atteso {atteso[tipo]}, trovato {trovato}")

    eta_max = next((r.valore_massimo for r in req if r.tipo == "eta" and r.valore_massimo), None)
    if eta_max != atteso["eta_massima"]:
        errori.append(f"età massima: attesa {atteso['eta_massima']}, trovata {eta_max}")

    esperienza = next((r.valore_minimo for r in req if r.tipo == "esperienza" and r.obbligatorio and r.valore_minimo), None)
    if esperienza != atteso["esperienza_anni_minimi"]:
        errori.append(f"esperienza minima: attesa {atteso['esperienza_anni_minimi']}, trovata {esperienza}")

    d = estrazione.dettagli
    if not _stesso_giorno(d.scadenza, atteso["scadenza_inpa"]):
        errori.append(f"scadenza: attesa {atteso['scadenza_inpa']} (inPA), trovata {d.scadenza}")
    if d.posti != atteso["posti"]:
        errori.append(f"posti: attesi {atteso['posti']}, trovati {d.posti}")
    return errori


def _stesso_giorno(estratta: str | None, inpa: str) -> bool:
    """inPA salva in UTC (le 00:00 italiane diventano le 23:00Z del giorno prima):
    si accetta un giorno di differenza."""
    try:
        a, b = date.fromisoformat((estratta or "")[:10]), date.fromisoformat(inpa[:10])
    except ValueError:
        return False
    return abs((a - b).days) <= 1


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Valuta l'estrazione sul set di prova")
    parser.add_argument("--solo", default="", help="prefisso dell'id dei bandi da valutare")
    parser.add_argument("--riusa", action="store_true", help="non chiamare l'API, usa l'ultima estrazione")
    args = parser.parse_args(argv)

    cartella_risultati = CARTELLA_DATI / "valutazione"
    cartella_risultati.mkdir(parents=True, exist_ok=True)
    client = None
    totale_errori, con_errori, n = 0, 0, 0

    for cartella in sorted(p for p in CARTELLA_SET.iterdir() if p.is_dir() and p.name.startswith(args.solo)):
        atteso = json.loads((cartella / "atteso.json").read_text(encoding="utf-8"))
        testo = (cartella / "testo.txt").read_text(encoding="utf-8")
        salvato = cartella_risultati / f"{cartella.name}.json"
        n += 1

        if args.riusa and salvato.exists():
            dati = json.loads(salvato.read_text(encoding="utf-8"))
        else:
            import anthropic

            from worker.estrazione import estrai_bando

            client = client or anthropic.Anthropic()
            esito = estrai_bando(client, testo, atteso["scadenza_inpa"])
            dati = {
                "modello": esito.modello,
                "problemi_controllo": esito.problemi,
                "uso_token": esito.uso_token,
                "estrazione": esito.estrazione.model_dump() if esito.estrazione else None,
            }
            salvato.write_text(json.dumps(dati, ensure_ascii=False, indent=2), encoding="utf-8")

        print(f"\n== {cartella.name[:8]} · {atteso['ente']} · {dati['modello']} · token {dati['uso_token']}")
        if dati["estrazione"] is None:
            errori = ["estrazione fallita: " + "; ".join(dati["problemi_controllo"])]
        else:
            errori = confronta(Estrazione.model_validate(dati["estrazione"]), atteso)
            for p in dati["problemi_controllo"]:
                print(f"   controllo qualità: {p}")
        for e in errori:
            print(f"   ERRORE {e}")
        if not errori:
            print("   ok")
        totale_errori += len(errori)
        con_errori += bool(errori)

    print(f"\nBandi valutati: {n} · senza errori: {n - con_errori} · errori totali: {totale_errori}")
    return 1 if totale_errori else 0


if __name__ == "__main__":
    sys.exit(main())
