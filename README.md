# WH40 Tool

Pagina web standalone (React + Vite) per consultare dati Warhammer 40k, pubblicata su GitHub Pages: [ragnarokko.github.io/wh40k_tools](https://ragnarokko.github.io/wh40k_tools/).

Progetto indipendente da [wargame_table](https://github.com/ragnarokko/wargame_table) (l'app del tavolo da gioco): nasce copiando e adattando il pannello "Eserciti" di quella app in una pagina a sé, pensata anche per il telefono.

## Cosa fa

Un solo tab per ora, **Detach**:

- Scelta **fazione** e, per gli Space Marines, **sottofazione** (capitolo).
- Scelta dei **distaccamenti** (checkbox, fino a 3 DP totali; scelto un distaccamento di un capitolo Space Marines, quelli degli altri capitoli si disattivano, i generici restano).
- **Disposizioni di forze disponibili** (es. *Take and Hold*, *Purge the Foe*) in base ai distaccamenti scelti: unione delle disposizioni che ciascuno di essi consente (nessun distaccamento scelto = nessun vincolo).
- Abilità d'esercito della fazione.
- Per ogni distaccamento scelto: **Bonus distaccamento**, **Potenziamenti**.
- **Stratagemmi** dei distaccamenti scelti più i comuni Core, con gli stessi simboli di fase e pallini di turno (blu/rosso/verde) del pannello originale, filtrabili per fase (Comando/Movimento/Tiro/Carica/Mischia).
- In fondo, il glossario **Regole**: Armi, Unità e Terreno/parole chiave (stesso contenuto e stessi link a Wahapedia del pannello originale).

La selezione (fazione/sottofazione/distaccamenti) resta salvata in `localStorage` tra una visita e l'altra.

## Dati

Nessun CSV è incluso nel repo: tutto arriva a runtime (fetch, nessun rebuild necessario per aggiornare i dati) dalla cartella `army_builder/` del sito del calcolatore "Botte!" (`https://ragnarokko.github.io/calcolatore_wh40/army_builder/`):

- `distaccamenti.csv`, `potenziamenti.csv`, `regole_distaccamento.csv`, `stratagemmi.csv`, `abilita_comuni.csv`.

A differenza di wargame_table, qui **non c'è scelta** tra set di dati Wahapedia/BSData: si usa sempre il set Wahapedia (quello generato da `node tools/wahapedia-to-csv.mjs` nel repo del calcolatore), fisso. Per aggiornare i dati: modificare/generare i CSV in quel repo, fare push, poi ricaricare questa pagina (i file sono scaricati di nuovo a ogni apertura).

## Struttura

```
src/
  config/
    capitoliDistaccamenti.js  mappa distaccamento → capitolo Space Marines (stessa di wargame_table)
    datiCsv.js                URL fisso del sito del calcolatore + percorso dei CSV di army_builder/
    disposizioni.js           le 5 disposizioni di forze (id + nome)
    fasiStratagemmi.js        fasi di attivazione degli stratagemmi (simboli, colori turno)
    regole.js                 URL delle Core Rules (Wahapedia) per i link del glossario
    regoleArmi.js             testi scritti a mano del glossario Armi/Terreno (non da CSV)
  hooks/
    useDistaccamenti.js       store dei dati: scarica e indicizza i CSV di army_builder/
  utils/
    csv.js                    parser del formato CSV (separatore "|") usato da army_builder/
  components/
    TabBar/                   barra dei tab, generica (per aggiungerne altri in futuro)
    Detach/                   il tab Detach: Detach.jsx (logica) + VociRegole.jsx (pezzi di UI) + CSS module
  App.jsx                      elenco dei tab (oggi solo Detach) + layout della pagina
```

Stesse convenzioni di wargame_table: componenti in italiano, CSS Modules, stato con `useState` + `localStorage` (nessun Redux/Context pesante), nessuna libreria UI esterna.

## Sviluppo

```bash
npm install
npm run dev
```

## Pubblicazione

GitHub Pages via Action (`.github/workflows/deploy.yml`) a ogni push su `main`; `vite.config.js` imposta `base: '/wh40k_tools/'` solo in build.
