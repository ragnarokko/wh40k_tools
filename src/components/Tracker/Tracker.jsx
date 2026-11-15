import { useState } from 'react';
import { LIMITI_VP } from '../../config/missioni';
import { TrackerProvider, useTracker } from '../../contexts/TrackerContext';
import Modale from '../Modale/Modale';
import SchedaGiocatore, { NOME_GIOCATORE } from './SchedaGiocatore';
import SetupTracker from './SetupTracker';
import StatisticheTracker from './StatisticheTracker';
import styles from './Tracker.module.css';

// Tab "Tracker": traccia la partita Blu/Rosso con le missioni dell'11a edizione. Copiato e adattato
// da wargame_table (src/components/TrackerPartita/TrackerPartita.jsx): qui è un tab a sé invece di un
// pannello laterale, e non c'è la tabella degli obiettivi (TabellaObiettivi, serve le posizioni delle
// basette su un tavolo che qui non esiste). Stato in TrackerContext, con il proprio Provider.
function Tracker() {
  const { stato, avanzaTurno, tornaIndietro, nuovaPartita } = useTracker();
  const [confermaAperta, setConfermaAperta] = useState(false);
  const inPartita = stato.fase === 'partita';
  const ultimoTurno = stato.round === LIMITI_VP.round && stato.turnoDi !== stato.primo;

  return (
    <div className={styles.contenitore}>
      {!inPartita ? (
        <SetupTracker />
      ) : (
        <div className={styles.partita}>
          <div className={styles.turni}>
            <button type="button" className={styles.piccolo} onClick={tornaIndietro} title="Turno precedente">
              ◀
            </button>
            <div className={styles.turnoInfo}>
              <div className={styles.round}>
                Round {stato.round} <small>di {LIMITI_VP.round}</small>
              </div>
              <div className={styles.chiTocca}>
                {stato.finita ? 'Partita finita' : `Turno ${NOME_GIOCATORE[stato.turnoDi]}`}
              </div>
            </div>
            <button
              type="button"
              className={styles.piccolo}
              onClick={avanzaTurno}
              disabled={stato.finita}
              title={ultimoTurno ? 'Termina la partita' : 'Turno successivo'}
            >
              {ultimoTurno ? '🏁' : '▶'}
            </button>
          </div>
          <SchedaGiocatore giocatore="blu" />
          <SchedaGiocatore giocatore="rosso" />
          <StatisticheTracker />
          <button type="button" className={`${styles.secondario} ${styles.nuova}`} onClick={() => setConfermaAperta(true)}>
            Nuova partita
          </button>
          <Modale titolo="Nuova partita" aperto={confermaAperta} onChiudi={() => setConfermaAperta(false)}>
            <p className={styles.testoConferma}>Azzera il tracker: disposizioni, round e tutti i punti. Torna al setup.</p>
            <div className={styles.azioniDialogo}>
              <button
                type="button"
                onClick={() => {
                  nuovaPartita();
                  setConfermaAperta(false);
                }}
              >
                Azzera
              </button>
              <button type="button" className={styles.secondario} onClick={() => setConfermaAperta(false)}>
                Annulla
              </button>
            </div>
          </Modale>
        </div>
      )}
    </div>
  );
}

function TrackerTab() {
  return (
    <TrackerProvider>
      <Tracker />
    </TrackerProvider>
  );
}

export default TrackerTab;
