import Link from 'next/link';
import styles from '../styles/Traders.module.css';

export default function Traders() {
  return (
    <section className={styles.traders}>
      <div className={styles.container}>
        <h1>Traders</h1>
        <p>Prove your trading skills and get funded up to $100,000. Choose a challenge plan and start trading on Polymarket.</p>
        <div className={styles.cta}>
          <Link href="/#challenge-plans" className={`${styles.ctaButton} ${styles.primary}`}>Choose a Plan</Link>
        </div>
      </div>
    </section>
  );
}