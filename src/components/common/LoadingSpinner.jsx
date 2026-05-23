/**
 * Consistent loading spinner used throughout the app.
 * @param {boolean} fullScreen - If true, takes full viewport height
 */
export default function LoadingSpinner({ fullScreen = false }) {
  const wrapperClass = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-background z-50'
    : 'flex items-center justify-center py-12';

  return (
    <div className={wrapperClass}>
      <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin" />
    </div>
  );
}
