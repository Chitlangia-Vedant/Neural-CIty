export default function ErrorState({ message }) {
  return (
    <div className="state-panel error-panel" role="alert">
      <strong>Something went wrong.</strong>
      <span>{message}</span>
    </div>
  );
}
