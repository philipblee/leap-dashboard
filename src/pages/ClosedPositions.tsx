import { useEffect, useMemo, useState } from 'react'
import { getClosedPositions } from '../services/dataService'
import type { ClosedPosition } from '../types'
import { formatCurrency, formatPct } from '../utils/calculations'
import { compareValues } from '../utils/sorting'

const COLUMN_LABELS = [
  'Ticker', 'Type', 'Strike', 'Expiry', 'Buy Date', 'Sell Date', 'Qty',
  'Cost Basis', 'Proceeds', 'P&L $', 'P&L %', 'Account',
]

type SortDirection = 'asc' | 'desc'

export default function ClosedPositions() {
  const [closedPositionRows, setClosedPositionRows] = useState<ClosedPosition[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [accountFilter, setAccountFilter] = useState('ALL')
  const [sortColumn, setSortColumn] = useState('Sell Date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  useEffect(() => {
    getClosedPositions()
      .then(setClosedPositionRows)
      .catch(fetchError => setLoadError(fetchError.message))
      .finally(() => setIsLoading(false))
  }, [])

  const distinctAccounts = useMemo(
    () => Array.from(new Set(closedPositionRows.map(position => position.accountName))).sort(),
    [closedPositionRows]
  )

  const filteredPositions = useMemo(
    () => accountFilter === 'ALL'
      ? closedPositionRows
      : closedPositionRows.filter(position => position.accountName === accountFilter),
    [closedPositionRows, accountFilter]
  )

  const sortedPositions = useMemo(() => {
    const sortValue = (position: ClosedPosition): string | number => {
      switch (sortColumn) {
        case 'Ticker':     return position.ticker
        case 'Type':       return position.optionType
        case 'Strike':     return Number(position.strike)
        case 'Expiry':     return position.expiry
        case 'Buy Date':   return position.buyDate
        case 'Sell Date':  return position.sellDate
        case 'Qty':        return position.contractsSold
        case 'Cost Basis': return position.costBasis
        case 'Proceeds':   return position.proceeds
        case 'P&L $':      return position.realizedPnl
        case 'P&L %':      return position.realizedPct
        case 'Account':    return position.accountName
        default:           return ''
      }
    }
    const direction = sortDirection === 'asc' ? 1 : -1
    return [...filteredPositions].sort(
      (leftPosition, rightPosition) => compareValues(sortValue(leftPosition), sortValue(rightPosition)) * direction
    )
  }, [filteredPositions, sortColumn, sortDirection])

  const filteredTotals = useMemo(() => {
    const contracts = filteredPositions.reduce((sum, position) => sum + position.contractsSold, 0)
    const costBasis = filteredPositions.reduce((sum, position) => sum + position.costBasis, 0)
    const proceeds = filteredPositions.reduce((sum, position) => sum + position.proceeds, 0)
    const realizedPnl = proceeds - costBasis
    const realizedPct = costBasis === 0 ? 0 : (realizedPnl / costBasis) * 100
    return { contracts, costBasis, proceeds, realizedPnl, realizedPct }
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
  if (loadError) return <p className="neg">Failed to load closed positions: {loadError}</p>

  return (
    <div>
      <div className="table-controls">
        <select value={accountFilter} onChange={event => setAccountFilter(event.target.value)}>
          <option value="ALL">All accounts</option>
          {distinctAccounts.map(accountName => (
            <option key={accountName} value={accountName}>{accountName}</option>
          ))}
        </select>
        <span className="row-count">{sortedPositions.length} closed positions</span>
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
                <td>{position.sellDate}</td>
                <td className="num">{position.contractsSold}</td>
                <td className="num">{formatCurrency(position.costBasis)}</td>
                <td className="num">{formatCurrency(position.proceeds)}</td>
                <td className={`num ${signClass(position.realizedPnl)}`}>{formatCurrency(position.realizedPnl)}</td>
                <td className={`num ${signClass(position.realizedPct)}`}>{formatPct(position.realizedPct)}</td>
                <td>{position.accountName}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={6}><strong>TOTAL</strong></td>
              <td className="num"><strong>{filteredTotals.contracts}</strong></td>
              <td className="num"><strong>{formatCurrency(filteredTotals.costBasis)}</strong></td>
              <td className="num"><strong>{formatCurrency(filteredTotals.proceeds)}</strong></td>
              <td className={`num ${signClass(filteredTotals.realizedPnl)}`}><strong>{formatCurrency(filteredTotals.realizedPnl)}</strong></td>
              <td className={`num ${signClass(filteredTotals.realizedPct)}`}><strong>{formatPct(filteredTotals.realizedPct)}</strong></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
