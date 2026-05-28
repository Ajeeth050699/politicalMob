import { Share } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const fileSafe = (value) => clean(value).replace(/[^a-z0-9_-]+/gi, '_').replace(/^_+|_+$/g, '') || 'export';
const csvCell = (value) => `"${clean(value).replace(/"/g, '""')}"`;
const htmlCell = (value) => clean(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');
const pdfText = (value) => clean(value).replace(/[^\x20-\x7E]/g, '?').replace(/[\\()]/g, '\\$&');

function buildCsv(headers, rows) {
  return [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
}

function buildExcel(headers, rows, title) {
  const head = headers.map((h) => `<th>${htmlCell(h)}</th>`).join('');
  const body = rows
    .map((row) => `<tr>${row.map((v) => `<td>${htmlCell(v)}</td>`).join('')}</tr>`)
    .join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif}table{border-collapse:collapse;width:100%}th{background:#7B1C1C;color:#fff}td,th{border:1px solid #ddd;padding:6px;font-size:12px}</style></head><body><h2>${htmlCell(title)}</h2><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`;
}

function buildPdf(headers, rows, title) {
  const lines = [
    title,
    '',
    headers.join(' | '),
    ...rows.map((row) => row.map(clean).join(' | ')),
  ].slice(0, 46);
  const textOps = lines.map((line, index) => `BT /F1 9 Tf 40 ${780 - index * 16} Td (${pdfText(line).slice(0, 115)}) Tj ET`).join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${textOps.length} >>\nstream\n${textOps}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((obj, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return pdf;
}

async function writeAndShare({ fileName, extension, contents, message }) {
  const dir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
  if (!dir) throw new Error('File storage is not available on this device.');
  const uri = `${dir}${fileSafe(fileName)}.${extension}`;
  await FileSystem.writeAsStringAsync(uri, contents);
  const shareUri = uri.startsWith('file://') && FileSystem.getContentUriAsync
    ? await FileSystem.getContentUriAsync(uri).catch(() => uri)
    : uri;
  await Share.share({ title: fileName, message: `${message}\n${shareUri}`, url: shareUri });
  return uri;
}

export async function exportRows({ format, title, fileName, headers, rows }) {
  if (format === 'csv') {
    return writeAndShare({
      fileName,
      extension: 'csv',
      contents: buildCsv(headers, rows),
      message: `${title} CSV export ready:`,
    });
  }
  if (format === 'excel') {
    return writeAndShare({
      fileName,
      extension: 'xls',
      contents: buildExcel(headers, rows, title),
      message: `${title} Excel export ready:`,
    });
  }
  return writeAndShare({
    fileName,
    extension: 'pdf',
    contents: buildPdf(headers, rows, title),
    message: `${title} PDF export ready:`,
  });
}
