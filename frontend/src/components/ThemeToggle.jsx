import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle({ className = '', showLabel = true }) {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      id="theme-toggle-btn"
      type="button"
      className={`theme-toggle-btn ${className}`}
      onClick={toggleTheme}
      title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      aria-label="Toggle color theme"
    >
      <span>{isDark ? '☀️' : '🌙'}</span>
      {showLabel && (
        <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
      )}
    </button>
  );
}
