"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './AdminViews.module.scss';
import { formatDate, sendOfficialResponse } from './utils';
import type { PqrsRecord } from './types';

type PqrsReplyViewProps = {
  record: PqrsRecord;
};

export default function PqrsReplyView({ record }: PqrsReplyViewProps) {
  const router = useRouter();
  const initialOfficialReply = useMemo(() => {
    const draft = (record.draftResponse || '').trim();
    if (draft) {
      return draft;
    }

    const summary = record.description?.trim() || record.subject;
    return [
      `Radicado ${record.ticket}`,
      '',
      'Respuesta oficial en construccion (borrador inicial):',
      summary,
      '',
      'Este contenido requiere validacion humana antes del envio.',
    ].join('\n');
  }, [record.description, record.draftResponse, record.subject, record.ticket]);

  const [officialReply, setOfficialReply] = useState(initialOfficialReply);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSubmitted) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      router.push('/administracion/pqrs');
    }, 1800);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isSubmitted, router]);

  if (isSubmitted) {
    return (
      <main className={styles.shell}>
        <div className={styles.container}>
          <section className={`${styles.card} ${styles.loginCard}`}>
            <h1 className={styles.title}>Respuesta enviada</h1>
            <p className={styles.subtitle}>
              La respuesta oficial del radicado {record.ticket} fue enviada correctamente al correo registrado del ciudadano.
            </p>
            <p className={styles.helperText}>Seras redirigido al listado en unos segundos...</p>
            <div className={styles.actions}>
              <button
                className={styles.primaryButton}
                type="button"
                onClick={() => router.push('/administracion/pqrs')}
              >
                Volver ahora al listado
              </button>
            </div>
          </section>
        </div>
      </main>
    );
  }

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
              Esta respuesta se genera como borrador y requiere validacion humana obligatoria antes del envio oficial.
            </p>
            <p className={styles.metaLine}>
              {record.reviewReason}
            </p>

            <form
              onSubmit={async (event) => {
                event.preventDefault();
                const trimmedReply = officialReply.trim();
                if (!trimmedReply) {
                  setSubmitError('La respuesta oficial no puede estar vacia.');
                  return;
                }

                setSubmitError(null);
                setIsSubmitting(true);

                try {
                  await sendOfficialResponse(record.id, trimmedReply);
                  setIsSubmitted(true);
                } catch (error) {
                  setSubmitError(error instanceof Error ? error.message : 'No fue posible enviar la respuesta. Intenta nuevamente.');
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              <label className={styles.label} htmlFor="response-message">
                Respuesta oficial
              </label>
              <textarea
                className={styles.textarea}
                id="response-message"
                placeholder="Escribe aqui la respuesta al ciudadano..."
                value={officialReply}
                onChange={(event) => setOfficialReply(event.target.value)}
              />

              {submitError ? <p className={styles.helperText}>{submitError}</p> : null}

              <div className={styles.actions}>
                <button className={styles.primaryButton} type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Enviando...' : 'Enviar respuesta'}
                </button>
              </div>
            </form>
          </article>
        </section>
      </div>
    </main>
  );
}
