import { Button } from "@/components/ui/button";
import { Lock, Crown, Zap } from "lucide-react";

interface FeatureBlockerProps {
  title: string;
  description: string;
  onUpgrade: () => void;
  children?: React.ReactNode;
}

export const FeatureBlocker = ({ title, description, onUpgrade, children }: FeatureBlockerProps) => {
  const handleUpgradeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('navigate-to-subscription'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="relative h-full">
      {/* Backdrop overlay */}
      <div className="absolute inset-0 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
        <div 
          onClick={handleUpgradeClick}
          className="max-w-md mx-4 p-6 text-center bg-white rounded-2xl border border-border backdrop-blur-xl shadow-lg cursor-pointer hover:scale-[1.02] transition-transform duration-200"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 mb-6">{description}</p>
          <Button 
            onClick={handleUpgradeClick}
            className="w-full bg-gradient-to-r from-orange-400 to-yellow-500 hover:from-orange-500 hover:to-yellow-600 text-white font-semibold border-0 transition-transform duration-200 hover:scale-104"
          >
            Assinar Premium
          </Button>
        </div>
      </div>
      
      {/* Blurred content */}
      <div className="pointer-events-none blur-[1px] opacity-60">
        {children}
      </div>
    </div>
  );
};