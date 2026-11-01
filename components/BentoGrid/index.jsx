import React from 'react';
import styles from './BentoGrid.module.css';

// Default rhythm pattern for bento tiles if not explicitly provided
const DEFAULT_RHYTHM = ['large', 'sm', 'sm', 'wide', 'tall', 'sm'];

export function BentoItem({
  children,
  span,
  orientation,
  index = 0,
  className = '',
  ...rest
}) {
  let resolvedSpan = span;

  if (!resolvedSpan) {
    if (orientation === 'landscape') resolvedSpan = 'wide';
    else if (orientation === 'portrait') resolvedSpan = 'tall';
    else if (orientation === 'square') resolvedSpan = 'sm';
    else {
      resolvedSpan = DEFAULT_RHYTHM[index % DEFAULT_RHYTHM.length];
    }
  }

  const spanClass = styles[`item_${resolvedSpan}`] || styles.item_sm;

  return (
    <div className={`${styles.item} ${spanClass} ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}

export default function BentoGrid({
  children,
  className = '',
  itemCount,
  ...rest
}) {
  const childArray = React.Children.toArray(children);
  const count = itemCount || childArray.length;
  const countModifier = count <= 3 ? styles[`count_${count}`] : '';

  return (
    <div className={`${styles.grid} ${countModifier} ${className}`.trim()} {...rest}>
      {childArray.map((child, index) => {
        // If child is already a BentoItem, pass through with index
        if (React.isValidElement(child) && child.type === BentoItem) {
          return React.cloneElement(child, {
            index: child.props.index ?? index,
            key: child.key || index,
          });
        }
        // Otherwise wrap in BentoItem with automatic rhythm
        return (
          <BentoItem key={index} index={index}>
            {child}
          </BentoItem>
        );
      })}
    </div>
  );
}
