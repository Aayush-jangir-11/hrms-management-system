import React from "react";

const PolicyStatCard = ({ title, count, description, icon: Icon, iconBgColor, iconColor }) => {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:shadow-md transition duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {title}
          </p>
          <h2 className="mt-1.5 text-3xl font-extrabold text-slate-800">
            {count}
          </h2>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconBgColor} ${iconColor}`}>
          <Icon size={24} />
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500 font-medium">
        {description}
      </p>
    </div>
  );
};

export default PolicyStatCard;
