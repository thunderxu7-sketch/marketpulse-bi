export function DashboardSkeleton() {
  return (
    <div aria-label="Loading dashboard" className="skeleton-stack" role="status">
      <div className="metric-grid">{[0, 1, 2, 3].map((item) => <div className="metric-card skeleton" key={item} />)}</div>
      <div className="dashboard-grid"><div className="panel skeleton skeleton-large" /><div className="panel skeleton skeleton-large" /></div>
    </div>
  );
}
