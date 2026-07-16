import type { ClosedPosition, HistoryRow, OpenPosition } from '../types';

const BASE = import.meta.env.BASE_URL;

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${path}: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export function getOpenPositions(): Promise<OpenPosition[]> {
  return fetchJson<OpenPosition[]>('open_positions.json');
}

export function getClosedPositions(): Promise<ClosedPosition[]> {
  return fetchJson<ClosedPosition[]>('closed_positions.json');
}

export function getHistory(): Promise<HistoryRow[]> {
  return fetchJson<HistoryRow[]>('history.json');
}
