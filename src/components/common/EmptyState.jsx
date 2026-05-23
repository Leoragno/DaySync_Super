/**
 * Reusable empty state placeholder.
 * @param {string} label - Message to display
 * @param {React.ReactNode} [icon] - Optional icon component
 */
export default function EmptyState({ label, icon }) {
  return (
    <div className="bg-secondary rounded-2xl px-4 py-6 text-center">
      {icon && <div className="flex justify-center mb-2">{icon}</div>}
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
