"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, ExternalLink, Loader2, Send } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { anonymousSchema } from '@/schema';
import {
  AttachmentPicker,
  AttachmentRules,
  InputField,
  StepCard,
  SuccessView,
  TextareaField,
} from '@/components/forms/sharedFields';
import { getBackendUrl } from '@/lib/backendUrl';
import styles from '@/App.module.scss';

export default function AnonymousPqrsForm() {
  const router = useRouter();
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

      const backendUrl = getBackendUrl();
      const res = await fetch(`${backendUrl}/api/pqrsd/anonymous`, {
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
        onFinish={() => router.push('/')}
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
            label="Correo electrónico (opcional)"
            id="anon_email"
            type="email"
            placeholder="correo@ejemplo.com"
            error={errors.email}
            {...register('email')}
          />
          <InputField
            label="Teléfono (opcional)"
            id="anon_phone"
            placeholder="300 000 0000"
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
            helpertext="0 / 2000 caracteres"
            {...register('description')}
          />
        </div>

        <label className={styles.checkboxCard}>
          <input type="checkbox" {...register('authorize_information')} className={styles.checkbox} />
          <span className={styles.checkboxText}>Autorizo el uso de esta información para el cumplimiento de las obligaciones legales.</span>
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
            href="/ManualDiligenciamiento.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.attachmentLink}
          >
            Abrir manual de diligenciamiento (PDF)
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
}
