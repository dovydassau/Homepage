'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { menuItems } from './nav-items'

function Logo() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M3 3H9V9H3V3Z" fill="currentColor" fillOpacity="0.9" />
      <path d="M11 3H17V9H11V3Z" fill="currentColor" fillOpacity="0.55" />
      <path d="M3 11H9V17H3V11Z" fill="currentColor" fillOpacity="0.55" />
      <path
        d="M11 11H17V17H11V11Z"
        fill="currentColor"
        fillOpacity="0.35"
      />
    </svg>
  )
}

function isActivePath(pathname: string, href: string) {
  if (href === '/films') {
    return (
      pathname === '/films' ||
      pathname.startsWith('/films/') ||
      pathname === '/assistant' ||
      pathname.startsWith('/assistant/')
    )
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

function NavLink({
  href,
  children,
  isActive,
  size = 'default',
}: {
  href: string
  children: React.ReactNode
  isActive: boolean
  size?: 'default' | 'mobile'
}) {
  const isMobile = size === 'mobile'

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={`relative inline-flex items-center whitespace-nowrap transition-colors ${
        isMobile ? 'min-h-8 py-0.5' : 'min-h-10 px-1 py-2'
      } ${isActive ? 'font-medium text-[var(--foreground)]' : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'}`}
    >
      {isActive && (
        <span className="nav-active-pill absolute inset-0 rounded-full bg-[var(--surface-muted)]" />
      )}
      <span className={`relative ${isMobile ? 'px-1' : 'px-2'}`}>{children}</span>
    </Link>
  )
}

function ActionLink({
  href,
  children,
  variant,
  isActive,
}: {
  href: string
  children: React.ReactNode
  variant: 'ghost' | 'primary'
  isActive: boolean
}) {
  const base =
    'relative inline-flex min-h-10 items-center overflow-hidden rounded-full px-3 py-2 text-[12px] font-medium transition-opacity sm:px-4 sm:text-[13px]'

  const variantClass =
    variant === 'primary'
      ? isActive
        ? 'bg-[var(--foreground)] text-[var(--background)] ring-2 ring-[var(--foreground)] ring-offset-2 ring-offset-[var(--background)]'
        : 'bg-[var(--foreground)] text-[var(--background)] hover:opacity-85'
      : isActive
        ? 'text-[var(--foreground)]'
        : 'text-[var(--foreground)] hover:bg-[var(--surface-muted)]'

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={`${base} ${variantClass}`}
    >
      {isActive && variant === 'ghost' && (
        <span className="nav-active-pill absolute inset-0 rounded-full bg-[var(--surface-muted)]" />
      )}
      {isActive && variant === 'primary' && (
        <span className="nav-active-pill absolute inset-0 rounded-full bg-[var(--foreground)]" />
      )}
      <span className="relative">{children}</span>
    </Link>
  )
}

function NavMenu({
  pathname,
  size = 'default',
}: {
  pathname: string
  size?: 'default' | 'mobile'
}) {
  const items = menuItems

  return (
    <>
      {items.map((item, index) => {
        const isActive = isActivePath(pathname, item.href)

        return (
          <span key={item.name} className="flex items-center">
            <NavLink href={item.href} size={size} isActive={isActive}>
              {item.name}
            </NavLink>
            {index < items.length - 1 && (
              <span
                className={`select-none text-[var(--foreground-subtle)] ${size === 'mobile' ? 'text-[11px]' : ''}`}
              >
                |
              </span>
            )}
          </span>
        )
      })}
    </>
  )
}

export function Navbar() {
  const pathname = usePathname()

  return (
    <header className="page-shell sticky top-0 z-50 w-full pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] sm:pb-3 sm:pt-3 lg:pt-4">
      <div
        aria-hidden
        className="nav-scrim pointer-events-none absolute inset-x-0 top-0 -z-10 h-[calc(100%+1.5rem)]"
      />
      <div className="mx-auto max-w-[1400px]">
        <div className="nav-floating relative flex items-center justify-between gap-2 rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5">
          <Link
            href="/films"
            aria-current={isActivePath(pathname, '/films') ? 'page' : undefined}
            className="flex min-h-8 min-w-0 flex-1 items-center gap-2 text-[14px] font-medium tracking-tight text-[var(--foreground)] transition-opacity hover:opacity-70 sm:min-h-11 sm:gap-2.5 sm:text-[15px] md:flex-none"
          >
            <Logo />
            <span className="truncate">dovydas saudys</span>
          </Link>

          {menuItems.length > 0 && (
            <>
              <nav
                className="absolute left-1/2 hidden -translate-x-1/2 items-center text-[14px] md:flex"
                aria-label="Main"
              >
                <NavMenu pathname={pathname} />
              </nav>

              <nav
                className="flex shrink-0 items-center text-[12px] leading-none md:hidden"
                aria-label="Main mobile"
              >
                <NavMenu pathname={pathname} size="mobile" />
              </nav>
            </>
          )}

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <ActionLink
              href="/contact"
              variant="ghost"
              isActive={isActivePath(pathname, '/contact')}
            >
              contact
            </ActionLink>
            {/* Temporarily hidden:
            <ActionLink
              href="/resume"
              variant="primary"
              isActive={isActivePath(pathname, '/resume')}
            >
              resume
            </ActionLink>
            */}
          </div>
        </div>
      </div>
    </header>
  )
}
