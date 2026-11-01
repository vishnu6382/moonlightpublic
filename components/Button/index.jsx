import Link from 'next/link';
import styles from './Button.module.css';

export default function Button({
  children,
  href,
  variant = 'outline',
  size = 'md',
  className = '',
  onClick,
  type = 'button',
  ...rest
}) {
  const combinedClassName = `${styles.button} ${styles[variant] || styles.outline} ${styles[size] || styles.md} ${className}`.trim();

  if (href) {
    const isInternal = href.startsWith('/') || href.startsWith('#');
    if (isInternal) {
      return (
        <Link href={href} className={combinedClassName} onClick={onClick} {...rest}>
          {children}
        </Link>
      );
    }
    return (
      <a href={href} className={combinedClassName} onClick={onClick} target="_blank" rel="noopener noreferrer" {...rest}>
        {children}
      </a>
    );
  }

  return (
    <button type={type} className={combinedClassName} onClick={onClick} {...rest}>
      {children}
    </button>
  );
}
