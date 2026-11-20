import { NextRequest, NextResponse } from 'next/server';

// 统一图片上传代理 → ThinkPHP 控制器（同源，无 CORS）
//   微信进件图片: WechatApplymentController::uploadImage
//   产品/头像等:   UploadController::index
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://poolapi.kyyp.cn/storeapi';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const type = formData.get('type')?.toString() || '';

    // 微信进件图片 → WechatApplymentController（顶层路由，无需认证）
    if (type === 'wechat_applyment') {
      formData.delete('type');
      const API_ROOT = process.env.NEXT_PUBLIC_API_ROOT || 'https://poolapi.kyyp.cn';
      const response = await fetch(`${API_ROOT}/wechat-upload`, {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      return NextResponse.json(result, { status: response.status });
    }

    // 产品/头像/通用图片 → UploadController
    console.log('[upload] forwarding to:', `${API_BASE}/Upload/index`, 'type:', type);
    const response = await fetch(`${API_BASE}/Upload/index`, {
      method: 'POST',
      body: formData,
    });
    const text = await response.text();
    console.log('[upload] backend status:', response.status, 'body:', text.substring(0, 500));
    let result: { code?: number; msg?: string; data?: unknown };
    try {
      result = JSON.parse(text);
    } catch {
      console.error('[upload] backend returned non-JSON:', text);
      return NextResponse.json({ code: 0, msg: '后端返回异常', data: null }, { status: 502 });
    }
    return NextResponse.json(result, { status: response.status });
  } catch (err) {
    console.error('[upload] proxy error:', err);
    return NextResponse.json({ code: 0, msg: '上传失败: ' + (err instanceof Error ? err.message : String(err)), data: null }, { status: 500 });
  }
}
