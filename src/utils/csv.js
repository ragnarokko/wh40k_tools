// Parsing dei CSV `|`-separati del repo del calcolatore "Botte!" (ragnarokko/calcolatore_wh40),
// stesso formato usato da wargame_table (src/components/CreazioneEsercito/csvUnitaImport.js).

const SEPARATORE = '|';

// Un campo quotato usa la sequenza CSV standard: virgolette doppie raddoppiate per rappresentare
// una virgoletta letterale (es. MOV `"6"""` → `6"`).
function pulisciCampo(valoreGrezzo = '') {
  const valore = valoreGrezzo.trim();
  if (valore.length >= 2 && valore.startsWith('"') && valore.endsWith('"')) {
    return valore.slice(1, -1).replace(/""/g, '"');
  }
  return valore;
}

export function parseRigheCsv(testo) {
  const righe = testo
    .replace(/^﻿/, '')
    .split(/\r?\n/)
    .filter((riga) => riga.trim() !== '');
  const [intestazione, ...corpo] = righe;
  const colonne = intestazione.split(SEPARATORE).map((c) => c.trim());
  return corpo.map((riga) => {
    const valori = riga.split(SEPARATORE).map(pulisciCampo);
    const record = {};
    colonne.forEach((colonna, i) => {
      record[colonna] = valori[i] ?? '';
    });
    return record;
  });
}
