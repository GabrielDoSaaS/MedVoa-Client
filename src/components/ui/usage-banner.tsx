import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, Crown, ArrowRight, Zap } from "lucide-react";

interface UsageBannerProps {
  featureType: string;
  remaining: number;
  total: number;
  resetPeriod: string;
  onUpgrade: () => void;
  isPremium: boolean;
}

export const UsageBanner = ({ 
  featureType, 
  remaining, 
  total, 
  resetPeriod, 
  onUpgrade, 
  isPremium 
}: UsageBannerProps) => {
  if (isPremium) return null;

  const percentage = (remaining / total) * 100;
  const isLow = percentage <= 33;
  const isEmpty = remaining === 0;

  return (
    <div className="container mx-auto px-4 py-1">
      <div className="max-w-4xl mx-auto">
        <div 
          onClick={() => window.dispatchEvent(new CustomEvent('navigate-to-subscription', { detail: { target: 'plans' } }))} 
          // Ajuste de padding/margin para telas menores
          className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 cursor-pointer transition-all duration-200 hover:from-yellow-100 hover:to-orange-100 hover:scale-[1.02] active:scale-[0.98] bg-slate-50"
        >
          {/* Layout Responsivo: Stacks em 'flex-col' no mobile, volta para 'flex-row' em 'sm' */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            
            {/* Bloco de Ícone e Texto */}
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${
                isEmpty 
                  ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white animate-pulse' 
                  : isLow 
                    ? 'bg-gradient-to-br from-yellow-500 to-orange-500 text-white animate-pulse' 
                    : 'bg-gradient-to-br from-amber-500 to-yellow-500 text-white'
              }`}>
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-yellow-800">
                  {remaining} {featureType} restantes
                </h3>
                <p className="text-sm text-yellow-700">
                  Redefine {resetPeriod} • Plano grátis
                </p>
              </div>
            </div>
            
            {/* Botão de Upgrade - Ocupa 100% da largura em mobile, e volta para o tamanho automático em 'sm' */}
            <Button
              onClick={onUpgrade}
              size="sm"
              className="w-full sm:w-auto bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Crown className="w-4 h-4 mr-2 text-white" />
              <span className="font-bold">Upgrade Premium</span>
              <Zap className="w-4 h-4 ml-2 text-white" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};