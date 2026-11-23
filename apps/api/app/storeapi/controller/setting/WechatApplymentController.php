<?php

namespace app\storeapi\controller\setting;

use app\storeapi\controller\BaseStoreController;
use app\storeapi\logic\setting\WechatApplymentLogic;
use app\common\service\JsonService;

/**
 * 微信支付特约商户进件 API
 * 门店进件流程：提交申请 → 查询状态 → 同步状态 → 获取签约链接
 */
class WechatApplymentController extends BaseStoreController
{
    public array $notNeedLogin = ['uploadImage', 'notify'];

    /** POST 上传图片到微信支付服务器 */
    public function uploadImage()
    {
        try {
            $file = $this->request->file('file');
            if (!$file) return JsonService::fail('请上传图片文件');

            $allowedExts = ['jpg', 'jpeg', 'png', 'bmp'];
            $ext = strtolower($file->getOriginalExtension() ?: pathinfo($file->getOriginalName(), PATHINFO_EXTENSION));
            if (!in_array($ext, $allowedExts)) return JsonService::fail('图片格式不支持，仅支持JPG、BMP、PNG格式');
            if ($file->getSize() > 5 * 1024 * 1024) return JsonService::fail('图片大小不能超过5M');

            $service = \app\common\service\pay\WechatPayService::getInstance();
            $result = $service->uploadImage($file->getPathname(), $file->getOriginalName());
            if ($result['code'] === 0) return JsonService::success('上传成功', $result['data']);
            return JsonService::fail($result['message']);
        } catch (\Exception $e) {
            \think\facade\Log::error('[WechatApply] uploadImage异常: ' . $e->getMessage());
            return JsonService::fail('上传失败: ' . $e->getMessage());
        }
    }
    /** GET 查询进件状态 */
    public function status()
    {
        $result = WechatApplymentLogic::getStatus($this->storeId);
        return JsonService::data($result);
    }

    /** POST 提交进件申请 */
    public function apply()
    {
        try {
            $params = $this->request->post();
            $result = WechatApplymentLogic::submitApply($params, $this->storeId);
            if ($result === false) return JsonService::fail(WechatApplymentLogic::getError());
            return JsonService::success('申请已提交', $result);
        } catch (\Exception $e) {
            \think\facade\Log::error('[WechatApply] apply异常: ' . $e->getMessage());
            return JsonService::fail('提交失败: ' . $e->getMessage());
        }
    }

    /** POST 同步微信审核状态 */
    public function sync()
    {
        try {
            $result = WechatApplymentLogic::syncStatus($this->storeId);
            if ($result === false) return JsonService::fail(WechatApplymentLogic::getError());
            return JsonService::success('状态已同步', $result);
        } catch (\Exception $e) {
            \think\facade\Log::error('[WechatApply] sync异常: ' . $e->getMessage());
            return JsonService::fail('同步失败: ' . $e->getMessage());
        }
    }

    /** GET 获取签约链接 */
    public function signUrl()
    {
        try {
            $result = WechatApplymentLogic::getSignUrl($this->storeId);
            if ($result === false) return JsonService::fail(WechatApplymentLogic::getError());
            return JsonService::data($result);
        } catch (\Exception $e) {
            \think\facade\Log::error('[WechatApply] signUrl异常: ' . $e->getMessage());
            return JsonService::fail('获取失败: ' . $e->getMessage());
        }
    }

    /**
     * POST 接收微信支付进件审核结果回调
     * 微信在审核有结果后会主动通知此端点
     */
    public function notify()
    {
        try {
            $headers = [
                'wechatpay-timestamp' => $this->request->header('wechatpay-timestamp', ''),
                'wechatpay-nonce'     => $this->request->header('wechatpay-nonce', ''),
                'wechatpay-signature' => $this->request->header('wechatpay-signature', ''),
                'wechatpay-serial'    => $this->request->header('wechatpay-serial', ''),
            ];
            $body = $this->request->getContent();

            \think\facade\Log::info('[WechatApply] 收到回调 headers=' . json_encode($headers, JSON_UNESCAPED_UNICODE));

            $result = WechatApplymentLogic::handleNotify($headers, $body);
            if ($result === false) {
                \think\facade\Log::error('[WechatApply] 回调验签失败: ' . WechatApplymentLogic::getError());
                return response('{"code":"FAIL","message":"' . WechatApplymentLogic::getError() . '"}', 403, ['Content-Type' => 'application/json']);
            }

            return response('{"code":"SUCCESS"}', 200, ['Content-Type' => 'application/json']);
        } catch (\Exception $e) {
            \think\facade\Log::error('[WechatApply] notify异常: ' . $e->getMessage());
            return response('{"code":"FAIL","message":"' . $e->getMessage() . '"}', 500, ['Content-Type' => 'application/json']);
        }
    }
}
