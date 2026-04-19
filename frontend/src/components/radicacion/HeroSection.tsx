import styles from '@/App.module.scss';

type HeroSectionProps = {
  heroTitle: string;
  heroDescription: string;
};

export default function HeroSection({ heroTitle, heroDescription }: HeroSectionProps) {
  return (
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
        </div>

      </div>
    </section>
  );
}
