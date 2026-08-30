import React, { useState, useMemo } from 'react';
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
  actions,
  pageSize = 6,
  selectable = false,
  onSelectedChange,
  emptyMessage = 'No records found in this view.'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' | 'desc'
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Search filtering
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter(item => {
      return Object.values(item).some(val => {
        if (val === null || val === undefined) return false;
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

      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

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
    if (selectedIds.size === paginatedData.length) {
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

  return (
    <div className="ub-card" style={{ overflow: 'hidden' }}>
      {/* Table Toolbar */}
      {(title || searchable || actions || filterComponent) && (
        <div 
          style={{
            padding: 'var(--space-4) var(--space-5)',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-4)',
            flexWrap: 'wrap',
            background: 'var(--bg-surface)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1, minWidth: '260px' }}>
            {title && (
              <h3 style={{ margin: 0, fontSize: 'var(--font-size-md)', fontWeight: 700, color: 'var(--brand-navy-primary)' }}>
                {title}
              </h3>
            )}
            {searchable && (
              <div style={{ position: 'relative', flex: 1, maxWidth: '340px' }}>
                <Search 
                  size={16} 
                  style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} 
                />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="ub-input"
                  style={{ paddingLeft: '32px', fontSize: 'var(--font-size-sm)', height: '36px' }}
                />
              </div>
            )}
            {filterComponent}
          </div>

          {actions && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
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
            fontSize: 'var(--font-size-sm)'
          }}
        >
          <thead>
            <tr style={{ background: 'var(--bg-surface-secondary)', borderBottom: '1px solid var(--border-medium)' }}>
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
                    color: 'var(--brand-navy-primary)',
                    cursor: col.sortable !== false ? 'pointer' : 'default',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    width: col.width
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{col.header}</span>
                    {col.sortable !== false && (
                      <span style={{ color: sortField === col.accessor ? 'var(--brand-blue)' : 'var(--text-muted)' }}>
                        {sortField === col.accessor ? (
                          sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                        ) : (
                          <ChevronsUpDown size={13} opacity={0.5} />
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
                  style={{ padding: 'var(--space-10) var(--space-4)', textAlign: 'center', color: 'var(--text-secondary)' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <Search size={32} style={{ color: 'var(--text-muted)' }} />
                    <p style={{ fontWeight: 600 }}>{emptyMessage}</p>
                    {searchTerm && (
                      <Button size="sm" variant="secondary" onClick={() => setSearchTerm('')}>
                        Clear search filter
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
                      borderBottom: '1px solid var(--border-light)',
                      background: isSelected ? 'var(--brand-blue-light)' : 'transparent',
                      transition: 'background-color var(--transition-fast)'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-surface-secondary)';
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
                          whiteSpace: col.noWrap ? 'nowrap' : 'normal'
                        }}
                      >
                        {col.render ? col.render(row[col.accessor], row) : row[col.accessor]}
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
          padding: 'var(--space-3) var(--space-5)',
          borderTop: '1px solid var(--border-light)',
          background: 'var(--bg-surface-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 'var(--font-size-xs)',
          color: 'var(--text-secondary)',
          flexWrap: 'wrap',
          gap: 'var(--space-2)'
        }}
      >
        <div>
          Showing <b>{sortedData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</b> to{' '}
          <b>{Math.min(currentPage * pageSize, sortedData.length)}</b> of <b>{sortedData.length}</b> records
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Button
            size="sm"
            variant="secondary"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            icon={ChevronLeft}
          >
            Previous
          </Button>

          <span style={{ fontWeight: 600, padding: '0 6px' }}>
            Page {currentPage} of {totalPages}
          </span>

          <Button
            size="sm"
            variant="secondary"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
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
