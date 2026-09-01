import React, { useState, useMemo, useEffect } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  ChevronsUpDown, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Filter,
  Download,
  CheckSquare,
  Square
} from 'lucide-react';
import { Button } from './Button';

export const DataTable = ({
  columns = [],
  data = [],
  keyField = 'id',
  searchable = true,
  searchPlaceholder = 'Search records...',
  filterComponent,
  title,
  subtitle,
  actions,
  pageSize = 10,
  pageSizeOptions = [5, 10, 25, 50, 100],
  selectable = false,
  onSelectedChange,
  emptyMessage = 'No records found in this view.'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' | 'desc'
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(pageSize);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Reset page on search or data change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, data.length, rowsPerPage]);

  // Search filtering
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter(item => {
      return Object.values(item).some(val => {
        if (val === null || val === undefined) return false;
        if (typeof val === 'object') {
          return JSON.stringify(val).toLowerCase().includes(term);
        }
        return String(val).toLowerCase().includes(term);
      });
    });
  }, [data, searchTerm]);

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortField) return filteredData;
    return [...filteredData].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (aVal === undefined || aVal === null) aVal = '';
      if (bVal === undefined || bVal === null) bVal = '';

      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedData.length / rowsPerPage));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedData.slice(start, start + rowsPerPage);
  }, [sortedData, currentPage, rowsPerPage]);

  const handleSort = (field) => {
    if (sortField === field) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else {
        setSortField(null);
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedData.length && paginatedData.length > 0) {
      setSelectedIds(new Set());
      onSelectedChange?.([]);
    } else {
      const all = new Set(paginatedData.map(d => d[keyField]));
      setSelectedIds(all);
      onSelectedChange?.(Array.from(all));
    }
  };

  const toggleSelectRow = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
    onSelectedChange?.(Array.from(next));
  };

  // Generate pagination buttons
  const getPageNumbers = () => {
    const pages = [];
    const maxButtons = 5;
    if (totalPages <= maxButtons) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, start + maxButtons - 1);
      if (end - start < maxButtons - 1) {
        start = Math.max(1, end - maxButtons + 1);
      }
      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  };

  return (
    <div 
      style={{ 
        backgroundColor: 'var(--bg-card)', 
        borderRadius: '12px', 
        border: '1px solid var(--border-medium)', 
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)'
      }}
    >
      {/* Table Toolbar */}
      {(title || searchable || actions || filterComponent) && (
        <div 
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-medium)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
            background: 'var(--bg-card)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px', flexWrap: 'wrap' }}>
            {title && (
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {title}
                </h3>
                {subtitle && (
                  <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
                    {subtitle}
                  </p>
                )}
              </div>
            )}
            {searchable && (
              <div style={{ position: 'relative', flex: 1, maxWidth: '320px', minWidth: '180px' }}>
                <Search 
                  size={14} 
                  style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} 
                />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 32px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-medium)',
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text-primary)',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            )}
            {filterComponent}
          </div>

          {actions && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Table Container */}
      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table 
          style={{ 
            width: '100%', 
            borderCollapse: 'collapse', 
            textAlign: 'left',
            fontSize: '13px'
          }}
        >
          <thead>
            <tr style={{ background: 'var(--bg-app)', borderBottom: '1px solid var(--border-medium)' }}>
              {selectable && (
                <th style={{ width: '40px', padding: '10px 14px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={paginatedData.length > 0 && selectedIds.size === paginatedData.length}
                    onChange={toggleSelectAll}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key || col.accessor}
                  onClick={() => col.sortable !== false && handleSort(col.accessor)}
                  style={{
                    padding: '12px 16px',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: col.sortable !== false ? 'pointer' : 'default',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    width: col.width,
                    textAlign: col.align || 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start' }}>
                    <span>{col.header}</span>
                    {col.sortable !== false && (
                      <span style={{ color: sortField === col.accessor ? 'var(--brand-cyan)' : 'var(--text-muted)' }}>
                        {sortField === col.accessor ? (
                          sortDirection === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />
                        ) : (
                          <ChevronsUpDown size={12} opacity={0.4} />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td 
                  colSpan={columns.length + (selectable ? 1 : 0)} 
                  style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-muted)' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <Search size={28} style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
                    <p style={{ fontWeight: 600, fontSize: '13px', margin: 0 }}>{emptyMessage}</p>
                    {searchTerm && (
                      <Button size="sm" variant="secondary" onClick={() => setSearchTerm('')}>
                        Clear Search
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => {
                const rowKey = row[keyField] || idx;
                const isSelected = selectedIds.has(rowKey);

                return (
                  <tr
                    key={rowKey}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      background: isSelected ? 'rgba(0, 102, 204, 0.08)' : 'transparent',
                      transition: 'background-color 0.15s'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {selectable && (
                      <td style={{ textAlign: 'center', padding: '10px 14px' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(rowKey)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td 
                        key={col.key || col.accessor}
                        style={{
                          padding: '12px 16px',
                          color: 'var(--text-primary)',
                          verticalAlign: 'middle',
                          whiteSpace: col.noWrap ? 'nowrap' : 'normal',
                          textAlign: col.align || 'left'
                        }}
                      >
                        {col.render 
                          ? col.render(row[col.accessor], row, (currentPage - 1) * rowsPerPage + idx) 
                          : row[col.accessor]}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Pagination Footer */}
      <div 
        style={{
          padding: '12px 18px',
          borderTop: '1px solid var(--border-medium)',
          background: 'var(--bg-app)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: 'var(--text-muted)',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div>
            Showing <b>{sortedData.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}</b> to{' '}
            <b>{Math.min(currentPage * rowsPerPage, sortedData.length)}</b> of <b>{sortedData.length}</b> records
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px' }}>Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
              style={{
                padding: '3px 8px',
                borderRadius: '4px',
                border: '1px solid var(--border-medium)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              {pageSizeOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Pagination Page Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Button
            size="sm"
            variant="secondary"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            style={{ padding: '4px 8px', fontSize: '11px' }}
            icon={ChevronLeft}
          >
            Prev
          </Button>

          {getPageNumbers().map(pageNum => (
            <button
              key={pageNum}
              type="button"
              onClick={() => setCurrentPage(pageNum)}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                border: currentPage === pageNum ? '1px solid var(--brand-blue)' : '1px solid var(--border-medium)',
                backgroundColor: currentPage === pageNum ? 'var(--brand-blue)' : 'var(--bg-card)',
                color: currentPage === pageNum ? '#FFFFFF' : 'var(--text-secondary)',
                fontWeight: currentPage === pageNum ? 700 : 500,
                fontSize: '11px',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              {pageNum}
            </button>
          ))}

          <Button
            size="sm"
            variant="secondary"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            style={{ padding: '4px 8px', fontSize: '11px' }}
            icon={ChevronRight}
            iconPosition="right"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;

