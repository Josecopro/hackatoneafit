import Link from 'next/link';
import styles from './AdminViews.module.scss';
import { formatDate } from './utils';
import type { PqrsRecord } from './types';

type PqrsReplyViewProps = {
  record: PqrsRecord;
};

export default function PqrsReplyView({ record }: PqrsReplyViewProps) {
  return (
    <main className={styles.shell}>
      <div className={styles.container}>
        <div className={styles.topBar}>
          <span className={styles.brand}>Administracion PQRSD</span>
          <Link className={styles.topLink} href="/administracion/pqrs">
            Volver al listado
          </Link>
        </div>

        <section className={styles.replyGrid}>
          <article className={`${styles.card} ${styles.infoCard}`}>
            <h1 className={styles.infoTitle}>Detalle de la PQRSD</h1>
            <p className={styles.infoRow}>
              <strong>Ticket:</strong> {record.ticket}
            </p>
            <p className={styles.infoRow}>
              <strong>Fecha de radicacion:</strong> {formatDate(record.createdAt)}
            </p>
            <p className={styles.infoRow}>
              <strong>Ciudadano:</strong> {record.citizenName}
            </p>
            <p className={styles.infoRow}>
              <strong>Dirigido a:</strong> {record.directedTo}
            </p>
            <p className={styles.infoRow}>
              <strong>Asunto:</strong> {record.subject}
            </p>
            <p className={styles.infoRow}>
              <strong>Descripcion:</strong> {record.description}
            </p>
          </article>

          <article className={`${styles.card} ${styles.responseCard}`}>
            <h2 className={styles.infoTitle}>Redactar respuesta</h2>
            <p className={styles.metaLine}>
              Esta pantalla deja listo el flujo de respuesta. La logica de guardado se conecta en la siguiente fase.
            </p>

            <form>
              <label className={styles.label} htmlFor="response-message">
                Respuesta oficial
              </label>
              <textarea
                className={styles.textarea}
                id="response-message"
                placeholder="Escribe aqui la respuesta al ciudadano..."
              />

              <div className={styles.actions}>
                <button className={styles.primaryButton} type="submit">
                  Enviar respuesta
                </button>
              </div>
            </form>
          </article>
        </section>
      </div>
    </main>
  );
}
