import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Crown, Sparkles, Zap } from "lucide-react";
interface PremiumCTAProps {
  variant?: 'banner' | 'card' | 'inline';
  message?: string;
  onUpgrade?: () => void;
}
export const PremiumCTA = ({
  variant = 'inline',
  message = "Desbloqueie todas as funcionalidades",
  onUpgrade
}: PremiumCTAProps) => {
  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    }
  };
  if (variant === 'banner') {
    return <div onClick={handleUpgrade} className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-3 lg:p-4 mb-3 lg:mb-6 cursor-pointer transition-all duration-200 hover:from-yellow-100 hover:to-orange-100 hover:scale-[1.02] active:scale-[0.98] bg-slate-50">
        <div className="flex flex-col lg:flex-row space-y-3 lg:space-y-0 lg:items-center lg:justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-yellow-800">{message}</h3>
              <p className="text-sm text-yellow-700">Assine o Premium por apenas R$ 59,90/mês</p>
            </div>
          </div>
          <Button onClick={handleUpgrade} size="lg" className="w-full lg:min-w-[250px] lg:w-auto bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
            <Sparkles className="w-4 h-4 mr-2" />
            Assinar
          </Button>
        </div>
      </div>;
  }
  if (variant === 'card') {
    return;
  }

  // inline variant
  return <div className="flex items-center space-x-2 text-sm">
      <Crown className="w-4 h-4 text-yellow-600" />
      <span className="text-gray-600">{message}</span>
      <Button onClick={handleUpgrade} size="sm" className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
        Premium
      </Button>
    </div>;
};