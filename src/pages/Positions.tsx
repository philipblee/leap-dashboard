import { useEffect, useMemo, useState } from 'react'
import { getOpenPositions } from '../services/dataService'
import type { OpenPosition } from '../types'
import { formatCurrency, formatPct } from '../utils/calculations'

const COLUMN_LABELS = [
  'Ticker', 'Type', 'Strike', 'Expiry', 'Buy Date', 'Qty',
  'Current Value', 'Cost Basis', 'P&L $', 'P&L %', 'Account',
]

type SortDirection = 'asc' | 'desc'

const compareValues = (left: string | number, right: string | number): number => {
  if (typeof left === 'number' && typeof right === 'number') return left - right
  return String(left).localeCompare(String(right))
}

export default function Positions() {
  const [openPositionRows, setOpenPositionRows] = useState<OpenPosition[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [accountFilter, setAccountFilter] = useState('ALL')
  const [sortColumn, setSortColumn] = useState('Ticker')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  useEffect(() => {
    getOpenPositions()
      .then(setOpenPositionRows)
      .catch(fetchError => setLoadError(fetchError.message))
      .finally(() => setIsLoading(false))
  }, [])

  const distinctAccounts = useMemo(
    () => Array.from(new Set(openPositionRows.map(position => position.accountName))).sort(),
    [openPositionRows]
  )

  const filteredPositions = useMemo(
    () => accountFilter === 'ALL'
      ? openPositionRows
      : openPositionRows.filter(position => position.accountName === accountFilter),
    [openPositionRows, accountFilter]
  )

  const sortedPositions = useMemo(() => {
    const sortValue = (position: OpenPosition): string | number => {
      switch (sortColumn) {
        case 'Ticker':        return position.ticker
        case 'Type':          return position.optionType
        case 'Strike':        return Number(position.strike)
        case 'Expiry':        return position.expiry
        case 'Buy Date':      return position.buyDate
        case 'Qty':           return position.openContracts
        case 'Current Value': return position.currentValue
        case 'Cost Basis':    return position.totalCostBasis
        case 'P&L $':         return position.unrealizedPnl
        case 'P&L %':         return position.unrealizedPct
        case 'Account':       return position.accountName
        default:              return ''
      }
    }
    const direction = sortDirection === 'asc' ? 1 : -1
    return [...filteredPositions].sort(
      (leftPosition, rightPosition) => compareValues(sortValue(leftPosition), sortValue(rightPosition)) * direction
    )
  }, [filteredPositions, sortColumn, sortDirection])

  const filteredTotals = useMemo(() => {
    const contracts = filteredPositions.reduce((sum, position) => sum + position.openContracts, 0)
    const currentValue = filteredPositions.reduce((sum, position) => sum + position.currentValue, 0)
    const costBasis = filteredPositions.reduce((sum, position) => sum + position.totalCostBasis, 0)
    const unrealizedPnl = currentValue - costBasis
    const unrealizedPct = costBasis === 0 ? 0 : (unrealizedPnl / costBasis) * 100
    return { contracts, currentValue, costBasis, unrealizedPnl, unrealizedPct }
  }, [filteredPositions])

  const handleSort = (columnLabel: string) => {
    if (sortColumn === columnLabel) {
      setSortDirection(previous => (previous === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortColumn(columnLabel)
      setSortDirection('asc')
    }
  }

  const signClass = (value: number) => (value >= 0 ? 'pos' : 'neg')

  if (isLoading) return <p>Loading...</p>
  if (loadError) return <p className="neg">Failed to load open positions: {loadError}</p>

  return (
    <div>
      <div className="table-controls">
        <select value={accountFilter} onChange={event => setAccountFilter(event.target.value)}>
          <option value="ALL">All accounts</option>
          {distinctAccounts.map(accountName => (
            <option key={accountName} value={accountName}>{accountName}</option>
          ))}
        </select>
        <span className="row-count">{sortedPositions.length} positions</span>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {COLUMN_LABELS.map(columnLabel => (
                <th key={columnLabel} onClick={() => handleSort(columnLabel)}>
                  {columnLabel} {sortColumn === columnLabel ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedPositions.map((position, rowIndex) => (
              <tr key={`${position.id}_${rowIndex}`}>
                <td>{position.ticker}</td>
                <td>{position.optionType}</td>
                <td className="num">${position.strike}</td>
                <td>{position.expiry}</td>
                <td>{position.buyDate}</td>
                <td className="num">{position.openContracts}</td>
                <td className="num">{formatCurrency(position.currentValue)}</td>
                <td className="num">{formatCurrency(position.totalCostBasis)}</td>
                <td className={`num ${signClass(position.unrealizedPnl)}`}>{formatCurrency(position.unrealizedPnl)}</td>
                <td className={`num ${signClass(position.unrealizedPct)}`}>{formatPct(position.unrealizedPct)}</td>
                <td>{position.accountName}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5}><strong>TOTAL</strong></td>
              <td className="num"><strong>{filteredTotals.contracts}</strong></td>
              <td className="num"><strong>{formatCurrency(filteredTotals.currentValue)}</strong></td>
              <td className="num"><strong>{formatCurrency(filteredTotals.costBasis)}</strong></td>
              <td className={`num ${signClass(filteredTotals.unrealizedPnl)}`}><strong>{formatCurrency(filteredTotals.unrealizedPnl)}</strong></td>
              <td className={`num ${signClass(filteredTotals.unrealizedPct)}`}><strong>{formatPct(filteredTotals.unrealizedPct)}</strong></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
