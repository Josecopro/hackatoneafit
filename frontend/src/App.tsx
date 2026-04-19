"use client";

import HeroSection from './components/radicacion/HeroSection';
import styles from './App.module.scss';
import NormalPqrsForm from './modules/pqrs/NormalPqrsForm';
import AnonymousPqrsForm from './modules/pqrs/AnonymousPqrsForm';

type ViewMode = 'normal' | 'anon';

type AppProps = {
  initialView?: ViewMode;
  allowSwitch?: boolean;
};

export default function App({ initialView = 'normal' }: AppProps) {
  const view = initialView;

  const heroTitle = view === 'normal' ? 'Radicación PQRSD con Identificación' : 'Radicación PQRSD Anónima';
  const heroDescription =
    view === 'normal'
      ? 'Flujo de persona normal con validaciones y aceptación de políticas en pestañas separadas.'
      : 'Canal reservado para denuncias y reportes preservando confidencialidad.';

  return (
    <div className={`${styles.app__shell} page-backdrop`}>
      <a href="#main-content" className="a11y__skip-link">
        Saltar al contenido principal
      </a>

      <HeroSection heroTitle={heroTitle} heroDescription={heroDescription} />

      <main id="main-content" className={styles.app__main}>
        <section
          id={view === 'normal' ? 'panel-normal' : 'panel-anon'}
          role="tabpanel"
          aria-labelledby={view === 'normal' ? 'tab-normal' : 'tab-anon'}
        >
          {view === 'normal' ? <NormalPqrsForm key="normal" /> : <AnonymousPqrsForm key="anon" />}
        </section>
      </main>
    </div>
  );
}
