import json
from datetime import date
from pathlib import Path
from types import SimpleNamespace

import pytest

from worker import estrazione as modulo
from worker.estrazione import controlla, estrai_bando
from worker.schema_requisiti import Estrazione, classe_valida, normalizza_classe
from worker.valuta import CARTELLA_SET, confronta

OGGI = date(2026, 11, 10)
TESTO = (
    "Art. 2 - Requisiti specifici. Laurea magistrale nelle classi LM-23 Ingegneria civile "
    "o LM-4 Architettura; laurea triennale classe L-07. Patente di guida di categoria B. "
    "Scadenza delle domande: ore 12.00 del 10 dicembre 2026."
)


def requisito(**campi):
    base = dict(
        tipo="titolo_studio", descrizione="Laurea in ingegneria civile o architettura",
        valori_ammessi=["Ingegneria civile", "Architettura"], classi_laurea=["LM-23", "LM-4", "L-7"],
        valore_minimo=None, valore_massimo=None, obbligatorio=True, riferimento="Art. 2",
        testo_originale="Laurea magistrale nelle classi LM-23 Ingegneria civile", ambiguo=False,
        motivo_ambiguita=None,
    )
    return {**base, **campi}


def estrazione(requisiti=None, **dettagli) -> Estrazione:
    d = dict(
        ente="Comune di Prova", profilo="Funzionario tecnico", posti=1, scadenza="2026-12-10T12:00",
        tassa_euro=None, modalita_candidatura="inPA", tipo_contratto=None, regime_orario=None,
        prove=[], materie=[],
    )
    d.update(dettagli)
    return Estrazione.model_validate(
        dict(
            documento_e_bando=True, nota_documento=None,
            requisiti=requisiti if requisiti is not None else [
                requisito(),
                requisito(tipo="patente", descrizione="Patente B", valori_ammessi=["B"], classi_laurea=[],
                          testo_originale="Patente di guida di categoria B"),
            ],
            requisiti_generali=["cittadinanza italiana o UE"], dettagli=d,
        )
    )


# --- Classi di laurea ------------------------------------------------------


@pytest.mark.parametrize(
    "grezzo, atteso",
    [("L-07", "L-7"), ("LM- 4", "LM-4"), ("lm-23", "LM-23"), ("28/s", "28/S"), ("DM509-8", "DM509-08"), ("L–17", "L-17")],
)
def test_normalizza_classe(grezzo, atteso):
    assert normalizza_classe(grezzo) == atteso


def test_classe_valida():
    assert classe_valida("LM-23") and classe_valida("L/SNT4") and classe_valida("DM509-08")
    assert not classe_valida("Ingegneria civile") and not classe_valida("LM23x")


# --- Controllo qualità -----------------------------------------------------


def test_estrazione_corretta_passa_il_controllo():
    assert controlla(estrazione(), TESTO, "2026-12-10T11:00:00Z", oggi=OGGI) == []


def test_scadenza_passata_o_diversa_da_inpa():
    problemi = controlla(estrazione(scadenza="2026-10-01"), TESTO, "2026-12-10T11:00:00Z", oggi=OGGI)
    assert any("passato" in p for p in problemi)
    assert any("diversa da quella su inPA" in p for p in problemi)


def test_scadenza_mancante():
    assert "scadenza non trovata" in controlla(estrazione(scadenza=None), TESTO, oggi=OGGI)


def test_senza_titolo_di_studio():
    problemi = controlla(estrazione(requisiti=[]), TESTO, oggi=OGGI)
    assert "nessun requisito sul titolo di studio" in problemi


def test_citazione_inventata():
    e = estrazione(requisiti=[requisito(testo_originale="Iscrizione all'albo degli ingegneri da almeno 5 anni")])
    assert any("citazione non si trova" in p for p in controlla(e, TESTO, oggi=OGGI))


def test_citazione_con_spazi_e_a_capo_diversi_dal_pdf():
    e = estrazione(requisiti=[requisito(testo_originale="Laurea  magistrale\nnelle classi LM-23")])
    assert controlla(e, TESTO, oggi=OGGI) == []


def test_classe_non_citata_nel_bando():
    e = estrazione(requisiti=[requisito(classi_laurea=["LM-23", "LM-35"])])
    assert any("LM-35 non citata" in p for p in controlla(e, TESTO, oggi=OGGI))


def test_riferimento_mancante():
    e = estrazione(requisiti=[requisito(riferimento=None)])
    assert any("manca il riferimento" in p for p in controlla(e, TESTO, oggi=OGGI))


def test_documento_che_non_e_il_bando():
    e = estrazione()
    e.documento_e_bando, e.nota_documento = False, "solo determina"
    assert any("non sembra il bando" in p for p in controlla(e, TESTO, oggi=OGGI))


# --- Chiamata a Claude (client finto) --------------------------------------


class ClientFinto:
    def __init__(self, risposte):
        self.risposte = list(risposte)
        self.chiamate = []
        self.beta = SimpleNamespace(messages=SimpleNamespace(parse=self._parse))

    def _parse(self, **parametri):
        self.chiamate.append(parametri)
        stop, output = self.risposte.pop(0)
        uso = SimpleNamespace(input_tokens=1000, output_tokens=300, cache_read_input_tokens=0,
                              cache_creation_input_tokens=0)
        return SimpleNamespace(stop_reason=stop, parsed_output=output, usage=uso)


@pytest.fixture(autouse=True)
def oggi_fisso(monkeypatch):
    originale = modulo.controlla
    monkeypatch.setattr(modulo, "controlla", lambda e, t, s=None, oggi=None: originale(e, t, s, oggi=OGGI))


def test_haiku_basta_se_il_controllo_passa():
    client = ClientFinto([("end_turn", estrazione())])
    esito = estrai_bando(client, TESTO, "2026-12-10T11:00:00Z")
    assert esito.stato == "estratto" and esito.modello == modulo.MODELLO_ESTRAZIONE
    assert len(client.chiamate) == 1
    chiamata = client.chiamate[0]
    assert chiamata["output_format"] is Estrazione
    assert chiamata["system"][0]["cache_control"] == {"type": "ephemeral"}
    assert "fallbacks" not in chiamata  # Haiku non ha fallback lato server


def test_passa_a_sonnet_se_il_controllo_fallisce():
    client = ClientFinto([("end_turn", estrazione(requisiti=[])), ("end_turn", estrazione())])
    esito = estrai_bando(client, TESTO)
    assert esito.stato == "estratto" and esito.modello == modulo.MODELLO_CASI_DUBBI
    assert client.chiamate[1]["model"] == modulo.MODELLO_CASI_DUBBI
    assert client.chiamate[1]["fallbacks"] == "default"


def test_da_rivedere_se_falliscono_entrambi():
    client = ClientFinto([("end_turn", estrazione(requisiti=[])), ("end_turn", estrazione(requisiti=[]))])
    esito = estrai_bando(client, TESTO)
    assert esito.stato == "da_rivedere"
    assert "nessun requisito sul titolo di studio" in esito.problemi


def test_rifiuto_e_troncamento():
    client = ClientFinto([("refusal", None), ("max_tokens", None)])
    esito = estrai_bando(client, TESTO)
    assert esito.stato == "errore_estrazione"
    assert "troncata" in esito.problemi[0]


def test_classi_normalizzate_nel_risultato():
    e = estrazione(requisiti=[requisito(classi_laurea=["L-07", "LM-23", "lm-23"])])
    esito = estrai_bando(ClientFinto([("end_turn", e)]), TESTO)
    assert esito.estrazione.requisiti[0].classi_laurea == ["L-7", "LM-23"]


# --- Confronto con le annotazioni ------------------------------------------


def atteso(**campi):
    base = dict(
        titolo_studio=dict(classi_laurea=["LM-23", "LM-4", "L-7"], diplomi=[], ambiguo=None),
        patente=["B"], abilitazione=False, albo=False, eta_massima=None, esperienza_anni_minimi=None,
        scadenza_inpa="2026-12-10T11:00:00Z", posti=1,
    )
    return {**base, **campi}


def test_confronta_tutto_giusto():
    assert confronta(estrazione(), atteso()) == []


def test_confronta_classi_mancanti_e_inventate():
    a = atteso(titolo_studio=dict(classi_laurea=["LM-23", "LM-24"], diplomi=[], ambiguo=None))
    errori = confronta(estrazione(), a)
    assert "classi di laurea mancanti: LM-24" in errori
    assert "classi di laurea in più (inventate?): L-7, LM-4" in errori


def test_confronta_patente_abilitazione_ambiguita():
    a = atteso(patente=[], abilitazione=True,
               titolo_studio=dict(classi_laurea=["LM-23", "LM-4", "L-7"], diplomi=["geometra"], ambiguo=True))
    errori = confronta(estrazione(), a)
    assert any(e.startswith("patente") for e in errori)
    assert any(e.startswith("abilitazione") for e in errori)
    assert "titolo mancante: geometra" in errori
    assert any("ambiguo" in e for e in errori)


def test_confronta_scadenza_con_fuso_orario():
    # 00:00 italiane = 23:00Z del giorno prima su inPA
    assert confronta(estrazione(scadenza="2026-12-11T00:00"), atteso()) == []
    assert any(e.startswith("scadenza") for e in confronta(estrazione(scadenza="2026-12-20"), atteso()))


def test_set_di_prova_ben_formato():
    cartelle = [p for p in CARTELLA_SET.iterdir() if p.is_dir()]
    assert len(cartelle) >= 5
    for c in cartelle:
        a = json.loads((c / "atteso.json").read_text(encoding="utf-8"))
        assert a["id_inpa"] == c.name
        assert (c / "testo.txt").stat().st_size > 1000
        for classe in a["titolo_studio"]["classi_laurea"]:
            assert classe_valida(classe) and normalizza_classe(classe) == classe
