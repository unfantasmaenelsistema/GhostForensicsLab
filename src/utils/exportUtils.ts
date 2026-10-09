/**
 * Utility functions for exporting DFIR forensics data to CSV and JSON formats
 * Designed for GhostForensics Lab (Un Fantasma En El Sistema)
 */

export interface ExportMetadata {
  caseId?: string;
  caseTitle?: string;
  viewName: string;
  exportedAt: string;
  totalRecords: number;
  environment?: string;
  analystTool?: string;
}

/**
 * Escapes a cell value for standard RFC 4180 CSV
 */
export function escapeCsvCell(value: any): string {
  if (value === null || value === undefined) {
    return '""';
  }
  
  if (typeof value === 'object') {
    value = JSON.stringify(value);
  } else {
    value = String(value);
  }

  // If value contains quotes, commas, newlines, or carriage returns, wrap in quotes and escape internal quotes
  if (value.includes('"') || value.includes(',') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return `"${value}"`;
}

/**
 * Converts generic tabular data to RFC 4180 CSV string with UTF-8 BOM
 */
export function convertToCsv<T>(
  data: T[],
  columns?: { header: string; accessor: (item: T) => any }[]
): string {
  if (!data || data.length === 0) {
    return '';
  }

  let headers: string[] = [];
  let rows: string[][] = [];

  if (columns && columns.length > 0) {
    headers = columns.map((col) => col.header);
    rows = data.map((item) =>
      columns.map((col) => {
        try {
          return escapeCsvCell(col.accessor(item));
        } catch {
          return '""';
        }
      })
    );
  } else {
    // Infer headers from first item keys
    const sample = data[0];
    if (typeof sample === 'object' && sample !== null) {
      headers = Object.keys(sample as any);
      rows = data.map((item) =>
        headers.map((key) => escapeCsvCell((item as any)[key]))
      );
    } else {
      headers = ['Value'];
      rows = data.map((item) => [escapeCsvCell(item)]);
    }
  }

  // Prepend UTF-8 BOM (\uFEFF) for automatic UTF-8 recognition in Excel and other spreadsheet viewers
  const csvContent = [
    headers.map((h) => escapeCsvCell(h)).join(','),
    ...rows.map((r) => r.join(','))
  ].join('\r\n');

  return '\uFEFF' + csvContent;
}

/**
 * Converts data to formatted JSON with DFIR incident metadata
 */
export function convertToJson<T>(
  data: T,
  metadata?: Partial<ExportMetadata>
): string {
  const fullPayload = {
    metadata: {
      platform: 'GhostForensics Lab - Simulador de Análisis Forense Digital (DFIR)',
      labUrl: 'https://www.unfantasmaenelsistema.com/',
      caseId: 'GHOST-DFIR-2026-0314',
      caseTitle: 'Incidente RDP BruteForce, LSASS Injection y DNS Tunneling',
      hostname: 'WORKSTATION-09.corp.internal',
      exportedAt: new Date().toISOString(),
      recordCount: Array.isArray(data) ? data.length : 1,
      ...metadata
    },
    records: data
  };

  return JSON.stringify(fullPayload, null, 2);
}

/**
 * Triggers a file download in the browser with appropriate MIME type
 */
export function triggerFileDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
