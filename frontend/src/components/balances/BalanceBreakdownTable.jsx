/**
 * BalanceBreakdownTable
 *
 * Renders a grouped breakdown table by item and subitem.
 *
 * Props:
 * - breakdown: array of { id, item_id, item_name, subitem_id, subitem_name, amount, currency }
 * - currency: currently selected currency filter
 */
export default function BalanceBreakdownTable({ breakdown = [], currency = 'ARS' }) {
  const filtered = breakdown.filter((row) => row.currency === currency);

  if (filtered.length === 0) {
    return (
      <div className="card text-center py-8 text-gray-400 text-sm">
        No hay desglose disponible en {currency} para este balance.
      </div>
    );
  }

  // Group by item
  const grouped = {};
  filtered.forEach((row) => {
    const key = row.item_id;
    if (!grouped[key]) {
      grouped[key] = { item_name: row.item_name, rows: [], total: 0 };
    }
    grouped[key].rows.push(row);
    grouped[key].total += Number(row.amount);
  });

  const formatMoney = (amount) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);

  const grandTotal = filtered.reduce((sum, r) => sum + Number(r.amount), 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-200 text-left text-xs text-gray-500 uppercase tracking-wide">
            <th className="pb-2 pr-4 font-semibold">Item</th>
            <th className="pb-2 pr-4 font-semibold">Subitem</th>
            <th className="pb-2 text-right font-semibold">Monto ({currency})</th>
          </tr>
        </thead>
        <tbody>
          {Object.values(grouped).map((group) => (
            <>
              {group.rows.map((row, idx) => (
                <tr
                  key={row.id}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                >
                  {idx === 0 ? (
                    <td
                      className="py-2 pr-4 font-semibold text-gray-800 align-top"
                      rowSpan={group.rows.length}
                    >
                      {group.item_name}
                    </td>
                  ) : null}
                  <td className="py-2 pr-4 text-gray-600">
                    {row.subitem_name || <span className="text-gray-400 italic">Sin subitem</span>}
                  </td>
                  <td className="py-2 text-right font-mono">
                    <span className={Number(row.amount) < 0 ? 'text-red-600' : 'text-gray-800'}>
                      {formatMoney(row.amount)}
                    </span>
                  </td>
                </tr>
              ))}
              {/* Item subtotal row */}
              <tr className="bg-gray-50 border-b border-gray-200">
                <td colSpan={2} className="py-1.5 pr-4 text-xs font-bold text-gray-500 uppercase">
                  Subtotal {group.item_name}
                </td>
                <td className="py-1.5 text-right font-mono text-xs font-bold">
                  <span className={group.total < 0 ? 'text-red-600' : 'text-gray-700'}>
                    {formatMoney(group.total)}
                  </span>
                </td>
              </tr>
            </>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-100 border-t-2 border-gray-300">
            <td colSpan={2} className="py-2 pr-4 font-extrabold text-gray-800">
              TOTAL
            </td>
            <td className="py-2 text-right font-mono font-extrabold text-gray-900">
              <span className={grandTotal < 0 ? 'text-red-700' : ''}>
                {formatMoney(grandTotal)}
              </span>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
