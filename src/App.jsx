import { useState } from 'react';
import TabBar from './components/TabBar/TabBar';
import Detach from './components/Detach/Detach';
import styles from './App.module.css';

// Elenco dei tab della pagina: per aggiungerne uno nuovo basta un'altra voce qui (id, etichetta,
// componente), TabBar e App non conoscono altro.
const TABS = [{ id: 'detach', etichetta: 'Detach', Componente: Detach }];

function App() {
  const [attivo, setAttivo] = useState(TABS[0].id);
  const tab = TABS.find((t) => t.id === attivo) ?? TABS[0];
  const Contenuto = tab.Componente;

  return (
    <div className={styles.app}>
      <h1 className={styles.titolo}>WH40 Tool</h1>
      <TabBar tabs={TABS} attivo={attivo} onCambia={setAttivo} />
      <main className={styles.corpo}>
        <Contenuto />
      </main>
    </div>
  );
}

export default App;
