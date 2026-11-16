# WH40 Tool

Pagina web standalone (React + Vite) per consultare dati Warhammer 40k, pubblicata su GitHub Pages: [ragnarokko.github.io/wh40k_tools](https://ragnarokko.github.io/wh40k_tools/).

Progetto indipendente da [wargame_table](https://github.com/ragnarokko/wargame_table) (l'app del tavolo da gioco): nasce copiando e adattando il pannello "Eserciti" di quella app in una pagina a sé, pensata anche per il telefono.

## Cosa fa

Due tab:

### Detach

- Scelta **fazione** e, per gli Space Marines, **sottofazione** (capitolo).
- Scelta dei **distaccamenti** (checkbox, fino a 3 DP totali; scelto un distaccamento di un capitolo Space Marines, quelli degli altri capitoli si disattivano, i generici restano).
- **Disposizioni di forze disponibili** (es. *Take and Hold*, *Purge the Foe*) in base ai distaccamenti scelti: unione delle disposizioni che ciascuno di essi consente (nessun distaccamento scelto = nessun vincolo).
- Abilità d'esercito della fazione.
- Per ogni distaccamento scelto: **Bonus distaccamento**, **Potenziamenti**.
- **Stratagemmi** dei distaccamenti scelti più i comuni Core, con gli stessi simboli di fase e pallini di turno (blu/rosso/verde) del pannello originale, filtrabili per fase (Comando/Movimento/Tiro/Carica/Mischia).
- In fondo, il glossario **Regole**: Armi, Unità e Terreno/parole chiave (stesso contenuto e stessi link a Wahapedia del pannello originale).

La selezione (fazione/sottofazione/distaccamenti) resta salvata in `localStorage` tra una visita e l'altra.

### Tracker

Stesso tracker di partita del pannello "Tracker partita" di wargame_table (disposizione di forze, missione primaria e secondarie — tattiche pescate/scelte a mano o fisse —, round e turni, totali VP con i tetti per round/partita, statistica round × giocatore), ma come pagina a sé: senza il collegamento al tavolo/basette, quindi niente immagine di layout né tabella degli obiettivi (OC), che richiedono le basette posizionate su un tavolo che qui non esiste. Aggiunge, rispetto all'originale, un contatore **CP** per giocatore (parte da 1, +1 all'inizio di ogni proprio turno — annullato tornando indietro con ◀ —, pulsanti +/- per correzioni a mano, minimo 0). Stato salvato in `localStorage`, indipendente da quello di Detach.

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
    disposizioni.js           le 5 disposizioni di forze per Detach (id + nome)
    fasiStratagemmi.js        fasi di attivazione degli stratagemmi (simboli, colori turno)
    missioni.js               missioni primarie/secondarie 11a ed. per il Tracker (generato, vedi wargame_table)
    regole.js                 URL delle Core Rules (Wahapedia) per i link del glossario
    regoleArmi.js             testi scritti a mano del glossario Armi/Terreno (non da CSV)
  contexts/
    TrackerContext.jsx        stato della partita tracciata (round, turni, punti), salvato in localStorage
  hooks/
    useDistaccamenti.js       store dei dati: scarica e indicizza i CSV di army_builder/
  utils/
    csv.js                    parser del formato CSV (separatore "|") usato da army_builder/
    id.js                     generaId() (crypto.randomUUID)
    trackerPunti.js           calcolo punti VP di una missione a partire dalla selezione nel dialogo
  components/
    TabBar/                   barra dei tab, generica (per aggiungerne altri in futuro)
    Modale/                   finestra modale generica riutilizzabile
    Detach/                   il tab Detach: Detach.jsx (logica) + VociRegole.jsx (pezzi di UI) + CSS module
    Tracker/                  il tab Tracker: Tracker.jsx + SetupTracker/SchedaGiocatore/StatisticheTracker/
                               RiepilogoMissione/DialogoPunteggio + CSS module
  App.jsx                      elenco dei tab (Detach, Tracker) + layout della pagina
```

Stesse convenzioni di wargame_table: componenti in italiano, CSS Modules, stato con `useState` + `localStorage` (nessun Redux/Context pesante), nessuna libreria UI esterna.

## Sviluppo

```bash
npm install
npm run dev
```

## Pubblicazione

GitHub Pages via Action (`.github/workflows/deploy.yml`) a ogni push su `main`; `vite.config.js` imposta `base: '/wh40k_tools/'` solo in build.
