export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`logo ${className}`}>
      <svg className="logo__mark" width="34" height="34" viewBox="0 0 34 34" aria-hidden>
        <rect width="34" height="34" rx="4" fill="var(--accent)" />
        <path d="M8 25V9h6.5a8 8 0 0 1 0 16zM20 9h6v4h-6zM20 15h6v10h-6z" fill="#fff" />
      </svg>
      <span className="logo__text">
        DS <span>GROUP</span>
      </span>
    </span>
  )
}
