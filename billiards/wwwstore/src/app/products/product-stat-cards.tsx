"use client";

import { Package, DollarSign, TrendingUp, AlertTriangle, Box, BarChart3 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ProductStatCardsProps {
  productStats: {
    total: number;
    active: number;
    inactive: number;
    totalValue: number;
    totalSalesValue: number;
    potentialProfit: number;
    lowStock: number;
    outOfStock: number;
  };
  inventoryStats: {
    totalProducts: number;
    totalStock: number;
    totalValue: number;
    lowStockCount: number;
    outOfStockCount: number;
    inboundToday: number;
    outboundToday: number;
  };
}

function StatCard({
  label,
  value,
  subValue,
  icon: Icon,
  color = "slate",
}: {
  label: string;
  value: string | number;
  subValue?: string;
  icon: React.ElementType;
  color?: "green" | "red" | "amber" | "gray" | "slate" | "cyan" | "blue";
}) {
  const colorMap = {
    green: { bg: "from-emerald-400 to-teal-500", text: "text-emerald-600", light: "bg-emerald-50/50", iconBg: "bg-emerald-100", iconColor: "text-emerald-600" },
    red: { bg: "from-rose-400 to-red-500", text: "text-rose-600", light: "bg-rose-50/50", iconBg: "bg-rose-100", iconColor: "text-rose-600" },
    amber: { bg: "from-amber-400 to-orange-500", text: "text-amber-600", light: "bg-amber-50/50", iconBg: "bg-amber-100", iconColor: "text-amber-600" },
    gray: { bg: "from-slate-400 to-slate-500", text: "text-slate-600", light: "bg-slate-50/50", iconBg: "bg-slate-100", iconColor: "text-slate-600" },
    slate: { bg: "from-slate-400 to-slate-500", text: "text-slate-600", light: "bg-slate-50/50", iconBg: "bg-slate-100", iconColor: "text-slate-600" },
    cyan: { bg: "from-cyan-400 to-teal-500", text: "text-cyan-600", light: "bg-cyan-50/50", iconBg: "bg-cyan-100", iconColor: "text-cyan-600" },
    blue: { bg: "from-blue-400 to-indigo-500", text: "text-blue-600", light: "bg-blue-50/50", iconBg: "bg-blue-100", iconColor: "text-blue-600" },
  };

  return (
    <div className={`rounded-2xl border border-slate-200/60 p-5 shadow-sm hover:shadow-lg transition-all duration-300 ${colorMap[color].light}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 mb-1">{label}</p>
          <p className="text-2xl font-bold font-mono text-slate-800">{value}</p>
          {subValue && <p className="text-xs text-slate-400 mt-1">{subValue}</p>}
        </div>
        <div className={`p-3 rounded-xl ${colorMap[color].iconBg}`}>
          <Icon className={`w-5 h-5 ${colorMap[color].iconColor}`} />
        </div>
      </div>
    </div>
  );
}

export default function ProductStatCards({ productStats, inventoryStats }: ProductStatCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
      <StatCard
        label="商品总数"
        value={productStats.total}
        icon={Package}
        color="slate"
      />
      <StatCard
        label="库存价值"
        value={formatCurrency(productStats.totalValue)}
        icon={DollarSign}
        color="cyan"
      />
      <StatCard
        label="预计利润"
        value={formatCurrency(productStats.potentialProfit)}
        icon={TrendingUp}
        color="green"
      />
      <StatCard
        label="待补货"
        value={productStats.lowStock + productStats.outOfStock}
        subValue={`${productStats.lowStock}预警 / ${productStats.outOfStock}缺货`}
        icon={AlertTriangle}
        color="amber"
      />
      <StatCard
        label="总库存"
        value={inventoryStats.totalStock}
        icon={Box}
        color="blue"
      />
      <StatCard
        label="今日出入库"
        value={`+${inventoryStats.inboundToday} / -${inventoryStats.outboundToday}`}
        icon={BarChart3}
        color="red"
      />
    </div>
  );
}
