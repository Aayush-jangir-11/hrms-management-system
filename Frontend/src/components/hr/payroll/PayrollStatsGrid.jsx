import React from "react";
import { WalletCards, CreditCard, Clock3, Users } from "lucide-react";
import { formatCurrency } from "./PayslipModal";

const PayrollStatsGrid = ({
  totalNetSalary,
  payrollsCount,
  totalPaid,
  paidCount,
  totalPending,
  pendingCount,
}) => {
  const cards = [
    {
      label: "Total Payroll",
      value: formatCurrency(totalNetSalary),
      sub: `${payrollsCount} records`,
      icon: WalletCards,
      from: "from-sky-400",
      to: "to-blue-600",
      bg: "bg-sky-50",
      text: "text-sky-600",
    },
    {
      label: "Total Paid",
      value: formatCurrency(totalPaid),
      sub: `${paidCount} employees`,
      icon: CreditCard,
      from: "from-emerald-400",
      to: "to-teal-600",
      bg: "bg-emerald-50",
      text: "text-emerald-600",
    },
    {
      label: "Pending Payroll",
      value: formatCurrency(totalPending),
      sub: `${pendingCount} employees`,
      icon: Clock3,
      from: "from-amber-400",
      to: "to-orange-500",
      bg: "bg-amber-50",
      text: "text-amber-600",
    },
    {
      label: "Total Employees",
      value: String(payrollsCount),
      sub: "This month",
      icon: Users,
      from: "from-indigo-400",
      to: "to-purple-600",
      bg: "bg-indigo-50",
      text: "text-indigo-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
        >
          <div className={`absolute left-0 right-0 top-0 h-1 bg-gradient-to-r ${card.from} ${card.to}`} />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {card.label}
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-800">{card.value}</h2>
              <p className="mt-2 text-xs font-medium text-slate-400">{card.sub}</p>
            </div>
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.bg} ${card.text} transition-transform duration-300 group-hover:scale-110`}
            >
              <card.icon size={22} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default React.memo(PayrollStatsGrid);
