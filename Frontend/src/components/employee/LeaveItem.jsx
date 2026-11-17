import React from 'react';

const LeaveItem = ({ type, date, status }) => {
  const approved = status === "Approved";
  const rejected = status === "Rejected";

  return (
    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 hover:bg-slate-50 transition">
      <div>
        <p className="font-extrabold text-xs text-slate-800">{type}</p>
        <p className="text-[11px] text-slate-500 font-medium mt-0.5">{date}</p>
      </div>

      <span
        className={`text-[11px] px-3 py-1 rounded-full font-bold border ${
          approved
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : rejected
              ? "bg-rose-50 text-rose-700 border-rose-200"
              : "bg-amber-50 text-amber-800 border-amber-200"
        }`}
      >
        {status || "Pending"}
      </span>
    </div>
  );
};

export default LeaveItem;
