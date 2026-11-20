'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Users, GraduationCap, Trophy, Crown } from 'lucide-react';

interface ReportTop5RanksProps {
  productRank: { productId: string; productName: string; salesCount: number; salesAmount: number; trend: string }[];
  memberRank: { name: string; level: string; consume: number; orders: number; lastVisit: string }[];
  assistantRank: { name: string; level: string; hours: number; revenue: number; rating: number; orders: number }[];
  formatCurrency: (value: number) => string;
}

export function ReportTop5Ranks({
  productRank,
  memberRank,
  assistantRank,
  formatCurrency,
}: ReportTop5RanksProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="bg-white rounded-xl border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">商品销量TOP5</h2>
          </div>
          <div className="space-y-3">
            {(productRank.length > 0 ? productRank : Array.from({ length: 5 }, (_, i) => ({ productName: `暂无数据${i + 1}`, salesCount: 0, salesAmount: 0, trend: '0%' }))).map((product, i) => (
              <div key={product.productName} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? 'bg-amber-100 text-amber-600' :
                    i === 1 ? 'bg-slate-200 text-slate-600' :
                    i === 2 ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {i === 0 ? <Trophy className="w-4 h-4" /> : i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{product.productName || '暂无'}</p>
                    <p className="text-xs text-slate-500">{product.salesCount || 0}件</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-emerald-600">{formatCurrency(product.salesAmount || 0)}</p>
                  <p className="text-xs text-emerald-500">{product.trend || '0%'}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white rounded-xl border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">会员消费TOP5</h2>
          </div>
          <div className="space-y-3">
            {(memberRank.length > 0 ? memberRank : Array.from({ length: 5 }, (_, i) => ({ name: `暂无数据${i + 1}`, level: 'normal', consume: 0, orders: 0, lastVisit: '-' }))).map((member, i) => (
              <div key={member.name} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? 'bg-amber-100 text-amber-600' :
                    i === 1 ? 'bg-slate-200 text-slate-600' :
                    i === 2 ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {i === 0 ? <Crown className="w-4 h-4" /> : i + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-900">{member.name || '暂无'}</p>
                      <Badge
                        className={`text-[10px] px-1 ${
                          member.level === 'diamond' ? 'bg-violet-100 text-violet-700' :
                          member.level === 'gold' ? 'bg-amber-100 text-amber-700' :
                          member.level === 'silver' ? 'bg-slate-200 text-slate-700' :
                          'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {member.level === 'diamond' ? '钻石' :
                         member.level === 'gold' ? '金卡' :
                         member.level === 'silver' ? '银卡' : '普通'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">{member.orders || 0}次消费</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-emerald-600">{formatCurrency(member.consume || 0)}</p>
                  <p className="text-xs text-slate-500">最近: {member.lastVisit || '-'}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white rounded-xl border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">助教业绩TOP5</h2>
          </div>
          <div className="space-y-3">
            {(assistantRank.length > 0 ? assistantRank : Array.from({ length: 5 }, (_, i) => ({ name: `暂无数据${i + 1}`, level: '初级', hours: 0, revenue: 0, rating: 0, orders: 0 }))).map((assistant, i) => (
              <div key={assistant.name} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? 'bg-amber-100 text-amber-600' :
                    i === 1 ? 'bg-slate-200 text-slate-600' :
                    i === 2 ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {i === 0 ? <Trophy className="w-4 h-4" /> : i + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-900">{assistant.name || '暂无'}</p>
                      <Badge className="text-[10px] px-1 bg-orange-100 text-orange-700">
                        {assistant.level || '初级'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">{assistant.hours || 0}h · {assistant.orders || 0}单</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-emerald-600">{formatCurrency(assistant.revenue || 0)}</p>
                  <p className="text-xs text-amber-500">⭐ {assistant.rating || 0}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
