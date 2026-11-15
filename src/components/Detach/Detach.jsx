import { useEffect, useMemo, useState } from 'react';
import { CAPITOLI, FAZIONE_CON_CAPITOLI, capitoloDistaccamento } from '../../config/capitoliDistaccamenti';
import { DISPOSIZIONI } from '../../config/disposizioni';
import { URL_REGOLE } from '../../config/regole';
import { REGOLE_ARMI, REGOLE_TERRENO } from '../../config/regoleArmi';
import { FASI, valeInFase } from '../../config/fasiStratagemmi';
import {
  abilitaBase,
  abilitaFazione,
  caricaDatiSeNecessario,
  contenutoDistaccamento,
  datiCaricati,
  distaccamentiFazione,
  elencoFazioni,
  erroreCaricamento,
  stratagemmiComuni,
  useVersioneDati,
} from '../../hooks/useDistaccamenti';
import { Potenziamento, Regola, Sezione, Stratagemma, VoceGlossario } from './VociRegole';
import styles from './Detach.module.css';

// Punti distaccamento (DP) spendibili: la somma dei DP dei distaccamenti scelti non li supera.
// Stesso limite di wargame_table (src/components/RegoleEsercito/RegoleEsercito.jsx).
const LIMITE_DP = 3;

const CHIAVE_STORAGE = 'wh40-tool-detach';

function leggiSelezioneSalvata() {
  try {
    const grezzo = JSON.parse(localStorage.getItem(CHIAVE_STORAGE) || '{}');
    return {
      fazione: grezzo.fazione || '',
      sottofazione: grezzo.sottofazione || '',
      distaccamenti: Array.isArray(grezzo.distaccamenti) ? grezzo.distaccamenti : [],
    };
  } catch {
    return { fazione: '', sottofazione: '', distaccamenti: [] };
  }
}

// Tab "Detach": scelta di fazione, sottofazione (capitolo Space Marines) e distaccamenti (fino a
// LIMITE_DP punti), con le disposizioni di forze compatibili, i bonus/potenziamenti/stratagemmi di
// ciascun distaccamento e, in fondo, il glossario di regole. Copiato e adattato dal pannello
// "Eserciti" di wargame_table (src/components/RegoleEsercito/RegoleEsercito.jsx): qui non c'è un
// esercito Blu/Rosso da scegliere, solo una selezione a mano, persistita in localStorage.
function Detach() {
  const [selezione, setSelezione] = useState(leggiSelezioneSalvata);
  const [faseFiltro, setFaseFiltro] = useState('tutto');
  const versione = useVersioneDati();

  useEffect(() => {
    caricaDatiSeNecessario().catch(() => {});
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CHIAVE_STORAGE, JSON.stringify(selezione));
    } catch {
      // localStorage non disponibile: la scelta vale solo fino alla chiusura della pagina.
    }
  }, [selezione]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fazioni = useMemo(() => elencoFazioni(), [versione]);
  const codiceValido = fazioni.some((f) => f.codice === selezione.fazione) ? selezione.fazione : '';

  /* eslint-disable react-hooks/exhaustive-deps */
  const tuttiDistaccamenti = useMemo(() => distaccamentiFazione(codiceValido), [codiceValido, versione]);
  const abilita = useMemo(() => abilitaFazione(codiceValido), [codiceValido, versione]);
  const comuni = useMemo(() => stratagemmiComuni(), [versione]);
  const regoleUnita = useMemo(() => abilitaBase(), [versione]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const haCapitoli = codiceValido === FAZIONE_CON_CAPITOLI;
  const sottofazione = haCapitoli ? selezione.sottofazione : '';
  const distaccamenti = sottofazione
    ? tuttiDistaccamenti.filter((d) => !capitoloDistaccamento(d.id) || capitoloDistaccamento(d.id) === sottofazione)
    : tuttiDistaccamenti;

  const scelti = distaccamenti.filter((d) => selezione.distaccamenti.includes(d.id));
  const dpUsati = scelti.reduce((somma, d) => somma + d.dp, 0);
  const capitoloScelto = scelti.map((d) => capitoloDistaccamento(d.id)).find(Boolean) ?? '';

  // Unione delle disposizioni di forze permesse dai distaccamenti scelti; nessun distaccamento = nessun vincolo.
  const disposizioniConsentite =
    scelti.length === 0
      ? null
      : new Set(
          DISPOSIZIONI.filter((disp) =>
            scelti.some((d) => d.disposizione.trim().toLowerCase() === disp.nome.toLowerCase()),
          ).map((d) => d.id),
        );

  const stratagemmi = [
    ...scelti.flatMap((d) => contenutoDistaccamento(d.id).stratagemmi.map((s) => ({ ...s, origine: d.nome }))),
    ...comuni.map((s) => ({ ...s, origine: 'Core' })),
  ];
  const stratagemmiVisibili = stratagemmi.filter((s) => valeInFase(s, faseFiltro));

  const errore = erroreCaricamento();

  function impostaFazione(fazione) {
    setSelezione({ fazione, sottofazione: '', distaccamenti: [] });
  }
  function impostaSottofazione(sottofazione) {
    setSelezione((s) => ({ ...s, sottofazione, distaccamenti: [] }));
  }
  function impostaDistaccamento(id, scelto) {
    setSelezione((s) => ({
      ...s,
      distaccamenti: scelto ? [...s.distaccamenti, id] : s.distaccamenti.filter((x) => x !== id),
    }));
  }

  return (
    <div className={styles.contenuto}>
      <div className={styles.selettori}>
        <label>
          Fazione
          <select value={selezione.fazione} onChange={(e) => impostaFazione(e.target.value)}>
            <option value="">Scegli la fazione…</option>
            {fazioni.map((f) => (
              <option key={f.codice} value={f.codice}>
                {f.nome}
              </option>
            ))}
          </select>
        </label>
        {haCapitoli && (
          <label>
            Sottofazione
            <select value={selezione.sottofazione} onChange={(e) => impostaSottofazione(e.target.value)}>
              <option value="">Tutte</option>
              {CAPITOLI.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {fazioni.length === 0 && (
        <p className={styles.vuoto}>
          {datiCaricati() || errore
            ? 'Dati non raggiungibili: il sito del calcolatore non ha ancora i file di army_builder/ (distaccamenti, stratagemmi).'
            : 'Caricamento dati…'}
        </p>
      )}

      {codiceValido && (
        <>
          <div className={styles.disposizioni}>
            <h2>Disposizioni disponibili</h2>
            {disposizioniConsentite === null ? (
              <p className={styles.vuoto}>Nessun distaccamento scelto: nessun vincolo, tutte le disposizioni sono possibili.</p>
            ) : disposizioniConsentite.size === 0 ? (
              <p className={styles.vuoto}>Nessuna disposizione trovata per i distaccamenti scelti.</p>
            ) : (
              <ul className={styles.listaChip}>
                {DISPOSIZIONI.filter((d) => disposizioniConsentite.has(d.id)).map((d) => (
                  <li key={d.id} className={styles.chipDisposizione}>
                    {d.nome}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Sezione titolo="Abilità d'esercito" conteggio={abilita.length}>
            {abilita.length === 0 && <p className={styles.vuoto}>Nessuna abilità d'esercito nei dati.</p>}
            {abilita.map((a) => (
              <Regola key={a.nome} nome={a.nome} descrizione={a.descrizione} />
            ))}
          </Sezione>

          <Sezione titolo="Distaccamenti" aperta conteggio={`${dpUsati}/${LIMITE_DP} DP`}>
            {distaccamenti.length === 0 && <p className={styles.vuoto}>Nessun distaccamento nei dati.</p>}
            <ul className={styles.elencoDistaccamenti}>
              {distaccamenti.map((d) => {
                const scelto = selezione.distaccamenti.includes(d.id);
                const altroCapitolo = !scelto && Boolean(capitoloScelto) && Boolean(capitoloDistaccamento(d.id)) && capitoloDistaccamento(d.id) !== capitoloScelto;
                const nonCiStaPiu = !scelto && dpUsati + d.dp > LIMITE_DP;
                const nonSelezionabile = nonCiStaPiu || altroCapitolo;
                return (
                  <li key={d.id} className={nonSelezionabile ? styles.nonDisponibile : ''}>
                    <label
                      title={
                        altroCapitolo
                          ? `Hai già scelto un distaccamento dei ${capitoloScelto}`
                          : nonCiStaPiu
                            ? `Servono ${d.dp} DP, ne restano ${LIMITE_DP - dpUsati}`
                            : ''
                      }
                    >
                      <input
                        type="checkbox"
                        checked={scelto}
                        disabled={nonSelezionabile}
                        onChange={(e) => impostaDistaccamento(d.id, e.target.checked)}
                      />
                      <span className={styles.nomeDistaccamento}>
                        {d.nome}
                        <Capitolo id={d.id} />
                      </span>
                      <span className={styles.chip}>{d.dp} DP</span>
                      {d.disposizione && <span className={styles.disposizione}>{d.disposizione}</span>}
                    </label>
                  </li>
                );
              })}
            </ul>
          </Sezione>

          {scelti.length > 0 && (
            <>
              <Sezione titolo="Bonus distaccamento" conteggio={scelti.length}>
                {scelti.map((d) => (
                  <BoxDistaccamento key={d.id} distaccamento={d}>
                    {contenutoDistaccamento(d.id).regole.length === 0 && <p className={styles.vuoto}>Nessuna regola nei dati.</p>}
                    {contenutoDistaccamento(d.id).regole.map((r) => (
                      <Regola key={r.id} nome={r.nome} descrizione={r.descrizione} aperta />
                    ))}
                  </BoxDistaccamento>
                ))}
              </Sezione>

              <Sezione titolo="Potenziamenti" conteggio={scelti.reduce((n, d) => n + contenutoDistaccamento(d.id).potenziamenti.length, 0)}>
                {scelti.map((d) => {
                  const potenziamenti = contenutoDistaccamento(d.id).potenziamenti;
                  return (
                    <BoxDistaccamento key={d.id} distaccamento={d}>
                      {potenziamenti.length === 0 && <p className={styles.vuoto}>Nessun potenziamento nei dati.</p>}
                      {potenziamenti.map((p) => (
                        <Potenziamento key={p.id} potenziamento={p} />
                      ))}
                    </BoxDistaccamento>
                  );
                })}
              </Sezione>
            </>
          )}
        </>
      )}

      {stratagemmi.length > 0 && (
        <Sezione
          titolo="Stratagemmi"
          conteggio={faseFiltro === 'tutto' ? stratagemmi.length : `${stratagemmiVisibili.length}/${stratagemmi.length}`}
        >
          <div className={styles.filtroFasi} role="group" aria-label="Fase di attivazione">
            <button
              type="button"
              className={`${styles.filtroFase} ${faseFiltro === 'tutto' ? styles.filtroFaseAttivo : ''}`}
              aria-pressed={faseFiltro === 'tutto'}
              onClick={() => setFaseFiltro('tutto')}
            >
              Tutto
            </button>
            {FASI.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`${styles.filtroFase} ${faseFiltro === f.id ? styles.filtroFaseAttivo : ''}`}
                aria-pressed={faseFiltro === f.id}
                title={`Stratagemmi usabili in fase ${f.nome.toLowerCase()} (compresi quelli di qualsiasi fase)`}
                onClick={() => setFaseFiltro(f.id)}
              >
                <span aria-hidden="true">{f.simbolo}</span> {f.nome}
              </button>
            ))}
          </div>
          <div className={styles.legendaTurni}>
            <span><i className={`${styles.pallino} ${styles.colore_blu}`} /> tuo turno</span>
            <span><i className={`${styles.pallino} ${styles.colore_rosso}`} /> turno avversario</span>
            <span><i className={`${styles.pallino} ${styles.colore_verde}`} /> qualsiasi</span>
          </div>
          {stratagemmiVisibili.length === 0 && <p className={styles.vuoto}>Nessuno stratagemma per questa fase.</p>}
          {stratagemmiVisibili.map((s) => (
            <Stratagemma key={s.id} stratagemma={s} origine={s.origine} />
          ))}
        </Sezione>
      )}

      <Sezione titolo="Regole" conteggio={REGOLE_ARMI.length + regoleUnita.length + REGOLE_TERRENO.length}>
        <Sezione titolo="Armi" conteggio={REGOLE_ARMI.length}>
          {REGOLE_ARMI.map((r) => (
            <VoceGlossario key={r.nome} nome={r.nome} descrizione={r.descrizione} link={r.ancora ? `${URL_REGOLE}#${r.ancora}` : undefined} />
          ))}
        </Sezione>

        <Sezione titolo="Unità" conteggio={regoleUnita.length}>
          {regoleUnita.map((a) => (
            <Regola key={a.nome} nome={a.nome} descrizione={a.descrizione} />
          ))}
        </Sezione>

        <Sezione titolo="Terreno e altre parole chiave" conteggio={REGOLE_TERRENO.length}>
          {REGOLE_TERRENO.map((r) => (
            <VoceGlossario key={r.nome} nome={r.nome} descrizione={r.descrizione} link={r.ancora ? `${URL_REGOLE}#${r.ancora}` : undefined} />
          ))}
        </Sezione>
      </Sezione>
    </div>
  );
}

// Capitolo degli Space Marines a cui appartiene il distaccamento, tra parentesi e in piccolo (nulla per gli altri).
function Capitolo({ id }) {
  const capitolo = capitoloDistaccamento(id);
  return capitolo ? <small className={styles.capitolo}> ({capitolo})</small> : null;
}

// Riquadro di un distaccamento scelto (nome e DP in testa) con il suo contenuto dentro uno dei tre gruppi.
function BoxDistaccamento({ distaccamento, children }) {
  return (
    <section className={styles.distaccamento}>
      <h3>
        <span>
          {distaccamento.nome}
          <Capitolo id={distaccamento.id} />
        </span>{' '}
        <span className={styles.chip}>{distaccamento.dp} DP</span>
      </h3>
      {children}
    </section>
  );
}

export default Detach;
