import React from 'react'
import LoginLeft from '../../components/LoginLeft'
import { ArrowRight } from "lucide-react";

const Roleselection = () => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side  */}
      <LoginLeft />

      <div className="w-1/2 flex flex-col items-center justify-center p-16 overflow-y-auto min-h-screen relative">
        <div className="w-full max-w-md animate-fade-in relative">
          {/* Title  */}
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-3xl font-medium text-slate-900 tracking-tight mb-3">
              Welcome Back
            </h2>
            <p className="text-slate-500">
              Select your portal to securely access the system.
            </p>
          </div>

          {/* Buttons */}
          <div className="space-y-4">
            <div className="block bg-slate-50 border border-slate-200 rounded-lg p-5 transition-all duration-300 hover:border-indigo-400 hover:bg-indigo-50">
              <div className="relative z-10 flex items-center justify-between gap-4 ">
                <h3 className="text-lg text-slate-700 group-hover:text-indigo-600 mb-1 transition-colors">
                  Admin Portal
                </h3>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all duration-300" />
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 transition-all duration-300 hover:border-indigo-400 hover:bg-indigo-50">
              <div className="relative z-10 flex items-center justify-between gap-4 ">
                <h3 className="text-lg text-slate-700 group-hover:text-indigo-600 mb-1 transition-colors">
                  Admin Portal
                </h3>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all duration-300" />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center md:text-left text-sm text-slate-400">
            <p>
              {" "}
              © {new Date().getFullYear()} Fuel It Online. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Roleselection
