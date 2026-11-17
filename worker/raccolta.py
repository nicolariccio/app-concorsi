"""Raccolta dei bandi aperti dal portale inPA.

Scarica l'elenco dei bandi aperti (dal più recente), salva in `dati/bandi.json`
solo quelli non ancora visti, con PDF del bando e testo estratto, e calcola
l'hash del testo per non rianalizzare lo stesso contenuto.

Uso:
    python worker/raccolta.py                 # raccolta normale
    python worker/raccolta.py --max-pagine 2  # prova veloce

Codici di uscita:
    0  tutto bene (anche se non ci sono bandi nuovi)
    1  errore di rete o di formato
    2  allarme: l'API ha restituito zero bandi aperti (probabile cambio di API)
"""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import logging
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import requests

BASE_URL = "https://portale.inpa.gov.it"
URL_RICERCA = f"{BASE_URL}/concorsi-smart/api/concorso-public-area/search-better"
URL_DETTAGLIO = f"{BASE_URL}/concorsi-smart/api/concorso-public-area/{{id}}"
URL_MEDIA = f"{BASE_URL}/api/media/{{media_id}}"
URL_PUBBLICO = "https://www.inpa.gov.it/bandi-e-avvisi/dettaglio-bando-avviso/?concorso_id={id}"

DIMENSIONE_PAGINA = 50
PAUSA_SECONDI = 1.0  # ritmo moderato verso inPA
TIMEOUT_SECONDI = 30
USER_AGENT = "app-concorsi-worker/0.1"

RADICE = Path(__file__).resolve().parent.parent
CARTELLA_DATI = RADICE / "dati"

log = logging.getLogger("raccolta")


class AllarmeNessunBando(Exception):
    """L'API non restituisce alcun bando aperto: quasi certamente qualcosa è cambiato."""


class ClientInpa:
    def __init__(self, sessione: requests.Session | None = None, pausa: float = PAUSA_SECONDI):
        self.sessione = sessione or requests.Session()
        self.sessione.headers.setdefault("User-Agent", USER_AGENT)
        self.pausa = pausa
        self._ultima = 0.0

    def _attendi(self) -> None:
        trascorso = time.monotonic() - self._ultima
        if trascorso < self.pausa:
            time.sleep(self.pausa - trascorso)
        self._ultima = time.monotonic()

    def cerca_aperti(self, pagina: int) -> dict:
        self._attendi()
        corpo = {
            "text": "",
            "categoriaId": None,
            "regioneId": None,
            "status": ["OPEN"],
            "settoreId": None,
            "provinciaCodice": None,
        }
        r = self.sessione.post(
            URL_RICERCA,
            params={"page": pagina, "size": DIMENSIONE_PAGINA},
            json=corpo,
            timeout=TIMEOUT_SECONDI,
        )
        r.raise_for_status()
        return r.json()

    def dettaglio(self, id_inpa: str) -> dict:
        self._attendi()
        r = self.sessione.get(URL_DETTAGLIO.format(id=id_inpa), timeout=TIMEOUT_SECONDI)
        r.raise_for_status()
        return r.json()

    def scarica_media(self, media_id: str) -> bytes:
        self._attendi()
        r = self.sessione.get(URL_MEDIA.format(media_id=media_id), timeout=TIMEOUT_SECONDI * 2)
        r.raise_for_status()
        return r.content


# --- Archivio locale -------------------------------------------------------


def carica_archivio(percorso: Path) -> dict[str, dict]:
    if not percorso.exists():
        return {}
    dati = json.loads(percorso.read_text(encoding="utf-8"))
    return {b["id_inpa"]: b for b in dati}


def salva_archivio(percorso: Path, archivio: dict[str, dict]) -> None:
    percorso.parent.mkdir(parents=True, exist_ok=True)
    elenco = sorted(archivio.values(), key=lambda b: b.get("data_pubblicazione") or "", reverse=True)
    temporaneo = percorso.with_suffix(".tmp")
    temporaneo.write_text(json.dumps(elenco, ensure_ascii=False, indent=2), encoding="utf-8")
    temporaneo.replace(percorso)  # scrittura atomica


# --- Trasformazione --------------------------------------------------------


def estrai_testo_pdf(contenuto: bytes) -> str:
    try:
        from pypdf import PdfReader

        lettore = PdfReader(io.BytesIO(contenuto))
        return "\n".join((pagina.extract_text() or "") for pagina in lettore.pages)
    except Exception as e:  # PDF scansionati o corrotti: il testo resta vuoto
        log.warning("Testo non estraibile dal PDF: %s", e)
        return ""


def calcola_hash(testo: str, contenuto: bytes) -> str:
    """Hash del testo normalizzato; se il testo è vuoto (PDF scansionato), dei byte."""
    normalizzato = " ".join(testo.split())
    if normalizzato:
        return hashlib.sha256(normalizzato.encode("utf-8")).hexdigest()
    return hashlib.sha256(contenuto).hexdigest()


def scegli_allegati_bando(dettaglio: dict) -> list[dict]:
    """Allegati di tipo BANDO_CONCORSO; se non ce ne sono, tutti i PDF."""
    allegati = [a for a in (dettaglio.get("allegati") or []) if a.get("mediaId")]
    bando = [a for a in allegati if a.get("tipo") == "BANDO_CONCORSO"]
    if bando:
        return bando
    return [a for a in allegati if (a.get("label") or "").lower().endswith(".pdf")]


def record_da_dettaglio(voce: dict, dettaglio: dict) -> dict:
    """Record con i campi della tabella `bandi` del documento di progetto."""
    sedi = dettaglio.get("sedi") or []
    regioni = sorted({s["regioneDenominazione"] for s in sedi if s.get("regioneDenominazione")})
    province = sorted({s["provinciaDenominazione"] for s in sedi if s.get("provinciaDenominazione")})
    ente = (dettaglio.get("company") or {}).get("name") or ", ".join(voce.get("entiRiferimento") or [])
    return {
        "id_inpa": voce["id"],
        "codice": voce.get("codice"),
        "url": URL_PUBBLICO.format(id=voce["id"]),
        "link_esterno": dettaglio.get("linkReindirizzamento") or dettaglio.get("linkSitoPA"),
        "ente": ente,
        "titolo": voce.get("titolo"),
        "profilo": voce.get("figuraRicercata"),
        "categorie": voce.get("categorie") or [],
        "tipo_procedura": voce.get("tipoProcedura"),
        "regione": regioni,
        "provincia": province,
        "posti": voce.get("numPosti"),
        "scadenza": voce.get("dataScadenza"),
        "data_pubblicazione": voce.get("dataPubblicazione"),
        "percorso_pdf": [],
        "percorso_testo": None,
        "hash_testo": None,
        "stato_analisi": "da_analizzare",
        "raccolto_il": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }


# --- Raccolta --------------------------------------------------------------


def raccogli(
    client: ClientInpa,
    cartella: Path = CARTELLA_DATI,
    max_pagine: int | None = None,
    pagine_note_per_fermarsi: int = 2,
) -> list[dict]:
    """Salva i bandi nuovi e li restituisce.

    L'elenco è ordinato dal più recente: dopo `pagine_note_per_fermarsi` pagine
    consecutive senza bandi nuovi ci si ferma, per non riscaricare tutto ogni volta.
    """
    percorso_archivio = cartella / "bandi.json"
    archivio = carica_archivio(percorso_archivio)
    hash_noti = {b["hash_testo"] for b in archivio.values() if b.get("hash_testo")}
    nuovi: list[dict] = []
    pagina, pagine_senza_nuovi = 0, 0

    while True:
        risposta = client.cerca_aperti(pagina)
        voci = risposta.get("content")
        if voci is None:
            raise ValueError("Risposta di inPA senza campo 'content': formato cambiato?")
        if pagina == 0 and not voci:
            raise AllarmeNessunBando("inPA ha restituito zero bandi aperti")

        nuovi_in_pagina = 0
        for voce in voci:
            if voce["id"] in archivio:
                continue
            record = elabora_bando(client, voce, cartella, hash_noti)
            archivio[record["id_inpa"]] = record
            nuovi.append(record)
            nuovi_in_pagina += 1
            salva_archivio(percorso_archivio, archivio)  # niente lavoro perso se si interrompe

        log.info("Pagina %d: %d bandi, %d nuovi", pagina, len(voci), nuovi_in_pagina)
        pagine_senza_nuovi = 0 if nuovi_in_pagina else pagine_senza_nuovi + 1

        pagina += 1
        if risposta.get("last", True) or not voci:
            break
        if archivio and pagine_senza_nuovi >= pagine_note_per_fermarsi:
            break
        if max_pagine is not None and pagina >= max_pagine:
            break

    salva_archivio(percorso_archivio, archivio)
    return nuovi


def elabora_bando(client: ClientInpa, voce: dict, cartella: Path, hash_noti: set[str]) -> dict:
    dettaglio = client.dettaglio(voce["id"])
    record = record_da_dettaglio(voce, dettaglio)

    testi, contenuti = [], []
    for allegato in scegli_allegati_bando(dettaglio):
        contenuto = client.scarica_media(allegato["mediaId"])
        nome = f"{voce['id']}_{allegato['mediaId']}.pdf"
        percorso_pdf = cartella / "pdf" / nome
        percorso_pdf.parent.mkdir(parents=True, exist_ok=True)
        percorso_pdf.write_bytes(contenuto)
        record["percorso_pdf"].append(str(percorso_pdf.relative_to(cartella)))
        testi.append(estrai_testo_pdf(contenuto))
        contenuti.append(contenuto)

    if not contenuti:
        record["stato_analisi"] = "senza_pdf"
        log.warning("Bando %s senza PDF del bando", voce["id"])
        return record

    testo = "\n\n".join(testi)
    percorso_testo = cartella / "testi" / f"{voce['id']}.txt"
    percorso_testo.parent.mkdir(parents=True, exist_ok=True)
    percorso_testo.write_text(testo, encoding="utf-8")
    record["percorso_testo"] = str(percorso_testo.relative_to(cartella))
    record["hash_testo"] = calcola_hash(testo, b"".join(contenuti))
    if not testo.strip():
        record["stato_analisi"] = "testo_non_estraibile"
    elif record["hash_testo"] in hash_noti:
        record["stato_analisi"] = "duplicato"  # stesso testo di un bando già raccolto
    hash_noti.add(record["hash_testo"])
    return record


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--max-pagine", type=int, default=None, help="limite di pagine (per prove)")
    parser.add_argument("--dati", type=Path, default=CARTELLA_DATI, help="cartella dei dati")
    args = parser.parse_args(argv)
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

    try:
        nuovi = raccogli(ClientInpa(), args.dati, max_pagine=args.max_pagine)
    except AllarmeNessunBando as e:
        log.error("ALLARME: %s", e)
        return 2
    except (requests.RequestException, ValueError, KeyError) as e:
        log.error("ERRORE nella raccolta: %s", e)
        return 1

    if nuovi:
        log.info("Raccolti %d bandi nuovi", len(nuovi))
    else:
        log.info("Nessun bando nuovo dall'ultima raccolta")
    return 0


if __name__ == "__main__":
    sys.exit(main())
