"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Building2,
  ExternalLink,
  Landmark,
  Loader2,
  Lock,
  Send,
  UserCircle,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { anonymousSchema, normalSchema } from './schema';
import { DOC_OPTIONS_BY_PERSON, GENDER_OPTIONS, PERSON_OPTIONS } from './constants/formOptions';
import {
  AttachmentPicker,
  AttachmentRules,
  InputField,
  StepCard,
  SuccessView,
  TextareaField,
} from './components/forms/sharedFields';
import styles from './App.module.scss';

type ViewMode = 'normal' | 'anon';

type AppProps = {
  initialView?: ViewMode;
  allowSwitch?: boolean;
};

const NormalPQRSD = () => {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [trackingId, setTrackingId] = useState('');
  const [serverError, setServerError] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentError, setAttachmentError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(normalSchema),
    defaultValues: {
      person_type: 'natural',
      doc_type: '',
      doc_number: '',
      email: '',
      confirm_email: '',
      accept_policy: false,
      full_name: '',
      gender: '',
      department: '',
      city: '',
      address: '',
      subject: '',
      phone: '',
      incident_address: '',
      preferential_attention: false,
      information_request: false,
      notifications: false,
      description: '',
      verification_check: false,
      accept_terms: false,
    },
  });

  const personType = watch('person_type');
  const docOptions = useMemo(() => DOC_OPTIONS_BY_PERSON[personType] || [], [personType]);
  const requiresDocument = docOptions.length > 0;

  useEffect(() => {
    if (!requiresDocument) {
      setValue('doc_type', '');
      setValue('doc_number', '');
      return;
    }

    if (personType === 'juridica') {
      setValue('doc_type', 'nit');
    }
  }, [personType, requiresDocument, setValue]);

  const onSubmit = async (data: any) => {
    setStatus('submitting');
    setServerError('');

    try {
      const payload = {
        ...data,
        attachments_count: attachments.length,
      };

      const formData = new FormData();
      formData.append('payload', JSON.stringify(payload));
      attachments.forEach((file) => {
        formData.append('attachments', file);
      });

      const res = await fetch('/api/pqrsd/normal', {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();

      if (result.success) {
        setTrackingId(result.trackingId);
        setStatus('success');
      } else {
        setStatus('idle');
        setServerError(result.errors?.[0]?.message || 'Error de validación en el servidor');
      }
    } catch (_error) {
      setStatus('idle');
      setServerError('Error de conexión con el servidor. Por favor, intente de nuevo.');
    }
  };

  if (status === 'success') {
    return (
      <SuccessView
        trackingId={trackingId}
        viewType="normal"
        resetForm={() => {
          reset();
          setAttachments([]);
          setAttachmentError('');
          setStatus('idle');
        }}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`${styles.form} ${styles.fadeIn}`} noValidate>
      {status === 'submitting' && (
        <div className={styles.overlay} aria-live="polite" aria-busy="true">
          <div className={styles.overlayCard}>
            <Loader2 className={`${styles.spinner} ${styles.spinnerNormal}`} size={32} />
            <p className={styles.overlayText}>Procesando solicitud...</p>
          </div>
        </div>
      )}

      {serverError && (
        <div className={styles.serverError} role="alert">
          <AlertTriangle className={styles.serverErrorIcon} size={20} />
          <div>
            <span className={styles.serverErrorTitle}>Error del Servidor</span>
            <span className={styles.serverErrorText}>{serverError}</span>
          </div>
        </div>
      )}

      <StepCard
        stepNumber="1"
        title="Formulario de PQRS - Radicación"
        subtitle="Complete los datos del solicitante y de los hechos"
      >
        <div className={styles.gridTwo}>
          <InputField
            label="Persona"
            id="person_type"
            type="select"
            options={PERSON_OPTIONS}
            error={errors.person_type}
            {...register('person_type')}
          />

          <InputField
            label="Tipo de documento"
            id="doc_type_main"
            type="select"
            options={docOptions}
            error={errors.doc_type}
            {...register('doc_type')}
            disabled={!requiresDocument}
          />

          <InputField
            label="Numero de documento"
            id="doc_number_main"
            error={errors.doc_number}
            {...register('doc_number')}
            disabled={!requiresDocument}
          />

          <InputField
            label="Nombres y apellidos"
            id="full_name"
            error={errors.full_name}
            {...register('full_name')}
          />

          <InputField
            label="Género"
            id="gender"
            type="select"
            options={GENDER_OPTIONS}
            error={errors.gender}
            {...register('gender')}
          />

          <InputField
            label="Departamento"
            id="department"
            error={errors.department}
            {...register('department')}
          />
          <InputField label="Ciudad" id="city" error={errors.city} {...register('city')} />
          <InputField label="Dirección" id="address" error={errors.address} {...register('address')} />
          <InputField label="Asunto" id="subject" error={errors.subject} {...register('subject')} />
          <InputField label="Teléfono" id="phone" error={errors.phone} {...register('phone')} />
          <InputField
            label="Dirección del hecho"
            id="incident_address"
            error={errors.incident_address}
            {...register('incident_address')}
          />
        </div>

        <div className={styles.checkboxStack}>
          <label className={styles.checkboxCard}>
            <input type="checkbox" {...register('preferential_attention')} className={styles.checkbox} />
            <span className={styles.checkboxText}>Atención preferencial</span>
          </label>

          <label className={styles.checkboxCard}>
            <input type="checkbox" {...register('information_request')} className={styles.checkbox} />
            <span className={styles.checkboxText}>Es solicitud de información</span>
          </label>

          <label className={styles.checkboxCard}>
            <input type="checkbox" {...register('notifications')} className={styles.checkbox} />
            <span className={styles.checkboxText}>Autoriza notificación por correo electrónico</span>
          </label>
        </div>

        <div className={styles.descriptionWrap}>
          <TextareaField
            label="Descripción"
            id="description"
            placeholder="Detalle los hechos de forma clara y concreta"
            rows={6}
            error={errors.description}
            {...register('description')}
          />
        </div>

        <div className={styles.verificationBox}>
          <label className={styles.checkboxCard}>
            <input type="checkbox" {...register('verification_check')} className={styles.checkbox} />
            <span className={styles.verificationText}>Campo de verificación</span>
          </label>
          {errors.verification_check && (
            <p className={styles.errorText}>{String(errors.verification_check.message)}</p>
          )}
        </div>
      </StepCard>

      <StepCard
        stepNumber="3"
        title="Nueva pestaña para documentos"
        subtitle="Adjunte documentos de soporte si lo requiere"
      >
        <div className={styles.attachmentLinkWrap}>
          <Link
            href="/documentos-anexos"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.attachmentLink}
          >
            Abrir guía de anexos en nueva pestaña
            <ExternalLink size={14} />
          </Link>
        </div>

        <AttachmentRules />

        <div className={styles.descriptionWrap}>
          <AttachmentPicker
            files={attachments}
            setFiles={setAttachments}
            fileError={attachmentError}
            setFileError={setAttachmentError}
            inputId="normal-attachments"
          />
        </div>
      </StepCard>

      <div className={`${styles.termsCard} ${errors.accept_terms ? styles.termsCardError : ''}`}>
        <label className={styles.termsLabel}>
          <input type="checkbox" {...register('accept_terms')} className={styles.termsCheckbox} />
          <span className={styles.termsText}>Se aceptan los términos y condiciones.</span>
        </label>

        {errors.accept_terms && <p className={styles.errorText}>{String(errors.accept_terms.message)}</p>}

        <div className={styles.actions}>
          <button type="submit" disabled={status === 'submitting'} className={styles.submitNormal}>
            {status === 'submitting' ? 'Procesando...' : 'Radicar PQRSD'}
            {status !== 'submitting' && <Send size={18} />}
          </button>
        </div>
      </div>
    </form>
  );
};

const AnonymousPQRSD = () => {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [trackingId, setTrackingId] = useState('');
  const [serverError, setServerError] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentError, setAttachmentError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(anonymousSchema),
    defaultValues: {
      email: '',
      phone: '',
      subject: '',
      description: '',
      incident_address: '',
      authorize_information: false,
      accept_terms: false,
    },
  });

  const onSubmit = async (data: any) => {
    setStatus('submitting');
    setServerError('');

    try {
      const payload = {
        ...data,
        attachments_count: attachments.length,
      };

      const formData = new FormData();
      formData.append('payload', JSON.stringify(payload));
      attachments.forEach((file) => {
        formData.append('attachments', file);
      });

      const res = await fetch('/api/pqrsd/anonymous', {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();

      if (result.success) {
        setTrackingId(result.trackingId);
        setStatus('success');
      } else {
        setStatus('idle');
        setServerError(result.errors?.[0]?.message || 'Error de validación en el servidor');
      }
    } catch (_error) {
      setStatus('idle');
      setServerError('Error de conexión con el servidor. Por favor, intente de nuevo.');
    }
  };

  if (status === 'success') {
    return (
      <SuccessView
        trackingId={trackingId}
        viewType="anon"
        resetForm={() => {
          reset();
          setAttachments([]);
          setAttachmentError('');
          setStatus('idle');
        }}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`${styles.form} ${styles.fadeIn}`} noValidate>
      {status === 'submitting' && (
        <div className={styles.overlay} aria-live="polite" aria-busy="true">
          <div className={styles.overlayCard}>
            <Loader2 className={`${styles.spinner} ${styles.spinnerAnon}`} size={32} />
            <p className={styles.overlayText}>Cifrando y enviando de forma segura...</p>
          </div>
        </div>
      )}

      {serverError && (
        <div className={styles.serverError} role="alert">
          <AlertTriangle className={styles.serverErrorIcon} size={20} />
          <div>
            <span className={styles.serverErrorTitle}>Error del Servidor</span>
            <span className={styles.serverErrorText}>{serverError}</span>
          </div>
        </div>
      )}

      <StepCard
        stepNumber="1"
        title="PQRSD anonimas"
        subtitle="Complete los campos mínimos para la radicación anónima"
      >
        <div className={styles.gridTwo}>
          <InputField
            label="Correo electrónico"
            id="anon_email"
            type="email"
            placeholder="Opcional"
            error={errors.email}
            {...register('email')}
          />
          <InputField
            label="Teléfono"
            id="anon_phone"
            placeholder="Opcional"
            error={errors.phone}
            {...register('phone')}
          />
          <InputField label="Asunto" id="anon_subject" error={errors.subject} {...register('subject')} />
          <InputField
            label="Dirección del hecho"
            id="anon_incident_address"
            error={errors.incident_address}
            {...register('incident_address')}
          />
        </div>

        <div className={styles.descriptionWrap}>
          <TextareaField
            label="Descripción"
            id="anon_description"
            placeholder="Describa de forma precisa los hechos"
            rows={6}
            error={errors.description}
            {...register('description')}
          />
        </div>

        <label className={styles.checkboxCard}>
          <input type="checkbox" {...register('authorize_information')} className={styles.checkbox} />
          <span className={styles.checkboxText}>Checkbox para autorizar la información</span>
        </label>
        {errors.authorize_information && (
          <p className={styles.errorText}>{String(errors.authorize_information.message)}</p>
        )}
      </StepCard>

      <StepCard
        stepNumber="2"
        title="Nueva pestaña para documentos"
        subtitle="Adjunte documentos de soporte si lo requiere"
      >
        <div className={styles.attachmentLinkWrap}>
          <Link
            href="/documentos-anexos"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.attachmentLink}
          >
            Abrir guía de anexos en nueva pestaña
            <ExternalLink size={14} />
          </Link>
        </div>

        <AttachmentRules />

        <div className={styles.descriptionWrap}>
          <AttachmentPicker
            files={attachments}
            setFiles={setAttachments}
            fileError={attachmentError}
            setFileError={setAttachmentError}
            inputId="anonymous-attachments"
          />
        </div>
      </StepCard>

      <div className={`${styles.termsCard} ${errors.accept_terms ? styles.termsCardError : ''}`}>
        <label className={styles.termsLabel}>
          <input type="checkbox" {...register('accept_terms')} className={styles.termsCheckbox} />
          <span className={styles.termsText}>Se aceptan los términos y condiciones.</span>
        </label>

        {errors.accept_terms && <p className={styles.errorText}>{String(errors.accept_terms.message)}</p>}

        <div className={styles.actions}>
          <button type="submit" disabled={status === 'submitting'} className={styles.submitAnon}>
            {status === 'submitting' ? 'Procesando...' : 'Radicar de forma Anónima'}
            {status !== 'submitting' && <Send size={18} />}
          </button>
        </div>
      </div>
    </form>
  );
};

export default function App({ initialView = 'normal', allowSwitch = true }: AppProps) {
  const [view, setView] = useState<ViewMode>(initialView);

  const heroTitle = view === 'normal' ? 'Radicación PQRSD con Identificación' : 'Radicación PQRSD Anónima';
  const heroDescription =
    view === 'normal'
      ? 'Flujo de persona normal con validaciones y aceptación de políticas en pestañas separadas.'
      : 'Canal reservado para denuncias y reportes preservando confidencialidad.';

  return (
    <div className={`${styles.appShell} page-backdrop`}>
      <a href="#main-content" className="skip-link">
        Saltar al contenido principal
      </a>


      <section className={styles.hero}>
        <div className={styles.heroOverlay}>
          <div className={styles.orbA} />
          <div className={styles.orbB} />
          <div className={`${styles.gridPattern} hero-grid-pattern`} />
        </div>

        <div className={styles.heroInner}>
          <div className={styles.heroBadge}>
            <span className={styles.heroDot} /> Plataforma oficial distrital
          </div>
          <div className={styles.heroGrid}>
            <div>
              <h2 className={styles.heroTitle}>{heroTitle}</h2>
              <p className={styles.heroDescription}>{heroDescription}</p>
            </div>
            <div className={styles.heroCard}>
              <p className={styles.heroCardTag}>Canal ciudadano</p>
              <p className={styles.heroCardTitle}>Atención 24/7</p>
              <p className={styles.heroCardText}>
                Su número de radicado queda disponible al finalizar el formulario.
              </p>
            </div>
          </div>
        </div>
      </section>

      <main id="main-content" className={styles.main}>
        {allowSwitch ? (
          <div role="tablist" aria-label="Tipo de radicación" className={styles.tabs}>
            <button
              onClick={() => setView('normal')}
              id="tab-normal"
              role="tab"
              aria-controls="panel-normal"
              aria-selected={view === 'normal'}
              className={`${styles.tabButton} ${view === 'normal' ? styles.tabNormalActive : styles.tabInactive}`}
            >
              <Building2 size={18} className={view === 'normal' ? styles.iconNormalActive : ''} />
              Persona normal
            </button>
            <button
              onClick={() => setView('anon')}
              id="tab-anon"
              role="tab"
              aria-controls="panel-anon"
              aria-selected={view === 'anon'}
              className={`${styles.tabButton} ${view === 'anon' ? styles.tabAnonActive : styles.tabInactive}`}
            >
              <Lock size={18} className={view === 'anon' ? styles.iconAnonActive : ''} />
              Anónima
            </button>
          </div>
        ) : (
          <div className={styles.backWrap}>
            <a href="/" className={styles.backLink}>
              Volver al selector de pantallas
            </a>
          </div>
        )}

        <section
          id={view === 'normal' ? 'panel-normal' : 'panel-anon'}
          role="tabpanel"
          aria-labelledby={view === 'normal' ? 'tab-normal' : 'tab-anon'}
        >
          {view === 'normal' ? <NormalPQRSD key="normal" /> : <AnonymousPQRSD key="anon" />}
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerIcon}>
            <Landmark size={28} />
          </div>
          <p className={styles.footerTitle}>Alcaldía de Medellín</p>
          <p className={styles.footerAddress}>Centro Administrativo Distrital (CAD) - Calle 44 N 52 - 165</p>
          <div className={styles.footerDivider} />
          <p className={styles.footerCopy}>
            &copy; {new Date().getFullYear()} Sistema PQRSD de la Alcaldía de Medellín. Todos los derechos
            reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
