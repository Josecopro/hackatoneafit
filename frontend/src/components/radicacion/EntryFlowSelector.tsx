"use client";

import { useRouter } from 'next/navigation';
import { Building2, Landmark, Lock } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { InputField, StepCard } from '@/components/forms/sharedFields';
import styles from './EntryFlowSelector.module.scss';

const NORMAL_PREFILL_STORAGE_KEY = 'pqrs_normal_prefill';

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

  return (
    <main className={`${styles.page}`}>
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
                  const formData = new FormData(event.currentTarget);

                  saveNormalPrefill({
                    doc_type: String(formData.get('entry_doc_type') || ''),
                    doc_number: String(formData.get('entry_doc_number') || ''),
                    email: String(formData.get('entry_email') || ''),
                    confirm_email: String(formData.get('entry_confirm_email') || ''),
                    accept_policy: formData.get('entry_accept_policy') === 'on',
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
