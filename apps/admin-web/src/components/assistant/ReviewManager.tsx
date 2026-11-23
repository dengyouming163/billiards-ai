"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Star,
  MessageSquare,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { submitReview, type AssistantOrder } from "@/lib/api/assistants";

interface ReviewManagerProps {
  orders: AssistantOrder[];
}

export default function ReviewManager({ orders }: ReviewManagerProps) {
  const [selectedOrder, setSelectedOrder] = useState<AssistantOrder | null>(null);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewedOrders, setReviewedOrders] = useState<Set<string>>(new Set());

  const pendingOrders = orders.filter(
    (order) => order.status === "completed" && !reviewedOrders.has(order.id)
  );

  const reviewedOrdersList = orders.filter(
    (order) => order.status === "reviewed" || reviewedOrders.has(order.id)
  );

  const handleOpenReview = (order: AssistantOrder) => {
    setSelectedOrder(order);
    setRating(5);
    setReview("");
    setReviewDialogOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedOrder) return;
    setSubmitting(true);
    try {
      await submitReview(selectedOrder.id, rating, review);
      setReviewedOrders((prev) => new Set([...prev, selectedOrder.id]));
      setReviewDialogOpen(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error("提交评价失败:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; className: string; icon: React.ElementType }> = {
      pending: { label: "待确认", className: "bg-yellow-100 text-yellow-700", icon: AlertCircle },
      in_progress: { label: "服务中", className: "bg-blue-100 text-blue-700", icon: Clock },
      completed: { label: "待评价", className: "bg-green-100 text-green-700", icon: CheckCircle2 },
      reviewed: { label: "已评价", className: "bg-slate-100 text-slate-600", icon: Star },
      cancelled: { label: "已取消", className: "bg-red-100 text-red-700", icon: AlertCircle },
    };
    return configs[status] || configs.pending;
  };

  const getServiceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      one_on_one: "一对一教学",
      group: "小班课",
      practice: "陪练",
      competition: "比赛指导",
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-amber-500" />
            待评价订单
          </CardTitle>
          <p className="text-sm text-slate-500">完成服务后请及时评价助教表现</p>
        </CardHeader>
        <CardContent>
          {pendingOrders.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <p className="text-slate-500">暂无待评价订单</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingOrders.map((order) => {
                const status = getStatusConfig(order.status);
                return (
                  <div
                    key={order.id}
                    className="p-4 bg-gradient-to-r from-slate-50 to-white border border-slate-200 rounded-xl hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold">
                          {getServiceTypeLabel(order.service_type).charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">
                              {getServiceTypeLabel(order.service_type)}
                            </span>
                            <Badge className={status.className}>{status.label}</Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                            <span>订单号: {order.order_no}</span>
                            {order.student_name && (
                              <span>学员: {order.student_name}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-bold text-emerald-600">
                            ¥{order.total_amount}
                          </p>
                          <p className="text-xs text-slate-500">
                            {order.duration}小时 x ¥{order.unit_price}/小时
                          </p>
                        </div>
                        <Button
                          onClick={() => handleOpenReview(order)}
                          className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                        >
                          <Star className="w-4 h-4 mr-2" />
                          评价
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            已评价订单
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reviewedOrdersList.length === 0 ? (
            <div className="text-center py-12">
              <Star className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">暂无已评价订单</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviewedOrdersList.map((order) => {
                const status = getStatusConfig(order.status);
                return (
                  <div
                    key={order.id}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white font-bold">
                          {getServiceTypeLabel(order.service_type).charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">
                              {getServiceTypeLabel(order.service_type)}
                            </span>
                            <Badge className={status.className}>{status.label}</Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                            <span>订单号: {order.order_no}</span>
                            {order.student_name && (
                              <span>学员: {order.student_name}</span>
                            )}
                          </div>
                          {order.rating && (
                            <div className="flex items-center gap-2 mt-2">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < (order.rating ?? 0)
                                      ? "text-amber-500 fill-amber-500"
                                      : "text-slate-300"
                                  }`}
                                />
                              ))}
                              {order.review && (
                                <span className="text-sm text-slate-500 ml-2">
                                  "{order.review}"
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-900">
                          ¥{order.total_amount}
                        </p>
                        <p className="text-xs text-slate-500">
                          {order.duration}小时 x ¥{order.unit_price}/小时
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="bg-white rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-slate-900 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              评价助教服务
            </DialogTitle>
            <DialogDescription>请对本次服务进行评价</DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4 py-2">
              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">服务类型</p>
                    <p className="font-medium text-slate-900">
                      {getServiceTypeLabel(selectedOrder.service_type)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">订单金额</p>
                    <p className="font-bold text-emerald-600">¥{selectedOrder.total_amount}</p>
                  </div>
                </div>
                {selectedOrder.student_name && (
                  <div className="mt-2 pt-2 border-t border-slate-200">
                    <p className="text-sm text-slate-500">学员: {selectedOrder.student_name}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">评分</label>
                <div className="flex items-center gap-2">
                  {[5, 4, 3, 2, 1].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-2 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-10 h-10 ${
                          star <= rating
                            ? "text-amber-500 fill-amber-500"
                            : "text-slate-300"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-lg font-bold text-slate-900">{rating} 分</span>
                </div>
                <p className="text-sm text-slate-500">
                  {rating === 5 && "非常满意"}
                  {rating === 4 && "满意"}
                  {rating === 3 && "一般"}
                  {rating === 2 && "不满意"}
                  {rating === 1 && "非常不满意"}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">评价内容（选填）</label>
                <Textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="请输入您对本次服务的评价..."
                  className="rounded-xl min-h-[100px]"
                />
                <p className="text-xs text-slate-400">
                  评价将公开显示，请文明用语
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setReviewDialogOpen(false)}
              className="rounded-xl"
            >
              取消
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={submitting}
              className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              {submitting ? "提交中..." : "提交评价"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}