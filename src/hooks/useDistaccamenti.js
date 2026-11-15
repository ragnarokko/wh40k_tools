import { useSyncExternalStore } from 'react';
import { urlArmyBuilderCsv } from '../config/datiCsv';
import { parseRigheCsv } from '../utils/csv';

// Dati per il tab Detach (cartella army_builder/ del sito del calcolatore, generata da Wahapedia
// con `node tools/wahapedia-to-csv.mjs`), copiato e adattato da wargame_table
// (src/components/RegoleEsercito/csvRegoleEsercito.js):
//   distaccamenti.csv        id|fac|faction|name|type|dp|force_disposition
//   potenziamenti.csv        id|fac|faction|name|cost|detachment_id|detachment|upgrade|restrizione|descrizione
//   regole_distaccamento.csv id|fac|detachment_id|detachment|name|descrizione
//   stratagemmi.csv          id|fac|detachment_id|detachment|name|tipo|cp|turno|fase|descrizione
//   abilita_comuni.csv       ability_id|ability|fac|legend|descrizione   (abilità di fazione/d'esercito)
// Nei testi il carattere ¶ separa i capoversi (un CSV a una riga per record non può contenere a capo).
// Le fazioni sono identificate dal codice `fac`. Gli stratagemmi senza distaccamento e senza fazione
// sono quelli comuni (Core).

const TIPO_ABORDAGGIO = 'Boarding Actions';

let dati = vuoti();
let caricato = false;
let promessaInCorso = null;
let ultimoErrore = null;
let versione = {};
const ascoltatori = new Set();

function vuoti() {
  return {
    fazioni: [], // [{ codice, nome }]
    distaccamentiPerFazione: new Map(), // codice → [{ id, nome, dp, disposizione }]
    distaccamentoPerId: new Map(),
    potenziamentiPerDistaccamento: new Map(),
    regolePerDistaccamento: new Map(),
    stratagemmiPerDistaccamento: new Map(),
    stratagemmiComuni: [],
    abilitaPerFazione: new Map(), // codice → [{ nome, descrizione }]
    abilitaBase: [], // abilità "Core" senza fazione (Deep Strike, Stealth, …)
  };
}

function notificaAscoltatori() {
  ascoltatori.forEach((cb) => cb());
}

const aggiungi = (mappa, chiave, valore) => {
  if (!mappa.has(chiave)) mappa.set(chiave, []);
  mappa.get(chiave).push(valore);
};

const perNome = (a, b) => a.nome.localeCompare(b.nome);

function costruisci(righeDistaccamenti, righePotenziamenti, righeRegole, righeStratagemmi, righeAbilita) {
  const d = vuoti();
  const fazioni = new Map();
  for (const r of righeDistaccamenti) {
    if (r.type === TIPO_ABORDAGGIO || !r.id || !r.fac) continue;
    fazioni.set(r.fac, r.faction);
    const distaccamento = { id: r.id, nome: r.name, dp: Number(r.dp) || 0, disposizione: r.force_disposition, fazione: r.fac };
    aggiungi(d.distaccamentiPerFazione, r.fac, distaccamento);
    d.distaccamentoPerId.set(r.id, distaccamento);
  }
  d.fazioni = [...fazioni].map(([codice, nome]) => ({ codice, nome })).sort(perNome);
  d.distaccamentiPerFazione.forEach((lista) => lista.sort(perNome));

  for (const r of righePotenziamenti) {
    if (!d.distaccamentoPerId.has(r.detachment_id)) continue;
    aggiungi(d.potenziamentiPerDistaccamento, r.detachment_id, {
      id: r.id,
      nome: r.name,
      costo: r.cost,
      restrizione: r.restrizione,
      descrizione: r.descrizione,
    });
  }
  for (const r of righeRegole) {
    if (!d.distaccamentoPerId.has(r.detachment_id)) continue;
    aggiungi(d.regolePerDistaccamento, r.detachment_id, { id: r.id, nome: r.name, descrizione: r.descrizione });
  }
  for (const r of righeStratagemmi) {
    const stratagemma = {
      id: r.id,
      nome: r.name,
      tipo: r.tipo,
      cp: r.cp,
      turno: r.turno,
      fase: r.fase,
      descrizione: r.descrizione,
    };
    if (r.detachment_id) {
      if (d.distaccamentoPerId.has(r.detachment_id)) aggiungi(d.stratagemmiPerDistaccamento, r.detachment_id, stratagemma);
    } else {
      d.stratagemmiComuni.push(stratagemma);
    }
  }
  d.stratagemmiComuni.sort(perNome);

  const viste = new Set();
  const visteBase = new Set();
  for (const r of righeAbilita) {
    if (!r.ability) continue;
    if (!r.fac) {
      if (visteBase.has(r.ability)) continue;
      visteBase.add(r.ability);
      d.abilitaBase.push({ nome: r.ability, descrizione: r.descrizione });
      continue;
    }
    const chiave = `${r.fac}|${r.ability}`;
    if (viste.has(chiave)) continue;
    viste.add(chiave);
    aggiungi(d.abilitaPerFazione, r.fac, { nome: r.ability, descrizione: r.descrizione });
  }
  d.abilitaPerFazione.forEach((lista) => lista.sort(perNome));
  d.abilitaBase.sort(perNome);
  return d;
}

async function scaricaCsv(nomeFile) {
  const percorso = urlArmyBuilderCsv(nomeFile);
  const risposta = await fetch(`${percorso}?t=${Date.now()}`, { cache: 'no-store' });
  const testo = await risposta.text();
  if (!risposta.ok || testo.trimStart().startsWith('<')) {
    throw new Error(`Impossibile leggere ${percorso} (HTTP ${risposta.status})`);
  }
  return parseRigheCsv(testo);
}

async function scaricaEProcessa() {
  const [distaccamenti, potenziamenti, regole, stratagemmi] = await Promise.all([
    scaricaCsv('distaccamenti.csv'),
    scaricaCsv('potenziamenti.csv'),
    scaricaCsv('regole_distaccamento.csv'),
    scaricaCsv('stratagemmi.csv'),
  ]);
  const abilita = await scaricaCsv('abilita_comuni.csv').catch(() => []);
  return costruisci(distaccamenti, potenziamenti, regole, stratagemmi, abilita);
}

export function caricaDatiSeNecessario() {
  if (caricato) return Promise.resolve();
  if (!promessaInCorso) {
    promessaInCorso = scaricaEProcessa()
      .then((nuovi) => {
        dati = nuovi;
        caricato = true;
        ultimoErrore = null;
      })
      .catch((errore) => {
        ultimoErrore = errore;
        throw errore;
      })
      .finally(() => {
        promessaInCorso = null;
        versione = {};
        notificaAscoltatori();
      });
  }
  return promessaInCorso;
}

export function ricaricaDati() {
  caricato = false;
  return caricaDatiSeNecessario();
}

export const datiCaricati = () => caricato;
export const erroreCaricamento = () => ultimoErrore;

// Cambia riferimento ad ogni caricamento: va usato come dipendenza dei useMemo che chiamano le
// funzioni qui sotto, che leggono uno stato esterno al render.
export function useVersioneDati() {
  return useSyncExternalStore(
    (cb) => {
      ascoltatori.add(cb);
      return () => ascoltatori.delete(cb);
    },
    () => versione,
  );
}

export const elencoFazioni = () => dati.fazioni;
export const distaccamentiFazione = (codice) => dati.distaccamentiPerFazione.get(codice) ?? [];
export const abilitaFazione = (codice) => dati.abilitaPerFazione.get(codice) ?? [];
export const stratagemmiComuni = () => dati.stratagemmiComuni;
export const abilitaBase = () => dati.abilitaBase;

// Regole, potenziamenti e stratagemmi di un distaccamento.
export function contenutoDistaccamento(id) {
  return {
    regole: dati.regolePerDistaccamento.get(id) ?? [],
    potenziamenti: dati.potenziamentiPerDistaccamento.get(id) ?? [],
    stratagemmi: dati.stratagemmiPerDistaccamento.get(id) ?? [],
  };
}
