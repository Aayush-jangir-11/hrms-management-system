import React from 'react';

const ActivityItem = ({ icon, title, time, status }) => {
  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    if (typeof icon === "function" || (typeof icon === "object" && icon !== null)) {
      const IconComp = icon;
      return <IconComp size={18} className="text-slate-600" />;
    }
    return null;
  };

  return (
    <div className="flex items-center gap-4 p-4 border-b border-slate-100 last:border-b-0">
      <div className="p-2 bg-slate-100 rounded-lg">
        {renderIcon()}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-800">{title}</p>
        <p className="text-xs text-slate-500">{time}</p>
      </div>
      <span
        className={`text-xs px-2 py-1 rounded-full font-medium ${
          status === "pending"
            ? "bg-yellow-100 text-yellow-700"
            : status === "approved"
              ? "bg-green-100 text-green-700"
              : "bg-slate-100 text-slate-700"
        }`}
      >
        {status}
      </span>
    </div>
  );
};

export default ActivityItem;
