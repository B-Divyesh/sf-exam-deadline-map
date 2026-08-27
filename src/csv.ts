export interface DeckImport {
  name: string;
  rows: number;
  newCards: number;
  reviewCards: number;
  note?: string;
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted && char === '"' && text[index + 1] === '"') { value += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { row.push(value); value = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      row.push(value); value = '';
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
    } else value += char;
  }
  row.push(value);
  if (row.some((cell) => cell.trim())) rows.push(row);
  return rows;
}

const normalize = (value: string) => value.trim().toLowerCase().replace(/[\s_-]+/g, '');

export function summarizeDeck(text: string, filename = 'Imported deck'): DeckImport {
  const rows = parseCsv(text.replace(/^\uFEFF/, ''));
  if (rows.length < 2) throw new Error('This CSV has no card rows. Export a deck with a header row and try again.');
  const headers = rows[0].map(normalize);
  const repsIndex = headers.findIndex((value) => ['reps', 'reviews', 'reviewcount', 'timesreviewed'].includes(value));
  const typeIndex = headers.findIndex((value) => ['type', 'state', 'status', 'queue'].includes(value));
  const isNew = (cells: string[]) => {
    if (repsIndex >= 0) return Number.parseFloat(cells[repsIndex] || '0') <= 0;
    if (typeIndex >= 0) return /new|unseen|0/.test((cells[typeIndex] || '').toLowerCase());
    return false;
  };
  const data = rows.slice(1).filter((cells) => cells.some((cell) => cell.trim()));
  const newCards = data.filter(isNew).length;
  return {
    name: filename.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim() || 'Imported deck',
    rows: data.length,
    newCards,
    reviewCards: data.length - newCards,
    note: repsIndex < 0 && typeIndex < 0 ? 'No reps/type column was found, so all rows are counted as review cards. You can correct the counts below.' : undefined,
  };
}
