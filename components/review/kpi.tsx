import type { ReactNode } from 'react';
import { Ic } from '@/components/membership/ui';

/** KPI tile (prototype M.K): icon, label, value, one line underneath; optionally a link or a button */
export function Kpi({
  label,
  value,
  sub,
  icon,
  color,
  wrap,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon: string;
  color: string;
  wrap?: (inner: ReactNode) => ReactNode;
}) {
  const inner = (
    <>
      <div className="ki" style={{ background: `${color}22` }}>
        <Ic name={icon} size={28} color={color} />
      </div>
      <div>
        <small>{label}</small>
        <br />
        <b>{value}</b>
        <p>{sub}</p>
      </div>
    </>
  );
  return wrap ? wrap(inner) : <div className="kpi st">{inner}</div>;
}

export const STAGE_TONE: Record<string, 'green' | 'red' | 'orange' | 'blue' | 'gray'> = {
  submitted: 'orange',
  review: 'orange',
  returned: 'red',
  proposer: 'blue',
  committee: 'blue',
  payment: 'blue',
  temp: 'green',
  permanent: 'green',
  rejected: 'red',
  withdrawn: 'gray',
  draft: 'gray',
};
