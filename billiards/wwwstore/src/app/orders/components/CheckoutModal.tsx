'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Wallet, Smartphone, Building, Coins, Calculator } from 'lucide-react';
import { checkoutOrder, type Order } from '@/lib/api/orders';
import { formatCurrency } from '@/lib/utils';

interface CheckoutModalProps {
  order: Order;
  onSuccess?: () => void;
}

const paymentMethods = [
  { id: 'wechat', name: '微信支付', icon: Smartphone, color: 'text-green-500', bgColor: 'bg-green-50 border-green-200' },
  { id: 'alipay', name: '支付宝', icon: CreditCard, color: 'text-blue-500', bgColor: 'bg-blue-50 border-blue-200' },
  { id: 'cash', name: '现金', icon: Wallet, color: 'text-yellow-600', bgColor: 'bg-yellow-50 border-yellow-200' },
  { id: 'balance', name: '余额', icon: Building, color: 'text-purple-500', bgColor: 'bg-purple-50 border-purple-200' },
  { id: 'card', name: '会员卡', icon: Coins, color: 'text-orange-500', bgColor: 'bg-orange-50 border-orange-200' },
];

export function CheckoutModal({ order, onSuccess }: CheckoutModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMethods, setSelectedMethods] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const defaultAmount = order.final_amount > 0 ? order.final_amount.toString() : '';

  useEffect(() => {
    const initialMethods: Record<string, string> = {};
    paymentMethods.forEach(method => {
      initialMethods[method.id] = '';
    });
    setSelectedMethods(initialMethods);
  }, [order.id]);

  const totalPaid = parseFloat(paymentMethods.reduce((sum, method) => {
    return sum + (parseFloat(selectedMethods[method.id] || '0'));
  }, 0).toFixed(2));

  const remainingAmount = parseFloat(Math.max(0, order.final_amount - totalPaid).toFixed(2));

  const handleAmountChange = (methodId: string, value: string) => {
    const rawValue = parseFloat(value) || 0;
    const numValue = parseFloat(rawValue.toFixed(2));
    const currentTotal = parseFloat((totalPaid - (parseFloat(selectedMethods[methodId] || '0'))).toFixed(2));
    const maxValue = parseFloat((order.final_amount - currentTotal).toFixed(2));

    if (numValue > maxValue) {
      toast({ title: '金额超出剩余应付款', variant: 'error' });
      setSelectedMethods(prev => ({
        ...prev,
        [methodId]: maxValue.toFixed(2)
      }));
      return;
    }

    setSelectedMethods(prev => ({
      ...prev,
      [methodId]: value
    }));
  };

  const handleSubmit = async () => {
    if (totalPaid <= 0) {
      toast({ title: '请输入支付金额', variant: 'error' });
      return;
    }

    if (remainingAmount > 0) {
      toast({ title: `还需支付 ${formatCurrency(remainingAmount)}`, variant: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      const params: Record<string, number> = {};
      paymentMethods.forEach(method => {
        const amount = parseFloat(selectedMethods[method.id] || '0');
        if (amount > 0) {
          params[`${method.id}_paid`] = amount;
        }
      });

      await checkoutOrder(order.id, params);
      toast({ title: '结账成功', variant: 'success' });
      setIsOpen(false);
      onSuccess?.();
    } catch (error) {
      toast({ title: '结账失败', variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPay = (methodId: string) => {
    const newMethods = { ...selectedMethods };
    newMethods[methodId] = remainingAmount.toFixed(2);
    setSelectedMethods(newMethods);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="text-green-600 border-green-500 hover:bg-green-50"
        >
          <Calculator className="w-4 h-4 mr-1" />
          结账
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800">
            订单结账
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500">订单号</span>
              <span className="text-sm font-mono">{order.order_no}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500">台桌</span>
              <span className="text-sm">{order.table_name || order.table_id || '-'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">会员</span>
              <span className="text-sm">{order.member_name || '散客'}</span>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">应付金额</span>
              <span className="text-2xl font-bold text-[#00B894]">
                {formatCurrency(order.final_amount)}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">支付方式</Label>
            <div className="space-y-2">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                const amount = parseFloat(selectedMethods[method.id] || '0');
                const hasAmount = amount > 0;

                return (
                  <div
                    key={method.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      hasAmount ? `${method.bgColor}` : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg ${method.bgColor} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${method.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">{method.name}</span>
                        {amount > 0 && (
                          <span className="text-green-600 font-semibold">{formatCurrency(amount)}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={selectedMethods[method.id]}
                          onChange={(e) => handleAmountChange(method.id, e.target.value)}
                          className="w-32 text-sm"
                          min="0"
                          step="0.01"
                        />
                        {remainingAmount > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-gray-500 hover:text-gray-700"
                            onClick={() => handleQuickPay(method.id)}
                          >
                            全部
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">已支付</span>
              <span className="font-semibold text-green-600">{formatCurrency(totalPaid)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-gray-600 font-medium">待支付</span>
              <span className={`font-semibold ${remainingAmount > 0 ? 'text-red-500' : 'text-green-600'}`}>
                {remainingAmount > 0 ? formatCurrency(remainingAmount) : '已付清'}
              </span>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setIsOpen(false)}
            >
              取消
            </Button>
            <Button 
              className="flex-1 bg-gradient-to-r from-[#00D4AA] to-[#00B894] hover:from-[#00B894] hover:to-[#00A08A] text-white"
              onClick={handleSubmit}
              disabled={isLoading || remainingAmount > 0}
            >
              {isLoading ? '结算中...' : '确认结账'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}