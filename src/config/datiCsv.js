// Fonte dati: la cartella army_builder/ del sito del calcolatore "Botte!" (repo ragnarokko/calcolatore_wh40,
// pubblicata su GitHub Pages, CORS aperto), generata da Wahapedia con `node tools/wahapedia-to-csv.mjs`.
// A differenza di wargame_table qui il set dati è fisso su "originale" (Wahapedia): nessuna scelta utente.
const URL_SITO = 'https://ragnarokko.github.io/calcolatore_wh40/';

export const urlArmyBuilderCsv = (nomeFile) => `${URL_SITO}army_builder/${nomeFile}`;
