import Link from 'next/link';
import styles from './AdminViews.module.scss';
import { formatDate, getPqrsOldestFirst } from './utils';

function statusClass(status: string): string {
  if (status === 'Radicada') return `${styles.badge} ${styles.statusRadicada}`;
  if (status === 'En revision') return `${styles.badge} ${styles.statusEnRevision}`;
  return `${styles.badge} ${styles.statusRespondida}`;
}

export default function PqrsListView() {
  const pqrs = getPqrsOldestFirst();

  return (
    <main className={styles.shell}>
      <div className={styles.container}>
        <div className={styles.topBar}>
          <span className={styles.brand}>Administracion PQRSD</span>
          <Link className={styles.topLink} href="/administracion/login">
            Cerrar sesion
          </Link>
        </div>

        <section className={styles.card}>
          <header className={styles.listHeader}>
            <h1 className={styles.title}>Listado de PQRSD</h1>
            <p className={styles.metaLine}>
              Orden actual: de la mas antigua a la mas reciente. En la siguiente fase se agrega segmentacion por dependencia.
            </p>
          </header>

          {pqrs.length === 0 ? (
            <p className={styles.emptyState}>No hay registros para mostrar.</p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Ticket</th>
                    <th>Fecha radicacion</th>
                    <th>Ciudadano</th>
                    <th>Asunto</th>
                    <th>Dirigido a</th>
                    <th>Estado</th>
                    <th>Accion</th>
                  </tr>
                </thead>
                <tbody>
                  {pqrs.map((record) => (
                    <tr key={record.id}>
                      <td>{record.ticket}</td>
                      <td>{formatDate(record.createdAt)}</td>
                      <td>{record.citizenName}</td>
                      <td>{record.subject}</td>
                      <td>{record.directedTo}</td>
                      <td>
                        <span className={statusClass(record.status)}>{record.status}</span>
                      </td>
                      <td>
                        <Link className={styles.linkButton} href={`/administracion/pqrs/${record.id}/responder`}>
                          Responder
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
