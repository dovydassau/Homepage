import {
  createElement,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from 'react'

type TapeStripProps = Omit<HTMLAttributes<HTMLElement>, 'color'> & {
  as?: 'aside' | 'span'
  variant?: 'gaffer' | 'marker'
  animate?: boolean | 'interaction' | 'snap'
  color?: string
  children?: ReactNode
}

type TapeStyle = CSSProperties & {
  '--tape-color'?: string
}

export function TapeStrip({
  as = 'span',
  variant = 'gaffer',
  animate = true,
  color,
  className = '',
  children,
  style,
  ...props
}: TapeStripProps) {
  const animationClass =
    animate === 'interaction'
      ? 'tape-strip--interactive'
      : animate === 'snap'
        ? 'tape-strip--snap'
        : animate
          ? 'tape-strip--applying'
          : ''
  const tapeStyle: TapeStyle = {
    ...style,
    ...(color ? { '--tape-color': color } : {}),
  }

  return createElement(
    as,
    {
      ...props,
      className: [
        'tape-strip',
        `tape-strip--${variant}`,
        animationClass,
        className,
      ]
        .filter(Boolean)
        .join(' '),
      style: tapeStyle,
    },
    createElement('span', {
      'aria-hidden': true,
      className: 'tape-strip__texture',
    }),
    createElement('span', {
      'aria-hidden': true,
      className: 'tape-strip__wrinkles',
    }),
    children,
  )
}
