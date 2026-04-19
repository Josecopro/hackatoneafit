"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ExternalLink, Loader2, Send } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { normalSchema } from '@/schema';
import { DOC_OPTIONS_BY_PERSON, GENDER_OPTIONS, PERSON_OPTIONS } from '@/constants/formOptions';
import {
  AttachmentPicker,
  AttachmentRules,
  InputField,
  StepCard,
  SuccessView,
  TextareaField,
} from '@/components/forms/sharedFields';
import styles from '@/App.module.scss';

const NORMAL_PREFILL_STORAGE_KEY = 'pqrs_normal_prefill';

export default function NormalPqrsForm() {
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

  useEffect(() => {
    try {
      const rawPrefill = sessionStorage.getItem(NORMAL_PREFILL_STORAGE_KEY);
      if (!rawPrefill) return;

      const parsed = JSON.parse(rawPrefill) as {
        doc_type?: string;
        doc_number?: string;
        email?: string;
        confirm_email?: string;
        accept_policy?: boolean;
      };

      setValue('doc_type', parsed.doc_type || '');
      setValue('doc_number', parsed.doc_number || '');
      setValue('email', parsed.email || '');
      setValue('confirm_email', parsed.confirm_email || '');
      setValue('accept_policy', Boolean(parsed.accept_policy));

      sessionStorage.removeItem(NORMAL_PREFILL_STORAGE_KEY);
    } catch {
      sessionStorage.removeItem(NORMAL_PREFILL_STORAGE_KEY);
    }
  }, [setValue]);

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

  const onInvalidSubmit = () => {
    setServerError('Hay campos obligatorios pendientes o con errores en el formulario.');
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
    <form onSubmit={handleSubmit(onSubmit, onInvalidSubmit)} className={`${styles.form} ${styles.fadeIn}`} noValidate>
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
            label="Correo electrónico"
            id="email"
            type="email"
            placeholder="correo@ejemplo.com"
            error={errors.email}
            {...register('email')}
          />

          <InputField
            label="Confirmar correo electrónico"
            id="confirm_email"
            type="email"
            placeholder="Repita su correo"
            error={errors.confirm_email}
            {...register('confirm_email')}
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
            <input type="checkbox" {...register('accept_policy')} className={styles.checkbox} />
            <span className={styles.verificationText}>
              Acepto la política de tratamiento de datos.{' '}
              <Link href="/politica-tratamiento-datos" target="_blank" rel="noopener noreferrer">
                Ver política
              </Link>
            </span>
          </label>
          {errors.accept_policy && <p className={styles.errorText}>{String(errors.accept_policy.message)}</p>}

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
}
