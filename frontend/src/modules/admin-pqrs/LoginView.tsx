"use client";

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './AdminViews.module.scss';

export default function LoginView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = useMemo(() => searchParams.get('next'), [searchParams]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const body = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        message?: string;
      };

      if (!response.ok || !body.success) {
        setError(body.message || 'No fue posible iniciar sesion.');
        return;
      }

      const destination = nextParam && nextParam.startsWith('/administracion') ? nextParam : '/administracion/pqrs';
      router.push(destination);
      router.refresh();
    } catch {
      setError('Ocurrio un error de red. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={styles.adminViews__shell}>
      <div className={styles.adminViews__container}>
        <div className={styles.adminViews__topBar}>
          <span className={styles.adminViews__brand}>Administracion PQRSD</span>
          <Link className={styles.adminViews__topLink} href="/">
            Ir al portal ciudadano
          </Link>
        </div>

        <section className={`${styles.adminViews__card} ${styles.adminViews__loginCard}`}>
          <h1 className={styles.adminViews__title}>Ingreso de funcionarios</h1>
          <p className={styles.adminViews__subtitle}>
            Accede con tus credenciales institucionales para revisar y responder PQRSD.
          </p>

          <form className={styles.adminViews__form} onSubmit={onSubmit}>
            <div>
              <label className={styles.adminViews__label} htmlFor="email">
                Correo institucional
              </label>
              <input
                className={styles.adminViews__input}
                id="email"
                type="email"
                placeholder="nombre@medellin.gov.co"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div>
              <label className={styles.adminViews__label} htmlFor="password">
                Contrasena
              </label>
              <input
                className={styles.adminViews__input}
                id="password"
                type="password"
                placeholder="********"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            {error && <p className={styles.adminViews__errorText}>{error}</p>}

            <button className={styles.adminViews__primaryButton} type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Validando...' : 'Ingresar'}
            </button>
          </form>

          <p className={styles.adminViews__helperText}>El acceso solo esta habilitado para cuentas administrativas autorizadas.</p>
        </section>
      </div>
    </main>
  );
}
