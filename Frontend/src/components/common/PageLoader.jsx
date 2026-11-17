import React from "react";

const PageLoader = ({ message = "Loading data...", fullScreen = false }) => {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 ${fullScreen ? "min-h-screen bg-slate-50" : "min-h-[50vh] bg-transparent"
        } animate-fade-in`}
    >
      {/* Modern Circular Spinner */}
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4 border-slate-200/80" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-sky-500 border-r-sky-500 animate-spin" />
        <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-indigo-500 animate-spin [animation-direction:reverse] [animation-duration:1.5s]" />
      </div>

      {/* Loading Text */}
      <div className="text-center">
        <p className="text-xs font-bold text-slate-500 tracking-wider uppercase">
          {message}
        </p>
      </div>
    </div>
  );
};

export default PageLoader;
