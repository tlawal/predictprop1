'use client';

export default function TiersTable({ tiers }) {
  const rows = tiers || [];

  return (
    <table className="min-w-full text-sm">
      <thead className="bg-gray-900/80 text-xs uppercase tracking-wide text-gray-400">
        <tr>
          <th className="px-4 py-3 text-left">Tier</th>
          <th className="px-4 py-3 text-right">Referral Threshold</th>
          <th className="px-4 py-3 text-right">Payout %</th>
          <th className="px-4 py-3 text-right">Direct Pass Up %</th>
          <th className="px-4 py-3 text-right">Indirect Pass Up %</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-800">
        {rows.length ? (
          rows.map((tier) => (
            <tr key={tier.level}>
              <td className="px-4 py-3 text-gray-200">Tier {tier.level}</td>
              <td className="px-4 py-3 text-right text-gray-200">{tier.referralThreshold ?? '—'}</td>
              <td className="px-4 py-3 text-right text-gray-200">{formatPercent(tier.payoutPercent)}</td>
              <td className="px-4 py-3 text-right text-gray-200">{formatPercent(tier.directPassup)}</td>
              <td className="px-4 py-3 text-right text-gray-200">{formatPercent(tier.indirectPassup)}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
              No tier data available.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function formatPercent(value) {
  if (value === null || value === undefined) return '—';
  const num = Number(value);
  if (!Number.isFinite(num)) return '—';
  return `${num}%`;
}
