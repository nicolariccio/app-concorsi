"""Schema fisso dell'estrazione: cosa Claude deve restituire per ogni bando.

Le classi rispecchiano le tabelle `requisiti_bando` e `dettagli_bando` del
documento di progetto. Un dato assente nel bando resta vuoto (None o lista
vuota), mai inventato.
"""

from __future__ import annotations

import re
from typing import Literal, Optional

from pydantic import BaseModel, Field

TipoRequisito = Literal[
    "titolo_studio", "abilitazione", "albo", "eta", "esperienza", "patente", "lingua", "altro"
]
TipoProva = Literal["preselettiva", "scritta", "pratica", "orale", "colloquio", "titoli", "altro"]


class Requisito(BaseModel):
    tipo: TipoRequisito
    descrizione: str = Field(description="Sintesi breve del requisito, in italiano")
    valori_ammessi: list[str] = Field(
        description="Alternative ammesse, in OR tra loro: nomi dei titoli o diplomi, categorie di "
        "patente ('B'), professioni per abilitazione o albo. Vuoto se non pertinente"
    )
    classi_laurea: list[str] = Field(
        description="Solo per titolo_studio: codici delle classi citate nel bando, nel formato "
        "'LM-23', 'L-7', '28/S', 'DM509-08' (triennali DM 509/99). Vuoto se il bando non le elenca"
    )
    valore_minimo: Optional[float] = Field(description="Per eta o esperienza: anni minimi, se indicati")
    valore_massimo: Optional[float] = Field(description="Per eta: anni massimi, solo se numerici")
    obbligatorio: bool = Field(description="False se è solo titolo preferenziale o valutabile")
    riferimento: Optional[str] = Field(description="Articolo, punto o pagina del bando, es. 'Art. 2, punto 8'")
    testo_originale: str = Field(description="Citazione letterale e breve del bando che fonda il requisito")
    ambiguo: bool = Field(description="True se serve un giudizio umano per decidere chi lo soddisfa")
    motivo_ambiguita: Optional[str]


class Prova(BaseModel):
    tipo: TipoProva
    descrizione: Optional[str]
    data: Optional[str] = Field(description="Data in formato AAAA-MM-GG, solo se indicata nel bando")


class Dettagli(BaseModel):
    ente: Optional[str]
    profilo: Optional[str] = Field(description="Profilo professionale messo a concorso")
    posti: Optional[int]
    scadenza: Optional[str] = Field(description="Scadenza delle domande, AAAA-MM-GGTHH:MM se l'ora è indicata")
    tassa_euro: Optional[float] = Field(description="Tassa di partecipazione; 0 se il bando dice che non è dovuta")
    modalita_candidatura: Optional[str]
    tipo_contratto: Optional[str] = Field(description="Es. 'tempo indeterminato', 'tempo determinato 12 mesi'")
    regime_orario: Optional[str] = Field(description="Es. 'tempo pieno', 'part-time 18 ore'")
    prove: list[Prova]
    materie: list[str] = Field(description="Materie d'esame, una per elemento")


class Estrazione(BaseModel):
    documento_e_bando: bool = Field(
        description="False se il testo non è il bando (es. solo una determina) o non contiene i requisiti"
    )
    nota_documento: Optional[str]
    requisiti: list[Requisito] = Field(description="Requisiti specifici di ammissione")
    requisiti_generali: list[str] = Field(
        description="Requisiti generali di legge (cittadinanza, diritti civili, condanne, idoneità "
        "fisica, leva), ciascuno in poche parole"
    )
    dettagli: Dettagli


# --- Classi di laurea ------------------------------------------------------

_FORMATO_CLASSE = re.compile(r"^(LM-\d{1,2}|L-\d{1,2}|LMG/01|L/SNT\d|LM/SNT\d|\d{1,3}/S|SNT/\d/S|DM509-\d{2})$")


def normalizza_classe(codice: str) -> str:
    """'L-07' -> 'L-7', 'LM- 4' -> 'LM-4', '28/s' -> '28/S', 'DM509-8' -> 'DM509-08'."""
    c = re.sub(r"\s+", "", codice).upper().replace("–", "-")
    if m := re.fullmatch(r"(LM|L)-0*(\d{1,2})", c):
        return f"{m[1]}-{int(m[2])}"
    if m := re.fullmatch(r"DM509-0*(\d{1,2})", c):
        return f"DM509-{int(m[1]):02d}"
    return c


def classe_valida(codice: str) -> bool:
    return bool(_FORMATO_CLASSE.match(normalizza_classe(codice)))
