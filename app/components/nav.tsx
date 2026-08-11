'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { menuItems } from './nav-items'
import {
  ProjectSearch,
  type ProjectSearchItem,
} from './project-search'
import { TapeStrip } from './tape-strip'

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
  variant: 'ghost' | 'primary' | 'tape'
  isActive: boolean
}) {
  const base =
    'group relative inline-flex min-h-10 items-center px-3 py-2 text-[12px] font-medium focus-visible:outline-none sm:px-4 sm:text-[13px]'
  const focusClass =
    variant === 'tape'
      ? ''
      : 'focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]'

  const variantClass =
    variant === 'tape'
      ? 'tape-snap-control rounded-2xl border border-[var(--border)] bg-[var(--background)]/90 text-[var(--foreground)] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_10px_30px_-20px_rgba(0,0,0,0.2)] backdrop-blur-xl transition-[border-color,background-color,color,opacity] duration-200 hover:border-transparent hover:text-black focus-visible:border-transparent focus-visible:text-black [--snap-tape-color:#FF5C00]'
      : variant === 'primary'
        ? isActive
          ? 'rounded-full bg-[var(--foreground)] text-[var(--background)] ring-2 ring-[var(--foreground)] ring-offset-2 ring-offset-[var(--background)]'
          : 'rounded-full bg-[var(--foreground)] text-[var(--background)] transition-opacity hover:opacity-85'
        : isActive
          ? 'rounded-full text-[var(--foreground)]'
          : 'rounded-full text-[var(--foreground)] hover:bg-[var(--surface-muted)]'

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={`${base} ${focusClass} ${variantClass}`}
    >
      {isActive && variant === 'ghost' && (
        <span className="nav-active-pill absolute inset-0 rounded-full bg-[var(--surface-muted)]" />
      )}
      {isActive && variant === 'primary' && (
        <span className="nav-active-pill absolute inset-0 rounded-full bg-[var(--foreground)]" />
      )}
      {variant === 'tape' && (
        <TapeStrip
          aria-hidden
          variant="marker"
          color="#FF5C00"
          animate="snap"
          className="absolute -inset-[2px] [--tape-rotate:1.5deg]"
        />
      )}
      <span className="relative z-10">{children}</span>
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

export function Navbar({
  searchProjects,
}: {
  searchProjects: ProjectSearchItem[]
}) {
  const pathname = usePathname()
  const overlaysContent =
    isActivePath(pathname, '/contact') ||
    isActivePath(pathname, '/films')

  return (
    <header
      className={`page-shell top-0 z-50 w-full pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] sm:pb-3 sm:pt-3 lg:pt-4 ${
        overlaysContent ? 'fixed inset-x-0' : 'sticky'
      }`}
    >
      <div
        aria-hidden
        className="nav-scrim pointer-events-none absolute inset-x-0 top-0 -z-10 h-[calc(100%+1.5rem)]"
      />
      <div className="mx-auto max-w-[1400px]">
        <div className="nav-floating relative grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5">
          <Link
            href="/films"
            aria-current={isActivePath(pathname, '/films') ? 'page' : undefined}
            className="nav-name-link flex min-h-8 min-w-0 items-center justify-self-start text-[14px] font-medium sm:min-h-11 sm:text-[15px]"
          >
            <TapeStrip
              variant="marker"
              color="#069494"
              className="nav-name-tape relative inline-flex min-w-0 max-w-full items-center px-3 py-2 font-[family-name:var(--font-geist-mono)] font-semibold tracking-[-0.035em] text-white"
            >
              <span className="truncate">Dovydas Saudys</span>
            </TapeStrip>
          </Link>

          <ProjectSearch projects={searchProjects} />

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

          <div className="flex shrink-0 items-center justify-self-end gap-1.5 sm:gap-2">
            <ActionLink
              href="/contact"
              variant="tape"
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
