import React from 'react';
import { Activity, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-[#DCE3E7] bg-white text-[#667580] py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Research Disclaimer */}
        <div className="p-4 rounded-lg bg-[#F4F6F7] border border-[#DCE3E7] text-xs text-[#526A7A] flex items-start space-x-3 text-left">
          <ShieldCheck className="w-4 h-4 text-[#397C78] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-[#263238] font-semibold">Clinical Notice: </strong>
            This tool is intended for research and educational use only. Results are not a medical diagnosis. All computer vision predictions must be independently evaluated by certified radiologists before clinical decision-making.
          </p>
        </div>

        {/* Institutional and Copyright Notice */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#667580]">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded bg-[#19354A] flex items-center justify-center text-white">
              <Activity className="w-3 h-3 text-[#397C78]" />
            </div>
            <span className="font-semibold text-[#19354A]">Lung Imaging</span>
            <span>&bull;</span>
            <span>Thoracic Radiograph Diagnostic Platform</span>
          </div>

          <div className="text-right">
            <span>&copy; {new Date().getFullYear()} Clinical Imaging Research Initiative. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
