import { type ButtonHTMLAttributes, type FC } from 'react'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string  // aria-label for accessibility
}

export const IconButton: FC<IconButtonProps> = ({ label, children, className = '', ...props }) => (
  <button
    aria-label={label}
    className={`
      inline-flex items-center justify-center
      w-8 h-8 rounded-md
      text-text-secondary hover:text-text-primary
      bg-transparent hover:bg-bg-elevated
      focus:outline-none focus:ring-2 focus:ring-border-accent
      transition-colors duration-150
      ${className}
    `}
    {...props}
  >
    {children}
  </button>
)
