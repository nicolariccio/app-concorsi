import json

import pytest

from worker import raccolta
from worker.raccolta import AllarmeNessunBando, raccogli


def voce(i: int) -> dict:
    return {
        "id": f"id{i}",
        "codice": f"C{i}",
        "titolo": f"Bando {i}",
        "figuraRicercata": "Istruttore tecnico",
        "categorie": ["Concorso"],
        "tipoProcedura": "ESAMI",
        "numPosti": 1,
        "dataScadenza": "2026-12-31T22:59:00Z",
        "dataPubblicazione": f"2026-11-{10 - i % 10:02d}T12:00:00Z",
        "entiRiferimento": ["Comune di Prova"],
    }


class ClientFinto:
    """Simula inPA: `pagine` è una lista di liste di voci, `pdf` mappa media_id -> byte."""

    def __init__(self, pagine, pdf=None, allegati=None):
        self.pagine = pagine
        self.pdf = pdf or {}
        self.allegati = allegati
        self.chiamate = {"ricerca": 0, "dettaglio": 0, "media": 0}

    def cerca_aperti(self, pagina):
        self.chiamate["ricerca"] += 1
        voci = self.pagine[pagina] if pagina < len(self.pagine) else []
        return {"content": voci, "last": pagina >= len(self.pagine) - 1}

    def dettaglio(self, id_inpa):
        self.chiamate["dettaglio"] += 1
        allegati = self.allegati if self.allegati is not None else [
            {"tipo": "BANDO_CONCORSO", "mediaId": f"m_{id_inpa}", "label": "bando.pdf"}
        ]
        return {
            "company": {"name": "Comune di Prova"},
            "sedi": [{"regioneDenominazione": "Emilia-Romagna", "provinciaDenominazione": "Bologna"}],
            "allegati": allegati,
        }

    def scarica_media(self, media_id):
        self.chiamate["media"] += 1
        return self.pdf.get(media_id, b"%PDF finto " + media_id.encode())


@pytest.fixture(autouse=True)
def testo_finto(monkeypatch):
    # Evita PDF veri: il "testo" è il contenuto decodificato.
    monkeypatch.setattr(raccolta, "estrai_testo_pdf", lambda b: b.decode(errors="ignore"))


def test_salva_solo_i_bandi_nuovi(tmp_path):
    client = ClientFinto([[voce(1), voce(2)]])
    assert len(raccogli(client, tmp_path)) == 2

    client = ClientFinto([[voce(3), voce(1), voce(2)]])
    nuovi = raccogli(client, tmp_path)
    assert [b["id_inpa"] for b in nuovi] == ["id3"]
    assert client.chiamate["dettaglio"] == 1

    archivio = json.loads((tmp_path / "bandi.json").read_text())
    assert {b["id_inpa"] for b in archivio} == {"id1", "id2", "id3"}


def test_record_con_campi_della_tabella_bandi(tmp_path):
    (record,) = raccogli(ClientFinto([[voce(1)]]), tmp_path)
    assert record["ente"] == "Comune di Prova"
    assert record["regione"] == ["Emilia-Romagna"]
    assert record["provincia"] == ["Bologna"]
    assert record["profilo"] == "Istruttore tecnico"
    assert record["url"].endswith("concorso_id=id1")
    assert record["stato_analisi"] == "da_analizzare"
    assert (tmp_path / record["percorso_pdf"][0]).exists()
    assert (tmp_path / record["percorso_testo"]).read_text().startswith("%PDF finto")
    assert len(record["hash_testo"]) == 64


def test_allarme_se_zero_bandi(tmp_path):
    with pytest.raises(AllarmeNessunBando):
        raccogli(ClientFinto([[]]), tmp_path)


def test_si_ferma_dopo_pagine_gia_note(tmp_path):
    pagine = [[voce(i)] for i in range(10)]
    raccogli(ClientFinto(pagine), tmp_path)

    client = ClientFinto(pagine)
    assert raccogli(client, tmp_path) == []
    assert client.chiamate["ricerca"] == 2  # non scorre tutte le 10 pagine


def test_max_pagine(tmp_path):
    client = ClientFinto([[voce(i)] for i in range(5)])
    assert len(raccogli(client, tmp_path, max_pagine=2)) == 2


def test_stesso_testo_segnato_come_duplicato(tmp_path):
    pdf = {"m_id1": b"testo identico", "m_id2": b"testo   identico"}
    nuovi = raccogli(ClientFinto([[voce(1), voce(2)]], pdf=pdf), tmp_path)
    stati = {b["id_inpa"]: b["stato_analisi"] for b in nuovi}
    assert stati == {"id1": "da_analizzare", "id2": "duplicato"}


def test_bando_senza_pdf(tmp_path):
    (record,) = raccogli(ClientFinto([[voce(1)]], allegati=[]), tmp_path)
    assert record["stato_analisi"] == "senza_pdf"
    assert record["hash_testo"] is None


def test_main_esce_con_2_se_zero_bandi(tmp_path, monkeypatch):
    monkeypatch.setattr(raccolta, "ClientInpa", lambda: ClientFinto([[]]))
    assert raccolta.main(["--dati", str(tmp_path)]) == 2
