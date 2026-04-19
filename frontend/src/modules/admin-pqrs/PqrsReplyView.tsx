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
      <main className={styles.adminViews__shell}>
        <div className={styles.adminViews__container}>
          <section className={`${styles.adminViews__card} ${styles.adminViews__loginCard}`}>
            <h1 className={styles.adminViews__title}>Respuesta enviada</h1>
            <p className={styles.adminViews__subtitle}>
              La respuesta oficial del radicado {record.ticket} fue enviada correctamente al correo registrado del ciudadano.
            </p>
            <p className={styles.adminViews__helperText}>Seras redirigido al listado en unos segundos...</p>
            <div className={styles.adminViews__actions}>
              <button
                className={styles.adminViews__primaryButton}
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
    <main className={styles.adminViews__shell}>
      <div className={styles.adminViews__container}>
        <div className={styles.adminViews__topBar}>
          <span className={styles.adminViews__brand}>Administracion PQRSD</span>
          <Link className={styles.adminViews__topLink} href="/administracion/pqrs">
            Volver al listado
          </Link>
        </div>

        <section className={styles.adminViews__replyGrid}>
          <article className={`${styles.adminViews__card} ${styles.adminViews__infoCard}`}>
            <h1 className={styles.adminViews__infoTitle}>Detalle de la PQRSD</h1>
            <p className={styles.adminViews__infoRow}>
              <strong>Ticket:</strong> {record.ticket}
            </p>
            <p className={styles.adminViews__infoRow}>
              <strong>Fecha de radicacion:</strong> {formatDate(record.createdAt)}
            </p>
            <p className={styles.adminViews__infoRow}>
              <strong>Ciudadano:</strong> {record.citizenName}
            </p>
            <p className={styles.adminViews__infoRow}>
              <strong>Dirigido a:</strong> {record.directedTo}
            </p>
            <p className={styles.adminViews__infoRow}>
              <strong>Asunto:</strong> {record.subject}
            </p>
            <p className={styles.adminViews__infoRow}>
              <strong>Descripcion:</strong> {record.description}
            </p>
          </article>

          <article className={`${styles.adminViews__card} ${styles.adminViews__responseCard}`}>
            <h2 className={styles.adminViews__infoTitle}>Redactar respuesta</h2>
            <p className={styles.adminViews__metaLine}>
              Esta respuesta se genera como borrador y requiere validacion humana obligatoria antes del envio oficial.
            </p>
            <p className={styles.adminViews__metaLine}>
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
              <label className={styles.adminViews__label} htmlFor="response-message">
                Respuesta oficial
              </label>
              <textarea
                className={styles.adminViews__textarea}
                id="response-message"
                placeholder="Escribe aqui la respuesta al ciudadano..."
                value={officialReply}
                onChange={(event) => setOfficialReply(event.target.value)}
              />

              {submitError ? <p className={styles.adminViews__helperText}>{submitError}</p> : null}

              <div className={styles.adminViews__actions}>
                <button className={styles.adminViews__primaryButton} type="submit" disabled={isSubmitting}>
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
