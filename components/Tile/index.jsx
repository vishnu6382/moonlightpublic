import styles from './Tile.module.css';

export default function Tile({
  children,
  media,
  className = '',
  aspectRatio,
  onClick,
  style = {},
  ...rest
}) {
  return (
    <div
      className={`${styles.tile} ${className}`.trim()}
      style={{ ...style }}
      onClick={onClick}
      {...rest}
    >
      {media && (
        <div
          className={styles.mediaWrapper}
          style={aspectRatio ? { aspectRatio } : undefined}
        >
          {media}
        </div>
      )}
      {children && <div className={styles.content}>{children}</div>}
    </div>
  );
}
