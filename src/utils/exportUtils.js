/**
 * exportUtils.js — Shared export helpers
 * CSV/Excel export (no library needed) + PDF/PNG via html2canvas + jspdf
 */

// ── CSV Export ─────────────────────────────────────────────────────────────
export function exportToCSV(filename, rows, columns) {
  // columns: [{ header: 'Name', key: 'memberName' }, ...]
  const header = columns.map(c => `"${c.header}"`).join(',');
  const body = rows.map(row =>
    columns.map(c => {
      const val = row[c.key] ?? '';
      // Escape quotes and wrap in quotes
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',')
  );
  const csv = [header, ...body].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${filename}_${formatDateStamp()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── PDF/PNG Export ─────────────────────────────────────────────────────────
export async function exportElementAsPDF(elementId, filename) {
  const { default: html2canvas } = await import('html2canvas');
  const { default: jsPDF }       = await import('jspdf');

  const el = document.getElementById(elementId);
  if (!el) { alert('Export target not found.'); return; }

  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf     = new jsPDF('p', 'mm', 'a4');
  const pdfW    = pdf.internal.pageSize.getWidth();
  const pdfH    = (canvas.height * pdfW) / canvas.width;

  pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
  pdf.save(`${filename}_${formatDateStamp()}.pdf`);
}

export async function exportElementAsPNG(elementId, filename) {
  const { default: html2canvas } = await import('html2canvas');

  const el = document.getElementById(elementId);
  if (!el) { alert('Export target not found.'); return; }

  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  });

  const a    = document.createElement('a');
  a.href     = canvas.toDataURL('image/png');
  a.download = `${filename}_${formatDateStamp()}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ── Helper ─────────────────────────────────────────────────────────────────
function formatDateStamp() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}_${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;
}
