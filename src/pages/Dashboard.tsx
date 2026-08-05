import { useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { getHistory } from '../services/dataService'
import type { HistoryRow } from '../types'
import { formatCurrency, formatDate } from '../utils/calculations'

interface ChartPoint {
  date: string
  leapValue: number
  leapBasis: number
  netGainLoss: number
}

type RangeFilter = '1W' | '1M' | 'ALL'

const RANGE_DAYS: Record<RangeFilter, number | null> = {
  '1W': 7,
  '1M': 30,
  'ALL': null,
}

const toNumberOrNull = (value: string): number | null => {
  if (value === '' || value == null) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export default function Dashboard() {
  const [historyRows, setHistoryRows] = useState<HistoryRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [rangeFilter, setRangeFilter] = useState<RangeFilter>('ALL')

  useEffect(() => {
    getHistory()
      .then(setHistoryRows)
      .catch(fetchError => setLoadError(fetchError.message))
      .finally(() => setIsLoading(false))
  }, [])

  const latestRow = useMemo(() => {
    for (let i = historyRows.length - 1; i >= 0; i--) {
      if (historyRows[i].leapValue !== '') return historyRows[i]
    }
    return null
  }, [historyRows])

  const allChartPoints = useMemo<ChartPoint[]>(() => {
    return historyRows
      .map(row => {
        const leapValue = toNumberOrNull(row.leapValue)
        const leapBasis = toNumberOrNull(row.leapBasis)
        const leapRealized = toNumberOrNull(row.leapRealized)
        const leapUnrealized = toNumberOrNull(row.leapUnrealized)
        if (leapValue === null || leapBasis === null || leapRealized === null || leapUnrealized === null) {
          return null
        }
        return {
          date: row.date,
          leapValue,
          leapBasis,
          netGainLoss: leapRealized + leapUnrealized,
        }
      })
      .filter((point): point is ChartPoint => point !== null)
  }, [historyRows])

  const filteredChartPoints = useMemo(() => {
    const rangeDays = RANGE_DAYS[rangeFilter]
    if (rangeDays === null || allChartPoints.length === 0) return allChartPoints
    return allChartPoints.slice(-rangeDays)
  }, [allChartPoints, rangeFilter])

  if (isLoading) return <p>Loading...</p>
  if (loadError) return <p className="neg">Failed to load history: {loadError}</p>
  if (!latestRow) return <p>No history data available.</p>

  const leapValue = toNumberOrNull(latestRow.leapValue) ?? 0
  const leapBasis = toNumberOrNull(latestRow.leapBasis) ?? 0
  const leapUnrealized = toNumberOrNull(latestRow.leapUnrealized) ?? 0
  const leapRealized = toNumberOrNull(latestRow.leapRealized) ?? 0
  const netGainLoss = leapRealized + leapUnrealized
  const cumulativeRealizedLeaps = toNumberOrNull(latestRow.cumulativeRealizedLeaps) ?? 0
  const cumulativeUnrealizedLeaps = toNumberOrNull(latestRow.cumulativeUnrealizedLeaps) ?? 0
  const cumulativeNetDeployed = toNumberOrNull(latestRow.cumulativeNetDeployed) ?? 0

  const signClass = (value: number) => (value >= 0 ? 'pos' : 'neg')

  return (
    <div>
      <p className="as-of">As of {formatDate(latestRow.date)}</p>

      <div className="card-grid">
        <div className="card">
          <span className="card-label">LEAP Value</span>
          <span className="card-value">{formatCurrency(leapValue)}</span>
        </div>
        <div className="card">
          <span className="card-label">LEAP Basis</span>
          <span className="card-value">{formatCurrency(leapBasis)}</span>
        </div>
        <div className="card">
          <span className="card-label">LEAP Unrealized</span>
          <span className={`card-value ${signClass(leapUnrealized)}`}>{formatCurrency(leapUnrealized)}</span>
        </div>
        <div className="card">
          <span className="card-label">LEAP Realized</span>
          <span className={`card-value ${signClass(leapRealized)}`}>{formatCurrency(leapRealized)}</span>
        </div>
        <div className="card">
          <span className="card-label">Net Gain / Loss</span>
          <span className={`card-value ${signClass(netGainLoss)}`}>{formatCurrency(netGainLoss)}</span>
        </div>
        <div className="card">
          <span className="card-label">Cumulative Realized (LEAPs)</span>
          <span className={`card-value ${signClass(cumulativeRealizedLeaps)}`}>{formatCurrency(cumulativeRealizedLeaps)}</span>
        </div>
        <div className="card">
          <span className="card-label">Cumulative Unrealized (LEAPs)</span>
          <span className={`card-value ${signClass(cumulativeUnrealizedLeaps)}`}>{formatCurrency(cumulativeUnrealizedLeaps)}</span>
        </div>
        <div className="card">
          <span className="card-label">Net Capital Deployed</span>
          <span className="card-value">{formatCurrency(cumulativeNetDeployed)}</span>
        </div>
      </div>

      <div className="chart-header">
        <h3 className="chart-title">LEAP Value vs Basis vs Net Gain/Loss</h3>
        <div className="range-toggle">
          {(Object.keys(RANGE_DAYS) as RangeFilter[]).map(range => (
            <button
              key={range}
              className={rangeFilter === range ? 'range-btn active' : 'range-btn'}
              onClick={() => setRangeFilter(range)}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={filteredChartPoints}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="date" tick={{ fill: '#999', fontSize: 11 }} tickFormatter={formatDate} minTickGap={40} />
            <YAxis tick={{ fill: '#999', fontSize: 11 }} tickFormatter={value => formatCurrency(value)} width={90} />
            <Tooltip
              contentStyle={{ background: '#1a1a1a', border: '1px solid #444' }}
              labelFormatter={(label) => formatDate(String(label))}
              formatter={(value) => formatCurrency(Number(value))}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: '#ccc' }} />
            <Line type="monotone" dataKey="leapValue" name="Value" stroke="#00ff88" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="leapBasis" name="Basis" stroke="#888" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="netGainLoss" name="Net Gain/Loss" stroke="#4da6ff" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <h3 className="chart-title table-title">Raw Data</h3>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Value</th>
              <th>Basis</th>
              <th>Net Gain/Loss</th>
            </tr>
          </thead>
          <tbody>
            {[...filteredChartPoints].reverse().map(point => (
              <tr key={point.date}>
                <td>{formatDate(point.date)}</td>
                <td className="num">{formatCurrency(point.leapValue)}</td>
                <td className="num">{formatCurrency(point.leapBasis)}</td>
                <td className={`num ${signClass(point.netGainLoss)}`}>{formatCurrency(point.netGainLoss)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
