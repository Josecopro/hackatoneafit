import Link from 'next/link';
import styles from '@/App.module.scss';

type HeroSectionProps = {
  heroTitle: string;
  heroDescription: string;
};

export default function HeroSection({ heroTitle, heroDescription }: HeroSectionProps) {
  return (
    <section className={styles.hero}>
      <div className={styles.heroOverlay}>
        <div className={`${styles.gridPattern} hero-grid-pattern`} />
      </div>

      <div className={styles.heroInner}>
        <div className={styles.heroTopBar}>
          <Link href="/" className={styles.heroBackButton}>
            Volver al inicio
          </Link>
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
