export function EmptyState({ children, className = "" }) {
  return (
    <div className={`border border-2 border-dashed rounded-3 p-4 text-center small text-body-secondary ${className}`}
         style={{ borderStyle: "dashed" }}>
      {children}
    </div>
  );
}
