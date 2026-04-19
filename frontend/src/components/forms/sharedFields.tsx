import React from 'react';
import { AlertTriangle, CheckCircle, CloudUpload } from 'lucide-react';

import type { Option } from '@/src/constants/formOptions';

export const StepCard = ({ title, subtitle, children, stepNumber }: any) => (
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

export const InputField = React.forwardRef(
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

export const TextareaField = React.forwardRef(({ label, id, placeholder, rows = 5, error, ...rest }: any, ref: any) => (
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

export const AttachmentRules = () => (
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

export const AttachmentPicker = ({ files, setFiles, fileError, setFileError, inputId }: any) => {
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

export const SuccessView = ({ trackingId, viewType, resetForm }: any) => (
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
