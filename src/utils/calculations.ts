import type { OpenPosition, ClosedPosition } from '../types';

export const calcPortfolioSummary = (
  openPositions: OpenPosition[],
  closedPositions: ClosedPosition[]
) => {
  const totalCostBasis = openPositions.reduce((sum, p) => sum + p.totalCostBasis, 0);
  const totalCurrentValue = openPositions.reduce((sum, p) => sum + p.currentValue, 0);
  const unrealizedPnl = totalCurrentValue - totalCostBasis;
  const unrealizedPct = totalCostBasis === 0 ? 0 : (unrealizedPnl / totalCostBasis) * 100;

  const realizedPnl = closedPositions.reduce((sum, p) => sum + p.realizedPnl, 0);
  const totalClosedCost = closedPositions.reduce((sum, p) => sum + p.costBasis, 0);
  const realizedPct = totalClosedCost === 0 ? 0 : (realizedPnl / totalClosedCost) * 100;

  const totalPnl = unrealizedPnl + realizedPnl;
  const totalBasis = totalCostBasis + totalClosedCost;
  const totalPct = totalBasis === 0 ? 0 : (totalPnl / totalBasis) * 100;

  return {
    totalCostBasis, totalCurrentValue,
    unrealizedPnl, unrealizedPct,
    realizedPnl, realizedPct,
    totalPnl, totalPct
  };
};

export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

export const formatPct = (value: number | null | undefined): string => {
  if (value == null) return '—';
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};

export const formatDate = (date: string): string => {
  if (!date || date === '—') return '—';
  let year: string, month: string, day: string;
  if (date.includes('-')) {
    [year, month, day] = date.split('-');
  } else {
    [month, day, year] = date.split('/');
  }
  return `${month.padStart(2, '0')}/${day.padStart(2, '0')}/${year}`;
};

export const toSortableDate = (date: string): string => {
  if (!date || date === '—') return '';
  if (date.includes('-')) return date;
  const [month, day, year] = date.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};