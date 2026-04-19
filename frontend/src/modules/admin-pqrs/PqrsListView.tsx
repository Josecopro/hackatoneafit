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
  if (status === 'Radicada') return `${styles.adminViews__badge} ${styles.adminViews__statusRadicada}`;
  if (status === 'En revision') return `${styles.adminViews__badge} ${styles.adminViews__statusEnRevision}`;
  return `${styles.adminViews__badge} ${styles.adminViews__statusRespondida}`;
}

export default function PqrsListView({ records }: PqrsListViewProps) {
  const router = useRouter();
  const goToReply = (id: string) => {
    if (!id) return;
    router.push(`/administracion/pqrs/${encodeURIComponent(id)}/responder`);
  };

  return (
    <main className={styles.adminViews__shell}>
      <div className={styles.adminViews__container}>
        <div className={styles.adminViews__topBar}>
          <span className={styles.adminViews__brand}>Administracion PQRSD</span>
          <Link className={styles.adminViews__topLink} href="/api/admin/auth/logout">
            Cerrar sesion
          </Link>
        </div>

        <section className={styles.adminViews__card}>
          <header className={styles.adminViews__listHeader}>
            <h1 className={styles.adminViews__title}>Listado de PQRSD</h1>
            <p className={styles.adminViews__metaLine}>
              Orden actual: priorizado por dias habiles transcurridos y nivel de sentimiento para atencion operativa.
            </p>
          </header>

          {records.length === 0 ? (
            <p className={styles.adminViews__emptyState}>No hay registros para mostrar.</p>
          ) : (
            <div className={styles.adminViews__tableWrap}>
              <table className={styles.adminViews__table}>
                <thead>
                  <tr>
                    <th>Fecha radicacion</th>
                    <th>Ticket</th>
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
                      <td>{formatDate(record.createdAt)}</td>
                      <td>{record.ticket}</td>
                      <td className={styles.adminViews__subjectCell}>
                        <span className={styles.adminViews__subjectText} title={record.subject}>
                          {record.subject}
                        </span>
                      </td>
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
                          className={styles.adminViews__linkButton}
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
