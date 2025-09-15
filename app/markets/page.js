import Link from 'next/link';
import styles from '../styles/Markets.module.css';

export default function Markets() {
  return (
    <section className={styles.markets}>
      <div className={styles.container}>
        <h1>Markets</h1>
        <p>Explore prediction markets on Polymarket and Kalshi, covering politics, sports, economics, and more.</p>
        <div className={styles.cta}>
          <Link href="/#market-ticker" className={`${styles.ctaButton} ${styles.primary}`}>View Live Markets</Link>
        </div>
      </div>
    </section>
  );
}