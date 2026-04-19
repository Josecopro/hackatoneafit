import Link from 'next/link';
import styles from '@/App.module.scss';

type HeroSectionProps = {
  heroTitle: string;
  heroDescription: string;
};

export default function HeroSection({ heroTitle, heroDescription }: HeroSectionProps) {
  return (
    <section className={styles.app__hero}>
      <div className={styles.app__heroOverlay}>
        <div className={`${styles.app__gridPattern} hero__grid-pattern`} />
      </div>

      <div className={styles.app__heroInner}>
        <div className={styles.app__heroTopBar}>
          <Link href="/" className={styles.app__heroBackButton}>
            Volver al inicio
          </Link>
        </div>

        <div className={styles.app__heroGrid}>
          <div>
            <h2 className={styles.app__heroTitle}>{heroTitle}</h2>
            <p className={styles.app__heroDescription}>{heroDescription}</p>
          </div>
        </div>

      </div>
    </section>
  );
}
