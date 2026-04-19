"use client";

import { useRouter } from 'next/navigation';
import { Building2, Landmark, Lock } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { InputField, StepCard } from '@/components/forms/sharedFields';
import styles from './EntryFlowSelector.module.scss';

const NORMAL_PREFILL_STORAGE_KEY = 'pqrs_normal_prefill';
const ENTRY_SUGGESTION_POPUP_DISMISSED_KEY = 'entry_suggestion_popup_dismissed';

type NormalEntryPrefill = {
  doc_type: string;
  doc_number: string;
  email: string;
  confirm_email: string;
  accept_policy: boolean;
};

export default function EntryFlowSelector() {
  const router = useRouter();
  const [showNormalReqForm, setShowNormalReqForm] = useState(false);
  const [showSuggestionPopup, setShowSuggestionPopup] = useState(false);
  const [entryError, setEntryError] = useState('');

  useEffect(() => {
    try {
      const alreadyDismissed = sessionStorage.getItem(ENTRY_SUGGESTION_POPUP_DISMISSED_KEY) === '1';
      if (alreadyDismissed) return;
    } catch {
      // Ignore storage read errors and fallback to showing popup.
    }

    const timer = window.setTimeout(() => {
      setShowSuggestionPopup(true);
    }, 2400);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const goToAnonymousFlow = () => {
    router.push('/radicacion/anonima');
  };

  const goToNormalFlow = () => {
    router.push('/radicacion/normal');
  };

  const saveNormalPrefill = (payload: NormalEntryPrefill) => {
    try {
      sessionStorage.setItem(NORMAL_PREFILL_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage write errors and continue to keep navigation functional.
    }
  };

  const openNormalReqForm = () => {
    setShowNormalReqForm(true);
  };

  const closeSuggestionPopup = () => {
    setShowSuggestionPopup(false);
    try {
      sessionStorage.setItem(ENTRY_SUGGESTION_POPUP_DISMISSED_KEY, '1');
    } catch {
      // Ignore storage write errors.
    }
  };

  return (
    <main className={`${styles.page}`}>
      {showSuggestionPopup && (
        <div className={styles.popupOverlay} role="dialog" aria-modal="true" aria-label="Sugerencia de búsqueda rápida">
          <div className={styles.popupCard}>
            <button
              type="button"
              aria-label="Cerrar sugerencia"
              className={styles.popupDismissBtn}
              onClick={closeSuggestionPopup}
            >
              X
            </button>
            <h3 className={styles.popupTitle}>Puede que tu pregunta ya la hayan respondido</h3>
            <p className={styles.popupText}>
              Escribe una breve descripción de tu duda o consulta y te mostraremos información relevante que ya esté disponible en nuestro portal.
            </p>
            <input
              type="text"
              className={styles.popupInput}
              placeholder="Ejemplo: ¿Cómo puedo cambiar mi dirección de residencia?"
            />
            <div className={styles.popupActions}>
              <button
                type="button"
                className={styles.popupCloseBtn}
                onClick={closeSuggestionPopup}
              >
                Consultar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={`${styles.title} font-display`}>PQRSD Alcaldía de Medellín</h1>
          <div className={styles.description}>
            <p className={styles.bigText}>
              En esta opción podrás radicar peticiones, quejas, reclamos, sugerencias o denuncias por actos de corrupción dirigidas al Distrito Especial de Ciencia, Tecnología e Innovación de Medellín.
            </p>
            <div>
              <p className={styles.noteTitle}>Ten en cuenta que:</p>
              <ul className={styles.noteList}>
                <li>Las PQRSD tienen términos legales de respuesta, según la Ley 1755 de 2015.</li>
                <li>Cada solicitud se registra, gestiona y debe recibir una respuesta oportuna, clara, precisa, suficiente y efectiva.</li>
                <li>Presentar una PQRSD es un derecho fundamental de todos los ciudadanos.</li>
              </ul>
            </div>
            <p className={styles.strongText}>Elige la opción de tu interés</p>
          </div>
        </header>

        <section className={styles.cards}>
          <button
            type="button"
            onClick={openNormalReqForm}
            className={styles.card}
          >
            <h2 className={`${styles.cardTitle} font-display`}>Radicacion de PQRS</h2>
 
            <span className={`${styles.cardCta} ${styles.cardCtaNormal}`}>
              Radicacion de PQRS
            </span>
          </button>

          <button
            type="button"
            onClick={goToAnonymousFlow}
            className={styles.card}
          >
            <h2 className={`${styles.cardTitle} font-display`}>Radicacion de PQRS anonimas</h2>

            <span className={`${styles.cardCta} ${styles.cardCtaAnon}`}>
              Radicacion de PQRS anonimas
            </span>
          </button>
        </section>

        {showNormalReqForm && (
          <div className={`${styles.reqFormWrap} animate-fade-in`}>
            <StepCard
              stepNumber="1"
              title="REQ persona normal"
              subtitle="Para iniciar el requisito diligencie identificación, correo y aceptación de política"
            >
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  setEntryError('');

                  const form = event.currentTarget;
                  const formData = new FormData(form);

                  const docType = String(formData.get('entry_doc_type') || '').trim();
                  const docNumber = String(formData.get('entry_doc_number') || '').trim();
                  const email = String(formData.get('entry_email') || '').trim();
                  const confirmEmail = String(formData.get('entry_confirm_email') || '').trim();
                  const acceptPolicy = formData.get('entry_accept_policy') === 'on';

                  if (email !== confirmEmail) {
                    setEntryError('Los correos no coinciden. Verifica e intenta nuevamente.');
                    return;
                  }

                  saveNormalPrefill({
                    doc_type: docType,
                    doc_number: docNumber,
                    email,
                    confirm_email: confirmEmail,
                    accept_policy: acceptPolicy,
                  });

                  goToNormalFlow();
                }}
                className={styles.reqForm}
              >
                <div className={styles.reqGrid}>
                  <InputField
                    id="entry_doc_type"
                    name="entry_doc_type"
                    label="Tipo de documento"
                    type="select"
                    options={[
                      { label: 'Cédula de ciudadanía', value: 'cc' },
                      { label: 'Cédula de extranjería', value: 'ce' },
                      { label: 'Tarjeta de identidad', value: 'ti' },
                      { label: 'Pasaporte', value: 'pa' },
                      { label: 'NIT', value: 'nit' },
                    ]}
                    required
                  />
                  <InputField
                    id="entry_doc_number"
                    name="entry_doc_number"
                    label="Número de documento"
                    placeholder="Ingrese su número de documento"
                    required
                  />
                  <InputField
                    id="entry_email"
                    name="entry_email"
                    label="Correo electrónico"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    required
                  />
                  <InputField
                    id="entry_confirm_email"
                    name="entry_confirm_email"
                    label="Confirmar correo electrónico"
                    type="email"
                    placeholder="Repita su correo"
                    required
                  />
                </div>

                <div className={styles.policyBox}>
                  <label className={styles.policyLabel}>
                    <input
                      type="checkbox"
                      name="entry_accept_policy"
                      required
                      className={styles.policyCheckbox}
                    />
                    <span className={styles.policyText}>
                      Acepto los términos, condiciones y políticas de privacidad de la
                      {' '}
                      <Link
                        href="/politica-tratamiento-datos"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.policyLink}
                      >
                      política de tratamiento de datos
                      </Link>
                    </span>
                  </label>
                </div>

                {entryError && <p className={styles.formError}>{entryError}</p>}

                <div className={styles.actions}>
                  <button
                    type="submit"
                    className={styles.submitBtn}
                  >
                    Continuar con Radicacion de pQRS
                  </button>
                </div>
              </form>
            </StepCard>
          </div>
        )}
      </div>
    </main>
  );
}
