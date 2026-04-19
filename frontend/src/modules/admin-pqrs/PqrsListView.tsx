"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './AdminViews.module.scss';
import { formatDate } from './utils';
import type { PqrsRecord } from './types';

type PqrsListViewProps = {
  records: PqrsRecord[];
};

function statusClass(status: string): string {
  if (status === 'Radicada') return `${styles.badge} ${styles.statusRadicada}`;
  if (status === 'En revision') return `${styles.badge} ${styles.statusEnRevision}`;
  return `${styles.badge} ${styles.statusRespondida}`;
}

export default function PqrsListView({ records }: PqrsListViewProps) {
  const router = useRouter();
  const goToReply = (id: string) => {
    if (!id) return;
    router.push(`/administracion/pqrs/${encodeURIComponent(id)}/responder`);
  };

  return (
    <main className={styles.shell}>
      <div className={styles.container}>
        <div className={styles.topBar}>
          <span className={styles.brand}>Administracion PQRSD</span>
          <Link className={styles.topLink} href="/api/admin/auth/logout">
            Cerrar sesion
          </Link>
        </div>

        <section className={styles.card}>
          <header className={styles.listHeader}>
            <h1 className={styles.title}>Listado de PQRSD</h1>
            <p className={styles.metaLine}>
              Orden actual: priorizado por dias habiles transcurridos y nivel de sentimiento para atencion operativa.
            </p>
          </header>

          {records.length === 0 ? (
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
                    <th>Dias habiles</th>
                    <th>Estado</th>
                    <th>Accion</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr
                      key={record.id}
                      onClick={() => goToReply(record.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          goToReply(record.id);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`Abrir PQRS ${record.ticket}`}
                    >
                      <td>{record.ticket}</td>
                      <td>{formatDate(record.createdAt)}</td>
                      <td>{record.citizenName}</td>
                      <td>{record.subject}</td>
                      <td>{record.directedTo}</td>
                      <td>
                        {record.businessDaysElapsed}
                        /
                        {record.businessDaysLimit}
                      </td>
                      <td>
                        <span className={statusClass(record.status)}>{record.status}</span>
                      </td>
                      <td>
                        <Link
                          className={styles.linkButton}
                          href={`/administracion/pqrs/${encodeURIComponent(record.id)}/responder`}
                          onClick={(event) => event.stopPropagation()}
                        >
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
