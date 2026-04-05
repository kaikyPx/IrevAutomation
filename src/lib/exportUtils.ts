import * as XLSX from 'xlsx';

/**
 * Utility to export data to Excel (.xlsx) and trigger a browser download.
 */
export const exportToExcel = (data: any[][], headers: string[], filename: string) => {
  if (!data || !data.length) {
    console.error('No data to export');
    return;
  }

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  
  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Relatório");

  // Write and download
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

/**
 * @deprecated Use exportToExcel instead if preferred.
 */
export const exportToCSV = (data: any[][], headers: string[], filename: string) => {
  if (!data || !data.length) {
    console.error('No data to export');
    return;
  }

  // Helper to escape CSV values
  const escapeValue = (val: any) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Build CSV content
  const csvRows = [];
  csvRows.push(headers.map(escapeValue).join(','));
  data.forEach(row => {
    csvRows.push(row.map(escapeValue).join(','));
  });

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
