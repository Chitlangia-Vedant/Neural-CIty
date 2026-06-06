export default function LoadingState({ label = 'Loading city data' }) {
  return (
    <div className="state-panel" role="status" aria-live="polite">
      <span className="spinner" />
      <span>{label}</span>
    </div>
  );
}
