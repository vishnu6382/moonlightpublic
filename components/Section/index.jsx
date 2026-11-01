import styles from './Section.module.css';

export default function Section({
  children,
  as: Component = 'section',
  id,
  className = '',
  innerClassName = '',
  spacing = 'lg',
  variant = 'white', // 'white' | 'panel'
  fluid = false,
  ...rest
}) {
  const isPanel = variant === 'panel';

  return (
    <Component
      id={id}
      className={`${styles.section} ${styles[spacing] || styles.lg} ${className}`.trim()}
      {...rest}
    >
      <div
        className={`${fluid ? styles.fluid : styles.inner} ${isPanel ? styles.panel : ''} ${innerClassName}`.trim()}
      >
        {children}
      </div>
    </Component>
  );
}
