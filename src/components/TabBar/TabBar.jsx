import styles from './TabBar.module.css';

// Barra dei tab, generica: non conosce il contenuto di ogni tab (solo id/etichetta), così aggiungere
// un nuovo tab in App.jsx basta ad aggiungerlo qui.
function TabBar({ tabs, attivo, onCambia }) {
  return (
    <nav className={styles.barra} role="tablist" aria-label="Sezioni">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={t.id === attivo}
          className={`${styles.tab} ${t.id === attivo ? styles.tabAttiva : ''}`}
          onClick={() => onCambia(t.id)}
        >
          {t.etichetta}
        </button>
      ))}
    </nav>
  );
}

export default TabBar;
