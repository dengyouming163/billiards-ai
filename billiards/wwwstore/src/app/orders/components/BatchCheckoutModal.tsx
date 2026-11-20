'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Wallet, Smartphone, Building, Coins } from 'lucide-react';
import { getOrdersByTable, batchCheckoutOrders, type Order } from '@/lib/api/orders';

interface BatchCheckoutModalProps {
  tableId: string;
  tableName: string;
  onSuccess?: () => void;
}

const paymentMethods = [
  { id: 'wechat', name: '微信支付', icon: Smartphone, color: 'text-[#07C160]' },
  { id: 'alipay', name: '支付宝', icon: CreditCard, color: 'text-[#06B6D4]' },
  { id: 'cash', name: '现金', icon: Wallet, color: 'text-[#FF976A]' },
  { id: 'balance', name: '余额', icon: Building, color: 'text-[#8B5CF6]' },
  { id: 'card', name: '会员卡', icon: Coins, color: 'text-[#FF976A]' },
];

export function BatchCheckoutModal({ tableId, tableName, onSuccess }: BatchCheckoutModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('wechat');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const totalAmount = orders.reduce((sum, order) => sum + order.final_amount, 0);

  useEffect(() => {
    if (isOpen && tableId) {
      loadOrders();
    }
  }, [isOpen, tableId]);

  const loadOrders = async () => {
    try {
      const data = await getOrdersByTable(tableId);
      setOrders(data);
      const newTotal = data.reduce((sum, order) => sum + order.final_amount, 0);
      setAmount(newTotal.toString());
    } catch (error) {
      toast({ title: '加载订单失败', variant: 'error' });
    }
  };

  const handleSubmit = async () => {
    if (orders.length === 0) {
      toast({ title: '该台桌没有待结算订单', variant: 'error' });
      return;
    }

    const paidAmount = parseFloat(amount) || 0;
    if (paidAmount <= 0) {
      toast({ title: '请输入支付金额', variant: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      const baseParams: Record<string, unknown> = { order_ids: orders.map((o) => o.id) };
      baseParams[`${paymentMethod}_paid`] = paidAmount;

      await batchCheckoutOrders(baseParams as Parameters<typeof batchCheckoutOrders>[0]);
      toast({ title: '结账成功', variant: 'success' });
      setIsOpen(false);
      setOrders([]);
      setAmount('');
      onSuccess?.();
    } catch (error) {
      toast({ title: '结账失败', variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          onClick={handleOpen}
          className="bg-gradient-to-r from-[#00D4AA] to-[#00B894] hover:from-[#00B894] hover:to-[#00A08A] text-white shadow-md"
        >
          合并结算
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800">
            {tableName} - 合并结算
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-600 mb-3">待结算订单</h4>
            {orders.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {orders.map((order) => (
                  <div 
                    key={order.id} 
                    className="flex justify-between items-center p-2 bg-white rounded border"
                  >
                    <div>
                      <span className="text-sm font-medium">{order.order_no}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        {order.type === 'table' ? '台费' : order.type === 'product' ? '商品' : '助教'}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-gray-800">
                      ¥{order.final_amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">暂无待结算订单</p>
            )}
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">合计金额</span>
              <span className="text-2xl font-bold text-[#00B894]">
                ¥{totalAmount.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>支付方式</Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="grid grid-cols-5 gap-2">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.id}
                      value={method.id}
                      className="flex flex-col items-center gap-1 p-2 rounded-lg border transition-all hover:bg-gray-50 data-[state=checked]:border-green-500 data-[state=checked]:bg-green-50"
                    >
                      <Icon className={`w-5 h-5 ${method.color}`} />
                      <span className="text-xs">{method.name}</span>
                    </button>
                  );
                })}
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">支付金额</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
              <Input
                id="amount"
                type="number"
                placeholder="输入支付金额"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8"
                min="0"
                step="0.01"
              />
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
              disabled={isLoading || orders.length === 0}
            >
              {isLoading ? '结算中...' : '确认结账'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}