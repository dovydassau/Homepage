'use client'

import {
  createContext,
  useContext,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from 'react'

/**
 * Portable data-table design — copy this single file into other apps.
 *
 * Includes: color tokens, typography (sizes/weight/tracking), hover, press,
 * selected, and inactive row states. Does not bundle a font family; set your
 * own on `body` or `.data-table`.
 *
 * Usage:
 *   1. Render `<DataTableStyles />` once (e.g. in root layout), or wrap rows in `<DataTable>`.
 *   2. Compose with the components below.
 *
 * Optional: add `data-table--themed` on `<DataTable>` to inherit `--foreground`,
 * `--accent`, etc. from your app theme instead of the built-in palette.
 */

export const DATA_TABLE_CSS = `
:root {
  --dt-background: #f7f7f4;
  --dt-foreground: #26251e;
  --dt-foreground-muted: #5c5b56;
  --dt-foreground-subtle: #b8b7b2;
  --dt-border: #e4e4e1;
  --dt-accent: #184fff;
  --dt-surface-muted: #ebebea;
}

.data-table--themed {
  --dt-background: var(--background, #f7f7f4);
  --dt-foreground: var(--foreground, #26251e);
  --dt-foreground-muted: var(--foreground-muted, #5c5b56);
  --dt-foreground-subtle: var(--foreground-subtle, #b8b7b2);
  --dt-border: var(--border, #e4e4e1);
  --dt-accent: var(--accent, #184fff);
  --dt-surface-muted: var(--surface-muted, #ebebea);
}

.data-table {
  container-type: inline-size;
  color: var(--dt-foreground);
}

.data-table__header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 7rem 3rem;
  column-gap: 1rem;
  border-bottom: 1px solid var(--dt-border);
  padding-bottom: 0.5rem;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.25;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--dt-foreground-subtle);
}

.data-table__row {
  display: grid;
  width: 100%;
  grid-template-columns: minmax(0, 1fr) 7rem 3rem;
  align-items: center;
  column-gap: 1rem;
  border: 0;
  border-bottom: 1px solid var(--dt-border);
  padding: 0.625rem 0;
  background: transparent;
  font: inherit;
  font-size: 16px;
  line-height: 1.25;
  letter-spacing: -0.012em;
  text-align: left;
  color: var(--dt-foreground-muted);
  transform-origin: left center;
  transition:
    color 150ms ease,
    transform 150ms ease;
  cursor: pointer;
}

.data-table__row:hover:not(:disabled) {
  color: var(--dt-accent);
}

.data-table__row:active:not(:disabled) {
  transform: scale(0.99);
}

.data-table__row:disabled,
.data-table__row--inactive {
  color: var(--dt-foreground-subtle);
  cursor: default;
}

.data-table__row--selected {
  color: var(--dt-accent);
}

.data-table__cell {
  min-width: 0;
}

.data-table__cell--truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.data-table__cell--right {
  text-align: right;
}

.data-table__cell--muted {
  opacity: 0.6;
}

.data-table__primary {
  min-width: 0;
}

.data-table__primary-line {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.data-table__title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.data-table__index {
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
  transition: color 150ms ease;
  color: var(--dt-foreground-subtle);
}

.data-table__row--selected .data-table__index,
.data-table__index--selected {
  color: var(--dt-accent);
}

.data-table__subtext {
  display: block;
  margin-top: 0.125rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  line-height: 1.25;
  color: var(--dt-foreground-subtle);
}

.data-table__subtext-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.125rem;
  font-size: 13px;
  line-height: 1.25;
  color: var(--dt-foreground-subtle);
}

.data-table__tabular {
  font-variant-numeric: tabular-nums;
}

.data-table__hide-narrow {
  display: none;
}

.data-table__show-narrow {
  display: block;
}

@container (min-width: 600px) {
  .data-table__header,
  .data-table__row {
    grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr) 7rem 3rem;
  }

  .data-table__hide-narrow {
    display: block;
  }

  .data-table__show-narrow {
    display: none;
  }
}
`

export function DataTableStyles() {
  return (
    <style
      data-data-table
      dangerouslySetInnerHTML={{ __html: DATA_TABLE_CSS }}
    />
  )
}

type DataTableContextValue = {
  selected: boolean
  inactive: boolean
}

const DataTableRowContext = createContext<DataTableContextValue>({
  selected: false,
  inactive: false,
})

function useDataTableRow() {
  return useContext(DataTableRowContext)
}

type DataTableProps = HTMLAttributes<HTMLDivElement> & {
  themed?: boolean
  injectStyles?: boolean
  children: ReactNode
}

export function DataTable({
  themed = false,
  injectStyles = true,
  className,
  children,
  ...props
}: DataTableProps) {
  return (
    <>
      {injectStyles ? <DataTableStyles /> : null}
      <div
        className={[
          'data-table',
          themed ? 'data-table--themed' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {children}
      </div>
    </>
  )
}

export function DataTableHeader({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={['data-table__header', className].filter(Boolean).join(' ')} {...props}>
      {children}
    </div>
  )
}

export function DataTableHeaderCell({
  className,
  align,
  responsive,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  align?: 'left' | 'right'
  responsive?: 'hide-narrow' | 'show-narrow'
}) {
  return (
    <span
      className={[
        align === 'right' ? 'data-table__cell--right' : '',
        responsive === 'hide-narrow' ? 'data-table__hide-narrow' : '',
        responsive === 'show-narrow' ? 'data-table__show-narrow' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </span>
  )
}

type DataTableRowProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean
  inactive?: boolean
}

export function DataTableRow({
  selected = false,
  inactive = false,
  className,
  disabled,
  children,
  ...props
}: DataTableRowProps) {
  const isInactive = inactive || disabled

  return (
    <DataTableRowContext.Provider value={{ selected, inactive: !!isInactive }}>
      <button
        type="button"
        disabled={isInactive}
        className={[
          'data-table__row',
          selected ? 'data-table__row--selected' : '',
          isInactive ? 'data-table__row--inactive' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {children}
      </button>
    </DataTableRowContext.Provider>
  )
}

export function DataTableCell({
  className,
  align,
  truncate,
  muted,
  responsive,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  align?: 'left' | 'right'
  truncate?: boolean
  muted?: boolean
  responsive?: 'hide-narrow' | 'show-narrow'
}) {
  return (
    <span
      className={[
        'data-table__cell',
        truncate ? 'data-table__cell--truncate' : '',
        align === 'right' ? 'data-table__cell--right' : '',
        muted ? 'data-table__cell--muted' : '',
        responsive === 'hide-narrow' ? 'data-table__hide-narrow' : '',
        responsive === 'show-narrow' ? 'data-table__show-narrow' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </span>
  )
}

export function DataTablePrimaryCell({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={['data-table__primary', className].filter(Boolean).join(' ')} {...props}>
      {children}
    </span>
  )
}

export function DataTablePrimaryLine({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={['data-table__primary-line', className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </span>
  )
}

export function DataTableIndex({
  className,
  selected,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { selected?: boolean }) {
  const row = useDataTableRow()
  const isSelected = selected ?? row.selected

  return (
    <span
      className={[
        'data-table__index',
        isSelected ? 'data-table__index--selected' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </span>
  )
}

export function DataTableSubtext({
  className,
  inline,
  responsive,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  inline?: boolean
  responsive?: 'hide-narrow' | 'show-narrow'
}) {
  return (
    <span
      className={[
        inline ? 'data-table__subtext-row' : 'data-table__subtext',
        responsive === 'hide-narrow' ? 'data-table__hide-narrow' : '',
        responsive === 'show-narrow' ? 'data-table__show-narrow' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </span>
  )
}

export function DataTableTabular({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={['data-table__tabular', className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </span>
  )
}
