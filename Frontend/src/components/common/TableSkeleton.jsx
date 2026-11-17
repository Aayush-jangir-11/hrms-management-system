import React from "react";

/**
 * Reusable Table Skeleton Loader Component
 * Renders realistic shimmering placeholder rows to eliminate CLS and layout flicker.
 *
 * @param {number} rows - Number of skeleton rows to render (default 6)
 * @param {number} cols - Number of columns in the table (default 7)
 * @param {boolean} hasAvatar - Whether the first column displays avatar/profile shape
 */
export const TableSkeleton = ({ rows = 6, cols = 7, hasAvatar = true }) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr
          key={rIdx}
          className="animate-pulse border-b border-slate-100/90 transition-colors"
        >
          {Array.from({ length: cols }).map((_, cIdx) => (
            <td key={cIdx} className="px-6 py-4.5">
              {cIdx === 0 && hasAvatar ? (
                /* Profile / Primary info with avatar */
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-200/80 shadow-xs" />
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="h-3.5 w-28 rounded-md bg-slate-200/80" />
                    <div className="h-2.5 w-36 rounded-md bg-slate-100" />
                  </div>
                </div>
              ) : cIdx === cols - 1 ? (
                /* Action buttons column */
                <div className="flex items-center justify-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-slate-200/70" />
                  <div className="h-8 w-8 rounded-xl bg-slate-200/70" />
                </div>
              ) : cIdx === cols - 2 ? (
                /* Status badge column */
                <div className="h-6 w-20 rounded-full bg-slate-200/70" />
              ) : (
                /* Standard text column with randomized width looks */
                <div
                  className={`h-3.5 rounded-md bg-slate-200/70 ${
                    cIdx % 3 === 0
                      ? "w-24"
                      : cIdx % 3 === 1
                      ? "w-32"
                      : "w-20"
                  }`}
                />
              )}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};

export default TableSkeleton;
