"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Building2,
  CheckCircle,
  CloudUpload,
  ExternalLink,
  Landmark,
  Loader2,
  Lock,
  Send,
  ShieldCheck,
  UserCircle,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { anonymousSchema, normalSchema } from './schema';

type ViewMode = 'normal' | 'anon';

type AppProps = {
  initialView?: ViewMode;
  allowSwitch?: boolean;
};

type Option = {
  label: string;
  value: string;
};

const PERSON_OPTIONS: Option[] = [
  { label: 'Natural', value: 'natural' },
  { label: 'Juridica', value: 'juridica' },
  { label: 'Niños, niñas y adolescentes', value: 'nna' },
  { label: 'Ente publico', value: 'ente_publico' },
];

const DOC_OPTIONS_BY_PERSON: Record<string, Option[]> = {
  natural: [
    { label: 'Cédula de ciudadanía', value: 'cc' },
    { label: 'Cédula de extranjería', value: 'ce' },
    { label: 'Tarjeta de identidad', value: 'ti' },
    { label: 'Pasaporte', value: 'pa' },
    { label: 'NIT', value: 'nit' },
  ],
  juridica: [{ label: 'NIT', value: 'nit' }],
  nna: [{ label: 'Tarjeta de identidad', value: 'ti' }],
  ente_publico: [],
};

const GENDER_OPTIONS: Option[] = [
  { label: 'Femenino', value: 'femenino' },
  { label: 'Masculino', value: 'masculino' },
  { label: 'No binario', value: 'no_binario' },
  { label: 'Prefiero no responder', value: 'no_responde' },
];

const StepCard = ({ title, subtitle, children, stepNumber }: any) => (
  <section className="bg-white/95 rounded-3xl shadow-[0_22px_50px_-34px_rgba(2,43,19,0.5)] border border-slate-200/80 overflow-hidden mb-6 transition-all duration-300">
    <div className="h-1 w-full bg-gradient-to-r from-emerald-700 via-emerald-500 to-emerald-300" aria-hidden="true" />
    <div className="bg-slate-50/90 border-b border-slate-100 p-5 md:p-6 flex items-center gap-4">
      <div className="bg-emerald-100 text-emerald-800 h-10 w-10 min-w-[2.5rem] rounded-xl flex items-center justify-center font-bold tracking-tight">
        {stepNumber}
      </div>
      <div>
        <h3 className="text-slate-900 font-bold text-lg leading-tight">{title}</h3>
        {subtitle && <p className="text-slate-600 text-sm mt-1">{subtitle}</p>}
      </div>
    </div>
    <div className="p-5 md:p-6">{children}</div>
  </section>
);

const InputField = React.forwardRef(
  (
    { label, id, type = 'text', placeholder, options = [], error, disabled = false, ...rest }: any,
    ref: any,
  ) => (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-semibold text-slate-700 mb-1.5">
        {label}
      </label>
      {type === 'select' ? (
        <select
          id={id}
          ref={ref}
          disabled={disabled}
          className={`w-full bg-slate-50/70 border ${
            error
              ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500'
              : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'
          } text-slate-800 rounded-xl focus:ring-4 block pl-4 p-3 transition-colors outline-none min-h-11 disabled:bg-slate-100 disabled:text-slate-400`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          {...rest}
        >
          <option value="">Seleccione una opción</option>
          {options.map((opt: Option) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          id={id}
          ref={ref}
          disabled={disabled}
          className={`w-full bg-slate-50/70 border ${
            error
              ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500'
              : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'
          } text-slate-800 rounded-xl focus:ring-4 block pl-4 p-3 transition-colors outline-none min-h-11 disabled:bg-slate-100 disabled:text-slate-400`}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          {...rest}
        />
      )}
      {error && (
        <p id={`${id}-error`} className="text-red-500 text-xs mt-1.5 flex items-center gap-1 font-medium">
          <AlertTriangle size={12} />
          {error.message}
        </p>
      )}
    </div>
  ),
);

InputField.displayName = 'InputField';

const TextareaField = React.forwardRef(({ label, id, placeholder, rows = 5, error, ...rest }: any, ref: any) => (
  <div className="mb-4">
    <label htmlFor={id} className="block text-sm font-semibold text-slate-700 mb-1.5">
      {label}
    </label>
    <textarea
      id={id}
      ref={ref}
      rows={rows}
      className={`w-full bg-slate-50/70 border ${
        error
          ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500'
          : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'
      } text-slate-800 rounded-xl focus:ring-4 block p-4 transition-colors outline-none resize-y`}
      placeholder={placeholder}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? `${id}-error` : undefined}
      {...rest}
    />
    {error && (
      <p id={`${id}-error`} className="text-red-500 text-xs mt-1.5 flex items-center gap-1 font-medium">
        <AlertTriangle size={12} />
        {error.message}
      </p>
    )}
  </div>
));

TextareaField.displayName = 'TextareaField';

const AttachmentRules = () => (
  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
    <p className="font-semibold mb-2">Recomendaciones para adjuntar archivos</p>
    <ul className="list-disc pl-5 space-y-1">
      <li>Verificar que tenga conexión estable a internet.</li>
      <li>Los nombres deben ser cortos (máx. 40 caracteres) y sin tildes o caracteres especiales.</li>
      <li>Formatos sugeridos: Word, PDF, Excel, Fotos, Texto, Audio y Video.</li>
      <li>El tamaño por archivo no debe superar 10 MB.</li>
      <li>Se permiten hasta 5 anexos.</li>
    </ul>
  </div>
);

const AttachmentPicker = ({ files, setFiles, fileError, setFileError, inputId }: any) => {
  const onFilesSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []);

    if (selected.length > 5) {
      setFileError('Solo se permiten hasta 5 anexos.');
      return;
    }

    for (const file of selected) {
      if (file.size > 10 * 1024 * 1024) {
        setFileError(`El archivo ${file.name} supera 10 MB.`);
        return;
      }
      if (file.name.length > 40) {
        setFileError(`El archivo ${file.name} excede 40 caracteres en su nombre.`);
        return;
      }
      if (/[áéíóúÁÉÍÓÚ!%^&$"*=\[\]\\'´/{}|]/.test(file.name)) {
        setFileError(`El archivo ${file.name} incluye caracteres no permitidos.`);
        return;
      }
    }

    setFileError('');
    setFiles(selected);
  };

  return (
    <div className="space-y-4">
      <label
        htmlFor={inputId}
        className="border-2 border-dashed border-slate-300 rounded-xl p-7 flex flex-col items-center justify-center text-center bg-slate-50/50 hover:bg-emerald-50/40 hover:border-emerald-300 transition-colors cursor-pointer"
      >
        <CloudUpload size={30} className="text-emerald-700 mb-2" />
        <span className="font-semibold text-slate-800">Seleccionar archivo</span>
        <span className="text-xs text-slate-500 mt-1">Puede adjuntar hasta 5 archivos</span>
      </label>
      <input id={inputId} type="file" className="hidden" multiple onChange={onFilesSelected} />

      {fileError && (
        <p className="text-red-600 text-sm flex items-center gap-1" role="alert">
          <AlertTriangle size={14} />
          {fileError}
        </p>
      )}

      {files.length > 0 && (
        <div className="rounded-xl border border-slate-200 p-4 bg-white">
          <p className="font-semibold text-slate-800 mb-2">Anexos seleccionados</p>
          <ul className="space-y-1 text-sm text-slate-600">
            {files.map((file: File) => (
              <li key={`${file.name}-${file.lastModified}`}>{file.name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const SuccessView = ({ trackingId, viewType, resetForm }: any) => (
  <div className="bg-white rounded-3xl shadow-[0_22px_50px_-34px_rgba(2,43,19,0.5)] border border-slate-200 p-8 text-center animate-fade-in mx-auto max-w-2xl mt-4 mb-20">
    <div className="w-20 h-20 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-6">
      <CheckCircle size={40} />
    </div>
    <h2 className="text-2xl font-bold text-slate-900 font-display mb-2">Solicitud radicada exitosamente</h2>
    <p className="text-slate-600 max-w-lg mx-auto mb-6">
      {viewType === 'normal'
        ? 'Su solicitud fue recibida y validada. Le notificaremos con los datos registrados.'
        : 'Su solicitud anónima fue recibida. Guarde su número de radicado para consulta.'}
    </p>

    <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-5 mb-8 inline-block min-w-[300px]">
      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Número de Radicado</span>
      <span className="text-3xl font-mono font-bold text-emerald-700 tracking-tight">{trackingId}</span>
    </div>

    <button
      onClick={resetForm}
      className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-3 px-6 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
    >
      Radicar otra solicitud
    </button>
  </div>
);

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

      const res = await fetch('/api/pqrsd/normal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
    <form onSubmit={handleSubmit(onSubmit)} className="animate-fade-in relative" noValidate>
      {status === 'submitting' && (
        <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] rounded-2xl flex items-center justify-center" aria-live="polite" aria-busy="true">
          <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-emerald-600" size={32} />
            <p className="font-semibold text-slate-700">Procesando solicitud...</p>
          </div>
        </div>
      )}

      {serverError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-start gap-3" role="alert">
          <AlertTriangle className="shrink-0 mt-0.5" size={20} />
          <div>
            <span className="font-bold block">Error del Servidor</span>
            <span className="text-sm">{serverError}</span>
          </div>
        </div>
      )}
      <StepCard
        stepNumber="1"
        title="Formulario de PQRS - Radicación"
        subtitle="Complete los datos del solicitante y de los hechos"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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

          <InputField label="Departamento" id="department" error={errors.department} {...register('department')} />
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

        <div className="space-y-3 mt-2">
          <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-xl bg-slate-50/70">
            <input type="checkbox" {...register('preferential_attention')} className="mt-1 h-4 w-4 rounded border-slate-300" />
            <span className="text-sm text-slate-700">Atención preferencial</span>
          </label>

          <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-xl bg-slate-50/70">
            <input type="checkbox" {...register('information_request')} className="mt-1 h-4 w-4 rounded border-slate-300" />
            <span className="text-sm text-slate-700">Es solicitud de información</span>
          </label>

          <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-xl bg-slate-50/70">
            <input type="checkbox" {...register('notifications')} className="mt-1 h-4 w-4 rounded border-slate-300" />
            <span className="text-sm text-slate-700">Autoriza notificación por correo electrónico</span>
          </label>
        </div>

        <div className="mt-5">
          <TextareaField
            label="Descripción"
            id="description"
            placeholder="Detalle los hechos de forma clara y concreta"
            rows={6}
            error={errors.description}
            {...register('description')}
          />
        </div>

        <div className="mt-4 p-4 border border-slate-200 rounded-xl bg-white">
          <label className="flex items-start gap-3">
            <input type="checkbox" {...register('verification_check')} className="mt-1 h-4 w-4 rounded border-slate-300" />
            <span className="text-sm text-slate-800 font-semibold">Campo de verificación</span>
          </label>
          {errors.verification_check && (
            <p className="text-red-600 text-xs mt-2">{String(errors.verification_check.message)}</p>
          )}
        </div>
      </StepCard>

      <StepCard stepNumber="3" title="Nueva pestaña para documentos" subtitle="Adjunte documentos de soporte si lo requiere">
        <div className="mb-4">
          <Link
            href="/documentos-anexos"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:text-emerald-900 underline"
          >
            Abrir guía de anexos en nueva pestaña
            <ExternalLink size={14} />
          </Link>
        </div>

        <AttachmentRules />

        <div className="mt-4">
          <AttachmentPicker
            files={attachments}
            setFiles={setAttachments}
            fileError={attachmentError}
            setFileError={setAttachmentError}
            inputId="normal-attachments"
          />
        </div>
      </StepCard>

      <div className={`bg-white p-6 rounded-3xl shadow-[0_22px_50px_-34px_rgba(2,43,19,0.5)] border ${errors.accept_terms ? 'border-red-300 ring-4 ring-red-500/10' : 'border-slate-200'} mb-10 transition-all`}>
        <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors mb-4">
          <input
            type="checkbox"
            {...register('accept_terms')}
            className="mt-0.5 h-4 w-4 text-emerald-700 rounded border-slate-300 focus:ring-emerald-500"
          />
          <span className="text-sm text-slate-700">Se aceptan los términos y condiciones.</span>
        </label>

        {errors.accept_terms && <p className="text-red-600 text-xs mb-4">{String(errors.accept_terms.message)}</p>}

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="submit"
            disabled={status === 'submitting'}
            className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold py-3.5 px-8 rounded-xl flex items-center gap-2 shadow-sm transition-all hover:shadow focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/30"
          >
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

      const res = await fetch('/api/pqrsd/anonymous', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
    <form onSubmit={handleSubmit(onSubmit)} className="animate-fade-in relative" noValidate>
      {status === 'submitting' && (
        <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] rounded-2xl flex items-center justify-center" aria-live="polite" aria-busy="true">
          <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-slate-800" size={32} />
            <p className="font-semibold text-slate-700">Cifrando y enviando de forma segura...</p>
          </div>
        </div>
      )}

      {serverError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-start gap-3" role="alert">
          <AlertTriangle className="shrink-0 mt-0.5" size={20} />
          <div>
            <span className="font-bold block">Error del Servidor</span>
            <span className="text-sm">{serverError}</span>
          </div>
        </div>
      )}

      <StepCard stepNumber="1" title="PQRSD anonimas" subtitle="Complete los campos mínimos para la radicación anónima">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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

        <div className="mt-4">
          <TextareaField
            label="Descripción"
            id="anon_description"
            placeholder="Describa de forma precisa los hechos"
            rows={6}
            error={errors.description}
            {...register('description')}
          />
        </div>

        <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-xl bg-slate-50/70">
          <input type="checkbox" {...register('authorize_information')} className="mt-1 h-4 w-4 rounded border-slate-300" />
          <span className="text-sm text-slate-700">Checkbox para autorizar la información</span>
        </label>
        {errors.authorize_information && (
          <p className="text-red-600 text-xs mt-2">{String(errors.authorize_information.message)}</p>
        )}
      </StepCard>

      <StepCard stepNumber="2" title="Nueva pestaña para documentos" subtitle="Adjunte documentos de soporte si lo requiere">
        <div className="mb-4">
          <Link
            href="/documentos-anexos"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:text-emerald-900 underline"
          >
            Abrir guía de anexos en nueva pestaña
            <ExternalLink size={14} />
          </Link>
        </div>

        <AttachmentRules />

        <div className="mt-4">
          <AttachmentPicker
            files={attachments}
            setFiles={setAttachments}
            fileError={attachmentError}
            setFileError={setAttachmentError}
            inputId="anonymous-attachments"
          />
        </div>
      </StepCard>

      <div className={`bg-white p-6 rounded-3xl shadow-[0_22px_50px_-34px_rgba(2,43,19,0.5)] border ${errors.accept_terms ? 'border-red-300 ring-4 ring-red-500/10' : 'border-slate-200'} mb-10 transition-all`}>
        <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors mb-4">
          <input
            type="checkbox"
            {...register('accept_terms')}
            className="mt-0.5 h-4 w-4 text-emerald-700 rounded border-slate-300 focus:ring-emerald-500"
          />
          <span className="text-sm text-slate-700">Se aceptan los términos y condiciones.</span>
        </label>

        {errors.accept_terms && <p className="text-red-600 text-xs mb-4">{String(errors.accept_terms.message)}</p>}

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="submit"
            disabled={status === 'submitting'}
            className="bg-slate-900 hover:bg-slate-950 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold py-3.5 px-8 rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-500/30"
          >
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
    <div className="min-h-screen text-slate-800 pb-12 selection:bg-emerald-200 selection:text-emerald-900 page-backdrop">
      <a href="#main-content" className="skip-link">
        Saltar al contenido principal
      </a>

      <header className="bg-white/95 border-b border-slate-200 sticky top-0 z-50 backdrop-blur-sm">
        <div className="h-1 w-full bg-[linear-gradient(90deg,#ffffff_0%,#ffffff_50%,#00904c_50%,#00904c_100%)]" aria-hidden="true" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-700 text-white p-2 rounded-xl shadow-sm">
              <Landmark size={22} />
            </div>
            <div>
              <h1 className="font-display font-bold text-slate-800 text-lg leading-tight">Alcaldía de Medellín</h1>
              <p className="text-[0.65rem] text-slate-500 font-bold tracking-widest uppercase mt-0.5">Portal Ciudadano</p>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <button className="text-slate-600 hover:text-emerald-700 font-semibold text-sm transition-colors hidden sm:block">
              Mis Radicados
            </button>
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
            <button className="flex items-center gap-2 text-slate-700 hover:text-emerald-800 transition-colors bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 px-4 py-2 rounded-full text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2">
              <UserCircle size={18} /> Ingresar
            </button>
          </div>
        </div>
      </header>

      <section className="bg-[linear-gradient(140deg,#032911_0%,#05401e_55%,#0b5a2b_100%)] border-b border-emerald-950 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-emerald-300/10 rounded-full blur-3xl mix-blend-screen" />
          <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-lime-200/10 rounded-full blur-3xl mix-blend-screen" />
          <div className="absolute inset-0 hero-grid-pattern opacity-20" />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 relative z-10">
          <div className="inline-flex items-center gap-2 bg-emerald-900/50 border border-emerald-400/30 backdrop-blur text-emerald-100 text-xs font-bold uppercase tracking-wider py-1.5 px-4 rounded-full mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-300" /> Plataforma oficial distrital
          </div>
          <div className="grid md:grid-cols-[1.6fr_1fr] gap-10 items-end">
            <div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-white font-display mb-5 tracking-tight">{heroTitle}</h2>
              <p className="text-emerald-100/85 text-base max-w-2xl leading-relaxed">{heroDescription}</p>
            </div>
            <div className="bg-white/10 border border-white/20 rounded-2xl p-5 backdrop-blur-sm text-emerald-50">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">Canal ciudadano</p>
              <p className="font-display text-2xl font-bold mt-1">Atención 24/7</p>
              <p className="text-sm text-emerald-100/85 mt-2">Su número de radicado queda disponible al finalizar el formulario.</p>
            </div>
          </div>
        </div>
      </section>

      <main id="main-content" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        {allowSwitch ? (
          <div role="tablist" aria-label="Tipo de radicación" className="bg-white p-1.5 rounded-2xl shadow-lg border border-slate-200 flex mb-10 max-w-[30rem] mx-auto">
            <button
              onClick={() => setView('normal')}
              id="tab-normal"
              role="tab"
              aria-controls="panel-normal"
              aria-selected={view === 'normal'}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-300 ${
                view === 'normal'
                  ? 'bg-emerald-50 text-emerald-900 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.25)]'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Building2 size={18} className={view === 'normal' ? 'text-emerald-700' : ''} />
              Persona normal
            </button>
            <button
              onClick={() => setView('anon')}
              id="tab-anon"
              role="tab"
              aria-controls="panel-anon"
              aria-selected={view === 'anon'}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-300 ${
                view === 'anon' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Lock size={18} className={view === 'anon' ? 'text-slate-300' : ''} />
              Anónima
            </button>
          </div>
        ) : (
          <div className="mb-10 text-center">
            <a
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:text-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 rounded-lg px-3 py-2"
            >
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

      <footer className="mt-16 border-t border-slate-200/80 bg-white/70 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center text-sm text-slate-500">
          <div className="flex justify-center items-center gap-2 mb-4 text-emerald-700">
            <Landmark size={28} />
          </div>
          <p className="font-bold text-slate-800 font-display text-base mb-1">Alcaldía de Medellín</p>
          <p className="mb-4 text-slate-500/80">Centro Administrativo Distrital (CAD) - Calle 44 N 52 - 165</p>
          <div className="h-px bg-slate-200 max-w-xs mx-auto mb-6" />
          <p className="text-xs text-slate-400 font-medium">&copy; {new Date().getFullYear()} Sistema PQRSD de la Alcaldía de Medellín. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
