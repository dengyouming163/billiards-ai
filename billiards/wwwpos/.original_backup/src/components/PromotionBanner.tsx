'use client';

import { Sparkles, X, Percent, Gift, Star } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function PromotionBanner() {
  const { activePromotions } = useApp();

  if (activePromotions.length === 0) return null;

  const currentPromotion = activePromotions[0];
  const promotionTypeConfig = {
    discount: { icon: <Percent className="w-4 h-4" />, gradient: 'from-rose-500 to-pink-500' },
    coupon: { icon: <Gift className="w-4 h-4" />, gradient: 'from-amber-500 to-orange-500' },
    points_multiplier: { icon: <Star className="w-4 h-4" />, gradient: 'from-purple-500 to-violet-500' },
    bundle: { icon: <Gift className="w-4 h-4" />, gradient: 'from-emerald-500 to-teal-500' },
    flash_sale: { icon: <Sparkles className="w-4 h-4" />, gradient: 'from-blue-500 to-indigo-500' },
  };

  const config = promotionTypeConfig[currentPromotion.type] || promotionTypeConfig.discount;

  const formatDiscount = () => {
    if (currentPromotion.discountType === 'rate') {
      return `${Math.round(currentPromotion.discountValue * 10)}折`;
    }
    return `减${currentPromotion.discountValue}元`;
  };

  return (
    <div className={`mx-1 mb-4 p-3 rounded-xl bg-gradient-to-r ${config.gradient} text-white shadow-lg`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-white/20 rounded-lg">
            {config.icon}
          </div>
          <div>
            <h4 className="font-bold text-sm">{currentPromotion.name}</h4>
            <p className="text-white/80 text-xs">{currentPromotion.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-white text-rose-600 rounded-lg text-xs font-bold">
            {formatDiscount()}
          </span>
        </div>
      </div>
    </div>
  );
}
