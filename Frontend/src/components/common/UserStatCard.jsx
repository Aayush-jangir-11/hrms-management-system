import React from 'react';

const UserStatCard = ({ stats }) => {
  return (
    <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;

        return (
          <div
            key={index}
            className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            {/* Top Gradient */}
            <div
              className={`absolute left-0 right-0 top-0 h-1 bg-gradient-to-r ${stat.accent}`}
            />

            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">
                  {stat.title}
                </p>

                <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-800">
                  {stat.value}
                </h2>

                <div className="mt-3 flex items-center gap-2">
                  <span className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-600">
                    {stat.change}
                  </span>

                  <span className="text-[11px] text-slate-400">
                    {stat.description}
                  </span>
                </div>
              </div>

              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${stat.iconBg} ${stat.iconColor} transition duration-300 group-hover:scale-110 group-hover:rotate-3`}
              >
                <Icon size={22} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default UserStatCard;
