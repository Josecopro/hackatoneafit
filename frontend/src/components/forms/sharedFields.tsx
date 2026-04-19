import React from 'react';
import { AlertTriangle, CheckCircle, CloudUpload } from 'lucide-react';

import type { Option } from '@/constants/formOptions';
import styles from './sharedFields.module.scss';

export const StepCard = ({ title, subtitle, children, stepNumber }: any) => (
  <section className={styles.stepCard}>
    <div className={styles.stepBar} aria-hidden="true" />
    <div className={styles.stepHead}>
      <div className={styles.stepNumber}>
        {stepNumber}
      </div>
      <div>
        <h3 className={styles.stepTitle}>{title}</h3>
        {subtitle && <p className={styles.stepSubtitle}>{subtitle}</p>}
      </div>
    </div>
    <div className={styles.stepBody}>{children}</div>
  </section>
);

export const InputField = React.forwardRef(
  (
    { label, id, type = 'text', placeholder, options = [], error, disabled = false, ...rest }: any,
    ref: any,
  ) => (
    <div className={styles.fieldWrap}>
      <label htmlFor={id} className={styles.fieldLabel}>
        {label}
      </label>
      {type === 'select' ? (
        <select
          id={id}
          ref={ref}
          disabled={disabled}
          className={`${styles.inputControl} ${error ? styles.inputError : ''}`}
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
          className={`${styles.inputControl} ${error ? styles.inputError : ''}`}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          {...rest}
        />
      )}
      {error && (
        <p id={`${id}-error`} className={styles.errorText}>
          <AlertTriangle size={12} />
          {error.message}
        </p>
      )}
    </div>
  ),
);

InputField.displayName = 'InputField';

export const TextareaField = React.forwardRef(({ label, id, placeholder, rows = 5, error, ...rest }: any, ref: any) => (
  <div className={styles.fieldWrap}>
    <label htmlFor={id} className={styles.fieldLabel}>
      {label}
    </label>
    <textarea
      id={id}
      ref={ref}
      rows={rows}
      className={`${styles.textareaControl} ${error ? styles.textareaError : ''}`}
      placeholder={placeholder}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? `${id}-error` : undefined}
      {...rest}
    />
    {error && (
      <p id={`${id}-error`} className={styles.errorText}>
        <AlertTriangle size={12} />
        {error.message}
      </p>
    )}
  </div>
));

TextareaField.displayName = 'TextareaField';

export const AttachmentRules = () => (
  <div className={styles.attachmentRules}>
    <p className={styles.attachmentRulesTitle}>Recomendaciones para adjuntar archivos</p>
    <ul className={styles.attachmentRulesList}>
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
    <div className={styles.attachmentWrap}>
      <label
        htmlFor={inputId}
        className={styles.uploadLabel}
      >
        <CloudUpload size={30} className={styles.uploadIcon} />
        <span className={styles.uploadText}>Seleccionar archivo</span>
        <span className={styles.uploadHint}>Puede adjuntar hasta 5 archivos</span>
      </label>
      <input id={inputId} type="file" className={styles.hiddenInput} multiple onChange={onFilesSelected} />

      {fileError && (
        <p className={styles.fileError} role="alert">
          <AlertTriangle size={14} />
          {fileError}
        </p>
      )}

      {files.length > 0 && (
        <div className={styles.selectedFiles}>
          <p className={styles.selectedFilesTitle}>Anexos seleccionados</p>
          <ul className={styles.selectedFilesList}>
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
  <div className={`${styles.successCard} animate-fade-in`}>
    <div className={styles.successIconWrap}>
      <CheckCircle size={40} />
    </div>
    <h2 className={`${styles.successTitle} font-display`}>Solicitud radicada exitosamente</h2>
    <p className={styles.successDescription}>
      {viewType === 'normal'
        ? 'Su solicitud fue recibida y validada. Le notificaremos con los datos registrados.'
        : 'Su solicitud anónima fue recibida. Guarde su número de radicado para consulta.'}
    </p>

    <div className={styles.trackingCard}>
      <span className={styles.trackingLabel}>Número de Radicado</span>
      <span className={styles.trackingValue}>{trackingId}</span>
    </div>

    <button
      onClick={resetForm}
      className={styles.secondaryButton}
    >
      Radicar otra solicitud
    </button>
  </div>
);
