/**
 * Virtual scrolling table component for handling large datasets
 * Renders only visible rows to improve performance with thousands of items
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { List, type RowComponentProps, type ListImperativeAPI } from 'react-window'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'

interface VirtualTableColumn<T> {
  key: string
  header: string
  width: number
  minWidth?: number
  render: (item: T, index: number) => React.ReactNode
  sortable?: boolean
  sticky?: 'left' | 'right'
}

interface VirtualTableProps<T> {
  data: T[]
  columns: VirtualTableColumn<T>[]
  height: number
  rowHeight?: number
  overscan?: number
  onRowClick?: (item: T, index: number) => void
  onSort?: (column: string, direction: 'asc' | 'desc') => void
  sortColumn?: string
  sortDirection?: 'asc' | 'desc'
  className?: string
  loading?: boolean
  emptyMessage?: string
}

interface VirtualTableRowData<T> {
  items: T[]
  columns: VirtualTableColumn<T>[]
  onRowClick?: (item: T, index: number) => void
}

// react-window v2 passes `index`/`style` plus the `rowProps` object directly to
// the row component (no more nested `data`).
function VirtualTableRow<T>({
  index,
  style,
  items,
  columns,
  onRowClick,
}: RowComponentProps<VirtualTableRowData<T>>) {
  const item = items[index]

  if (!item) return null

  return (
    <div 
      style={style} 
      className="flex border-b border-border hover:bg-muted/50 cursor-pointer"
      onClick={() => onRowClick?.(item, index)}
    >
      {columns.map((column, colIndex) => (
        <div
          key={column.key}
          className={`
            flex items-center px-4 py-2 text-sm
            ${column.sticky === 'left' ? 'sticky left-0 bg-background z-10' : ''}
            ${column.sticky === 'right' ? 'sticky right-0 bg-background z-10' : ''}
          `}
          style={{ 
            width: column.width,
            minWidth: column.minWidth || column.width,
            flexShrink: 0
          }}
        >
          {column.render(item, index)}
        </div>
      ))}
    </div>
  )
}

export function VirtualTable<T>({
  data,
  columns,
  height,
  rowHeight = 48,
  overscan = 5,
  onRowClick,
  onSort,
  sortColumn,
  sortDirection,
  className = '',
  loading = false,
  emptyMessage = 'No data available'
}: VirtualTableProps<T>) {
  const listRef = useRef<ListImperativeAPI | null>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Calculate total width needed for all columns
  const totalWidth = useMemo(() => {
    return columns.reduce((sum, col) => sum + col.width, 0)
  }, [columns])

  // Handle container resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth)
      }
    }

    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  // Handle sort
  const handleSort = useCallback((column: VirtualTableColumn<T>) => {
    if (!column.sortable || !onSort) return

    const newDirection = 
      sortColumn === column.key && sortDirection === 'asc' ? 'desc' : 'asc'
    onSort(column.key, newDirection)
  }, [sortColumn, sortDirection, onSort])

  // Render sort icon
  const renderSortIcon = (column: VirtualTableColumn<T>) => {
    if (!column.sortable || sortColumn !== column.key) return null
    
    return (
      <span className="ml-1">
        {sortDirection === 'asc' ? '↑' : '↓'}
      </span>
    )
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className={`border rounded-lg ${className}`} style={{ height }}>
        <div className="p-4">
          <div className="animate-pulse space-y-2">
            {Array.from({ length: Math.floor(height / rowHeight) }).map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className={`border rounded-lg ${className}`} style={{ height }}>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className={`border rounded-lg overflow-hidden ${className}`}
      style={{ height }}
    >
      {/* Header */}
      <div 
        className="flex bg-muted/50 border-b border-border sticky top-0 z-20"
        style={{ width: Math.max(totalWidth, containerWidth) }}
      >
        {columns.map((column) => (
          <div
            key={column.key}
            className={`
              flex items-center px-4 py-3 text-sm font-medium
              ${column.sortable ? 'cursor-pointer hover:bg-muted' : ''}
              ${column.sticky === 'left' ? 'sticky left-0 bg-muted/50 z-30' : ''}
              ${column.sticky === 'right' ? 'sticky right-0 bg-muted/50 z-30' : ''}
            `}
            style={{ 
              width: column.width,
              minWidth: column.minWidth || column.width,
              flexShrink: 0
            }}
            onClick={() => handleSort(column)}
          >
            {column.header}
            {renderSortIcon(column)}
          </div>
        ))}
      </div>

      {/* Virtual scrolling body */}
      <div style={{ height: height - 49 }}> {/* Subtract header height */}
        <List
          listRef={listRef}
          rowCount={data.length}
          rowHeight={rowHeight}
          overscanCount={overscan}
          rowComponent={VirtualTableRow}
          rowProps={{
            items: data as unknown[],
            columns: columns as VirtualTableColumn<unknown>[],
            onRowClick: onRowClick as ((item: unknown, index: number) => void) | undefined
          }}
          style={{ height: height - 49, width: Math.max(totalWidth, containerWidth) }}
        />
      </div>
    </div>
  )
}

// Hook for managing virtual table state
export function useVirtualTable<T>(
  data: T[],
  initialSortColumn?: string,
  initialSortDirection: 'asc' | 'desc' = 'asc'
) {
  const [sortColumn, setSortColumn] = useState<string | undefined>(initialSortColumn)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(initialSortDirection)

  const handleSort = useCallback((column: string, direction: 'asc' | 'desc') => {
    setSortColumn(column)
    setSortDirection(direction)
  }, [])

  const sortedData = useMemo(() => {
    if (!sortColumn) return data

    return [...data].sort((a, b) => {
      const aValue = (a as any)[sortColumn]
      const bValue = (b as any)[sortColumn]

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [data, sortColumn, sortDirection])

  return {
    sortedData,
    sortColumn,
    sortDirection,
    handleSort
  }
}