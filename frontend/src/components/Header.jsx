import { Link } from 'react-router-dom';

export default function Header({ showBack = false, theme = 'light', onToggleTheme }) {
  return (
    <header className="app-header">
      <Link className="brand" to="/" aria-label="Go to rankings">
        <span className="brand-mark" aria-hidden="true">NC</span>
        <span>
          <strong>Neural City</strong>
          <small>Indian city livability index</small>
        </span>
      </Link>
      <div className="header-actions">
        {showBack && (
          <Link className="ghost-button" to="/">
            Back to rankings
          </Link>
        )}
        <label className="theme-switch" title="Toggle dark mode">
          <input
            type="checkbox"
            checked={theme === 'dark'}
            onChange={onToggleTheme}
            aria-label="Toggle dark mode"
          />
          <span aria-hidden="true" />
        </label>
      </div>
    </header>
  );
}
