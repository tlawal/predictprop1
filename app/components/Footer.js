import Link from 'next/link';
import styles from '../styles/Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div>
          <Link href="/about">About</Link>
          <Link href="/docs">Docs</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/discord">Discord</Link>
          <Link href="/twitter">Twitter</Link>
        </div>
        <div className={styles.security}>
          Join our community for 2025 launch updates
        </div>
      </div>
    </footer>
  );
}