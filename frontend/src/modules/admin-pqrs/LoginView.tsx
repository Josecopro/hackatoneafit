import Link from 'next/link';
import styles from './AdminViews.module.scss';

export default function LoginView() {
  return (
    <main className={styles.shell}>
      <div className={styles.container}>
        <div className={styles.topBar}>
          <span className={styles.brand}>Administracion PQRSD</span>
          <Link className={styles.topLink} href="/">
            Ir al portal ciudadano
          </Link>
        </div>

        <section className={`${styles.card} ${styles.loginCard}`}>
          <h1 className={styles.title}>Ingreso de funcionarios</h1>
          <p className={styles.subtitle}>
            Accede con tus credenciales institucionales para revisar y responder PQRSD.
          </p>

          <form className={styles.form}>
            <div>
              <label className={styles.label} htmlFor="email">
                Correo institucional
              </label>
              <input className={styles.input} id="email" type="email" placeholder="nombre@medellin.gov.co" />
            </div>

            <div>
              <label className={styles.label} htmlFor="password">
                Contrasena
              </label>
              <input className={styles.input} id="password" type="password" placeholder="********" />
            </div>

            <button className={styles.primaryButton} type="submit">
              Ingresar
            </button>
          </form>

          <p className={styles.helperText}>Version visual inicial. La autenticacion se integra en la siguiente etapa.</p>
        </section>
      </div>
    </main>
  );
}
