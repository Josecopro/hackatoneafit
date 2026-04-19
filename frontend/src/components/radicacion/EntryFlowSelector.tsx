"use client";

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';

import { InputField, StepCard } from '@/components/forms/sharedFields';
import { getBackendUrl } from '@/lib/backendUrl';
import styles from './EntryFlowSelector.module.scss';

const NORMAL_PREFILL_STORAGE_KEY = 'pqrs_normal_prefill';
const ENTRY_QUERY_PREFILL_STORAGE_KEY = 'pqrs_entry_query_prefill';

type FlowTarget = 'normal' | 'anonymous';

type QuickSuggestion = {
  id: string;
  caso_tipo: string;
  respuesta_validada: string;
  similitud: number;
  departamento_nombre: string;
};

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
  const [pendingFlowTarget, setPendingFlowTarget] = useState<FlowTarget>('normal');
  const [queryText, setQueryText] = useState('');
  const [suggestions, setSuggestions] = useState<QuickSuggestion[]>([]);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  const [showDecisionActions, setShowDecisionActions] = useState(false);
  const [entryError, setEntryError] = useState('');
  const goToAnonymousFlow = () => {
    router.push('/radicacion/anonima');
  };

  const goToNormalFlow = () => {
    router.push('/radicacion/normal');
  };

  const openNormalReqForm = () => {
    setShowNormalReqForm(true);
  };

  const saveNormalPrefill = (payload: NormalEntryPrefill) => {
    try {
      sessionStorage.setItem(NORMAL_PREFILL_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage write errors and continue to keep navigation functional.
    }
  };

  const openSuggestionPopup = (flowTarget: FlowTarget) => {
    setPendingFlowTarget(flowTarget);
    setShowSuggestionPopup(true);
    setShowDecisionActions(false);
    setSuggestions([]);
    setQueryText('');
  };

  const saveQueryPrefill = (rawQuery: string) => {
    const normalized = rawQuery.trim();
    if (!normalized) return;

    const payload = {
      description: normalized,
    };

    try {
      sessionStorage.setItem(ENTRY_QUERY_PREFILL_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage write errors and continue to keep navigation functional.
    }
  };

  const continueToSelectedFlow = () => {
    saveQueryPrefill(queryText);
    setShowSuggestionPopup(false);
    setSuggestions([]);
    setShowDecisionActions(false);

    if (pendingFlowTarget === 'anonymous') {
      goToAnonymousFlow();
      return;
    }

    openNormalReqForm();
  };

  const searchQuickSuggestions = async () => {
    const text = queryText.trim();
    if (!text) {
      continueToSelectedFlow();
      return;
    }

    setIsSearchingSuggestions(true);
    setShowDecisionActions(false);

    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/pqrsd/quick-suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query_text: text,
          limit: 5,
        }),
      });

      if (!response.ok) {
        continueToSelectedFlow();
        return;
      }

      const json = await response.json();
      const rows = Array.isArray(json?.suggestions) ? (json.suggestions as QuickSuggestion[]) : [];
      setSuggestions(rows);
      if (rows.length > 0) {
        setShowDecisionActions(true);
      } else {
        continueToSelectedFlow();
      }
    } catch {
      continueToSelectedFlow();
    } finally {
      setIsSearchingSuggestions(false);
    }
  };

  const closeSuggestionPopup = () => {
    setShowSuggestionPopup(false);
    setSuggestions([]);
    setShowDecisionActions(false);
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
              value={queryText}
              onChange={(event) => setQueryText(event.target.value)}
            />

            {suggestions.length > 0 && (
              <div className={styles.popupSuggestionList}>
                {suggestions.map((item) => (
                  <article key={item.id} className={styles.popupSuggestionItem}>
                    <p className={styles.popupSuggestionCase}>{item.caso_tipo || 'Caso relacionado'}</p>
                    <p className={styles.popupSuggestionText}>{item.respuesta_validada}</p>
                  </article>
                ))}
              </div>
            )}

            <div className={styles.popupActions}>
              {showDecisionActions ? (
                <>
                  <button type="button" className={styles.popupCloseBtn} onClick={closeSuggestionPopup}>
                    Ya resolvi mi duda
                  </button>
                  <button type="button" className={styles.popupContinueBtn} onClick={continueToSelectedFlow}>
                    Seguir con la PQRS
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className={styles.popupContinueBtn}
                  onClick={searchQuickSuggestions}
                  disabled={isSearchingSuggestions}
                >
                  {isSearchingSuggestions ? 'Consultando...' : 'Continuar'}
                </button>
              )}
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
            onClick={() => openSuggestionPopup('normal')}
            className={styles.card}
          >
            <h2 className={`${styles.cardTitle} font-display`}>Radicacion de PQRS</h2>

            <span className={`${styles.cardCta} ${styles.cardCtaNormal}`}>
              Radicacion de PQRS
            </span>
          </button>

          <button
            type="button"
            onClick={() => openSuggestionPopup('anonymous')}
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
