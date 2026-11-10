"""Estrazione dei requisiti dai bandi con l'API di Claude.

Per ogni bando in `dati/bandi.json` con stato `da_analizzare`:
1. Claude Haiku legge il testo e restituisce un JSON con lo schema fisso
   di `schema_requisiti.Estrazione` (structured outputs: il JSON è sempre valido);
2. il controllo qualità applica regole automatiche;
3. se il controllo fallisce, il bando passa a Claude Sonnet una volta;
4. se fallisce ancora, il bando va in revisione manuale (`da_rivedere`).

Il risultato va in `dati/estrazioni/<id_inpa>.json`.

Uso:
    python worker/estrazione.py --max 5
Serve ANTHROPIC_API_KEY nell'ambiente.
"""

from __future__ import annotations

import argparse
import json
import logging
import re
import sys
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

import anthropic

if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from worker.raccolta import CARTELLA_DATI, carica_archivio, salva_archivio
from worker.schema_requisiti import Estrazione, classe_valida, normalizza_classe

MODELLO_ESTRAZIONE = "claude-haiku-5-5"
MODELLO_CASI_DUBBI = "claude-sonnet-5-5"
MAX_TOKENS = 16000

log = logging.getLogger("estrazione")

# Istruzioni fisse: non mettere qui nulla che cambi tra un bando e l'altro,
# altrimenti il prompt caching non funziona.
ISTRUZIONI = """\
Sei un esperto di concorsi pubblici italiani. Ricevi il testo di un bando di concorso
(o di un avviso di mobilità o selezione) estratto da PDF, e ne estrai i dati che servono
a un candidato per capire se può partecipare.

Regole:
- Riporta solo ciò che il bando dice. Se un dato non c'è, lascia il campo vuoto (null o
  lista vuota). Non dedurre e non completare con conoscenze generali.
- In `requisiti` metti i requisiti specifici di ammissione: titolo di studio, abilitazioni,
  iscrizione ad albi, esperienza, patente, lingue richieste come requisito, limiti di età
  diversi da quelli di legge, e ogni altro requisito specifico del profilo.
- I requisiti generali di legge (cittadinanza, diritti civili e politici, assenza di condanne,
  idoneità fisica, obblighi di leva, non essere stati destituiti) vanno solo in
  `requisiti_generali`, in poche parole ciascuno. Non riportare dettagli su condanne o salute.
- Età: crea un requisito di tipo `eta` solo se il bando fissa un limite numerico diverso da
  "18 anni" e "età pensionabile". Il limite dei 18 anni e quello pensionabile non vanno in
  `requisiti`.
- Titolo di studio: un solo requisito per ogni gruppo di titoli in alternativa tra loro. Metti
  in `valori_ammessi` i nomi dei titoli e dei diplomi come scritti nel bando, e in
  `classi_laurea` tutti i codici di classe citati, nel formato 'LM-23', 'L-7', '28/S'
  (specialistiche DM 509/99) e 'DM509-08' per le triennali del DM 509/99 indicate con il solo
  numero. Non aggiungere classi che il bando non nomina, nemmeno se equiparate per legge.
- `testo_originale` è una citazione letterale e breve (al massimo due frasi) copiata dal testo.
- `riferimento`: articolo, punto o lettera del bando in cui si trova il requisito; se il bando
  non numera le sezioni, il titolo della sezione.
- `ambiguo` è true quando il requisito richiede un giudizio per essere verificato: "titolo
  equipollente" senza elenco, "esperienza attinente", titoli rinviati a un allegato o a un
  regolamento non incluso nel testo, formulazioni contraddittorie. Spiega in `motivo_ambiguita`.
- `obbligatorio` è false per i titoli solo preferenziali o valutabili ai fini del punteggio.
- Le date in formato AAAA-MM-GG, con l'ora se indicata (AAAA-MM-GGTHH:MM).
- Se il testo non è il bando (per esempio è solo una determina di approvazione) o non contiene
  i requisiti, imposta `documento_e_bando` a false e spiega in `nota_documento`.
"""


@dataclass
class Esito:
    estrazione: Estrazione | None
    modello: str
    problemi: list[str] = field(default_factory=list)
    uso_token: dict = field(default_factory=dict)

    @property
    def stato(self) -> str:
        if self.estrazione is None:
            return "errore_estrazione"
        return "da_rivedere" if self.problemi else "estratto"


class ErroreEstrazione(Exception):
    pass


def chiama_claude(client: anthropic.Anthropic, testo: str, modello: str) -> tuple[Estrazione, dict]:
    parametri = dict(
        model=modello,
        max_tokens=MAX_TOKENS,
        system=[{"type": "text", "text": ISTRUZIONI, "cache_control": {"type": "ephemeral"}}],
        messages=[{"role": "user", "content": f"<bando>\n{testo}\n</bando>"}],
        output_format=Estrazione,
        output_config={"effort": "medium"},
    )
    if modello == MODELLO_CASI_DUBBI:
        # Se un classificatore di sicurezza rifiuta, il server riprova su un altro modello.
        parametri.update(betas=["server-side-fallback-2026-07-01"], fallbacks="default")
    risposta = client.beta.messages.parse(**parametri)

    if risposta.stop_reason == "refusal":
        raise ErroreEstrazione(f"richiesta rifiutata dal modello ({modello})")
    if risposta.stop_reason == "max_tokens":
        raise ErroreEstrazione(f"risposta troncata a {MAX_TOKENS} token ({modello})")
    if risposta.parsed_output is None:
        raise ErroreEstrazione(f"nessun JSON nella risposta ({modello}, stop={risposta.stop_reason})")

    u = risposta.usage
    uso = {
        "input": u.input_tokens,
        "output": u.output_tokens,
        "cache_lettura": u.cache_read_input_tokens or 0,
        "cache_scrittura": u.cache_creation_input_tokens or 0,
    }
    return risposta.parsed_output, uso


# --- Controllo qualità -----------------------------------------------------


def _compatta(s: str) -> str:
    return re.sub(r"[^\w]+", "", s.lower())


def _data(s: str | None) -> date | None:
    if not s:
        return None
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00")).date()
    except ValueError:
        return None


def _classe_citata(classe: str, testo_compatto: str) -> bool:
    """Cerca 'L-7' anche come 'L-07'; per le triennali DM 509 basta il numero."""
    if classe.startswith("DM509-"):
        return classe[6:] in testo_compatto or str(int(classe[6:])) in testo_compatto
    if m := re.fullmatch(r"(LM|L)-(\d+)", classe):
        varianti = {f"{m[1]}{int(m[2])}", f"{m[1]}{int(m[2]):02d}"}
        return any(re.search(rf"{v.lower()}(?!\d)", testo_compatto) for v in varianti)
    return _compatta(classe) in testo_compatto


def controlla(estrazione: Estrazione, testo: str, scadenza_inpa: str | None = None, oggi: date | None = None) -> list[str]:
    """Regole automatiche. Restituisce l'elenco dei problemi (vuoto = ok)."""
    oggi = oggi or datetime.now(timezone.utc).date()
    problemi: list[str] = []

    if not estrazione.documento_e_bando:
        problemi.append(f"il testo non sembra il bando: {estrazione.nota_documento or 'nessuna nota'}")

    scadenza = _data(estrazione.dettagli.scadenza)
    if scadenza is None:
        problemi.append("scadenza non trovata")
    else:
        if scadenza < oggi:
            problemi.append(f"scadenza nel passato: {scadenza}")
        attesa = _data(scadenza_inpa)
        if attesa and abs((scadenza - attesa).days) > 1:
            problemi.append(f"scadenza {scadenza} diversa da quella su inPA ({attesa})")

    if not any(r.tipo == "titolo_studio" for r in estrazione.requisiti):
        problemi.append("nessun requisito sul titolo di studio")

    testo_compatto = _compatta(testo)
    for i, r in enumerate(estrazione.requisiti, 1):
        etichetta = f"requisito {i} ({r.tipo})"
        if not r.riferimento:
            problemi.append(f"{etichetta}: manca il riferimento all'articolo")
        citazione = _compatta(r.testo_originale)
        if not citazione:
            problemi.append(f"{etichetta}: manca la citazione")
        elif citazione[:60] not in testo_compatto:
            problemi.append(f"{etichetta}: la citazione non si trova nel testo del bando")
        for c in r.classi_laurea:
            if not classe_valida(c):
                problemi.append(f"{etichetta}: classe di laurea non valida '{c}'")
            elif not _classe_citata(normalizza_classe(c), testo_compatto):
                problemi.append(f"{etichetta}: classe {c} non citata nel bando")
    return problemi


def normalizza(estrazione: Estrazione) -> Estrazione:
    for r in estrazione.requisiti:
        r.classi_laurea = sorted({normalizza_classe(c) for c in r.classi_laurea})
    return estrazione


def estrai_bando(client: anthropic.Anthropic, testo: str, scadenza_inpa: str | None = None) -> Esito:
    """Haiku; se il controllo qualità fallisce, una seconda prova con Sonnet."""
    esito = None
    for modello in (MODELLO_ESTRAZIONE, MODELLO_CASI_DUBBI):
        try:
            estrazione, uso = chiama_claude(client, testo, modello)
        except ErroreEstrazione as e:
            esito = Esito(None, modello, [str(e)])
            continue
        estrazione = normalizza(estrazione)
        esito = Esito(estrazione, modello, controlla(estrazione, testo, scadenza_inpa), uso)
        if not esito.problemi:
            return esito
        log.info("Controllo fallito con %s: %s", modello, "; ".join(esito.problemi))
    return esito


# --- Elaborazione dell'archivio --------------------------------------------


def elabora_archivio(client: anthropic.Anthropic, cartella: Path, massimo: int | None) -> int:
    percorso = cartella / "bandi.json"
    archivio = carica_archivio(percorso)
    da_fare = [b for b in archivio.values() if b.get("stato_analisi") == "da_analizzare"]
    if massimo is not None:
        da_fare = da_fare[:massimo]

    for bando in da_fare:
        testo = (cartella / bando["percorso_testo"]).read_text(encoding="utf-8")
        esito = estrai_bando(client, testo, bando.get("scadenza"))
        uscita = cartella / "estrazioni" / f"{bando['id_inpa']}.json"
        uscita.parent.mkdir(parents=True, exist_ok=True)
        uscita.write_text(
            json.dumps(
                {
                    "id_inpa": bando["id_inpa"],
                    "modello": esito.modello,
                    "problemi": esito.problemi,
                    "uso_token": esito.uso_token,
                    "estrazione": esito.estrazione.model_dump() if esito.estrazione else None,
                },
                ensure_ascii=False,
                indent=2,
            ),
            encoding="utf-8",
        )
        bando["stato_analisi"] = esito.stato
        bando["percorso_estrazione"] = str(uscita.relative_to(cartella))
        salva_archivio(percorso, archivio)
        log.info("%s -> %s (%s)", bando["id_inpa"], esito.stato, esito.modello)
    return len(da_fare)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Estrazione dei requisiti dai bandi raccolti")
    parser.add_argument("--max", type=int, default=None, help="numero massimo di bandi da analizzare")
    parser.add_argument("--dati", type=Path, default=CARTELLA_DATI)
    args = parser.parse_args(argv)
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    try:
        n = elabora_archivio(anthropic.Anthropic(), args.dati, args.max)
    except anthropic.AuthenticationError:
        log.error("Chiave API non valida o assente (ANTHROPIC_API_KEY)")
        return 1
    except anthropic.APIConnectionError as e:
        log.error("API di Claude non raggiungibile: %s", e)
        return 1
    log.info("Analizzati %d bandi", n)
    return 0


if __name__ == "__main__":
    sys.exit(main())
