import React from 'react';

const StatCard = ({
  icon,
  iconElement,
  title,
  label,
  value,
  subtitle,
  description,
  color,
  accent = "from-sky-400 to-blue-600",
  iconBg = "bg-sky-50",
  iconColor = "text-sky-600",
  change,
  text,
}) => {
  const cardTitle = title || label;

  // Safely render icon whether passed as JSX element (<Icon />), component function, or forwardRef object (Lucide)
  const renderIcon = () => {
    const rawIcon = icon || iconElement;
    if (!rawIcon) return null;

    // 1. If already a rendered JSX element like <CalendarDays />
    if (React.isValidElement(rawIcon)) {
      return rawIcon;
    }

    // 2. If a Component (function or forwardRef object)
    if (typeof rawIcon === "function" || (typeof rawIcon === "object" && rawIcon !== null)) {
      const IconComp = rawIcon;
      return <IconComp size={22} />;
    }
    return null;
  };

  const renderedIcon = renderIcon();

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      {/* Top Gradient Accent Line */}
      <div
        className={`absolute left-0 right-0 top-0 h-1 bg-gradient-to-r ${accent}`}
      />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {cardTitle}
          </p>

          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-800">
            {value}
          </h2>

          {(subtitle || description) && (
            <p className="mt-1 text-xs font-medium text-slate-400">
              {subtitle || description}
            </p>
          )}

          {change && (
            <div className="mt-3 flex items-center gap-2">
              <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-600 border border-emerald-100">
                {change}
              </span>
              {text && (
                <span className="text-[11px] font-medium text-slate-400">
                  {text}
                </span>
              )}
            </div>
          )}
        </div>

        {color && color.startsWith("bg-") && !color.includes("gradient") ? (
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color} text-white shadow-xs transition duration-300 group-hover:scale-110 group-hover:rotate-3`}>
            {renderedIcon}
          </div>
        ) : (
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconBg} ${iconColor} transition duration-300 group-hover:scale-110 group-hover:rotate-3`}
          >
            {renderedIcon}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
