import { Link } from 'react-router-dom';

/**
 * Reusable section wrapper with title and optional "View all" link.
 * Used on the Home page for each content section.
 */
export default function Section({ title, linkTo, children, className }) {
  return (
    <div className={`mb-6 ${className || ''}`}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[11px] font-bold text-muted-foreground tracking-widest uppercase">
          {title}
        </h2>
        {linkTo && (
          <Link to={linkTo} className="text-xs text-primary font-medium">
            Vedi tutto →
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}
