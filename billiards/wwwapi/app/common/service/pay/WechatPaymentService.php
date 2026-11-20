<?php

namespace app\common\service\pay;

use EasyWeChat\Kernel\Exceptions\BadResponseException;
use EasyWeChat\Kernel\Exceptions\InvalidArgumentException;
use EasyWeChat\Kernel\Exceptions\InvalidConfigException;
use EasyWeChat\Pay\Application;
use think\facade\Log;

/**
 * 统一微信支付服务 — 基于 EasyWeChat 6.x
 *
 * 直接调用微信支付 API，替代 pay-hub 网关。
 * v3 用于: NATIVE 扫码支付、退款、回调验证
 * v2 用于: MICROPAY 付款码支付、订单查询
 *
 * @package app\common\service\pay
 */
class WechatPaymentService
{
    protected Application $v3App;
    protected Application $v2App;
    protected string $appId;
    protected string $mchId;
    protected string $serialNo;
    protected string $apiV3Key;
    protected string $notifyUrl;

    /**
     * 构造函数
     *
     * 初始化 EasyWeChat v3 和 v2 两个实例：
     * - v3: NATIVE 扫码、退款、回调（使用 API v3 + RSA 签名）
     * - v2: MICROPAY 付款码、订单查询（使用 API v2 + MD5/HMAC 签名）
     *
     * @param  string|null  $notifyUrl  支付结果通知地址，不传则从配置文件读取
     */
    public function __construct(?string $notifyUrl = null)
    {
        $config = config('wechatpay');

        // 服务商配置
        $this->appId     = (string)($config['appid'] ?? 'wx0e5fc1f7fa23d1fe');
        $this->mchId     = (string) ($config['mchid'] ?? '');
        $this->serialNo  = (string) ($config['serial_no'] ?? '');
        $this->apiV3Key  = (string) ($config['apiv3_key'] ?? '');
        $this->notifyUrl = $notifyUrl ?: ((string)($config['notify_url'] ?? '') ?: 'https://poolapi.kyyp.cn/api/v1/webhooks/wechat');

        // v3 配置（EasyWeChat 6.x Pay Config 须包含: mch_id, secret_key, private_key, certificate）
        // 私钥：可能是路径也可能是 PEM 字符串
        $privateKey = $config['private_key'] ?? '';
        if ($privateKey && !str_starts_with($privateKey, '-----BEGIN')) {
            $privateKey = is_file($privateKey) ? file_get_contents($privateKey) : '';
        }

        // 商户 API 证书（X.509 证书，与私钥配对，EasyWeChat 用其提取序列号签名）
        // 注意：不能用 wechatpay_public_key（那是裸公钥，非 X.509 证书，openssl_x509_parse 会失败）
        $certificate = $config['merchant_certificate_path'] ?? '';
        if (! $certificate && ! empty($config['private_key']) && ! str_starts_with($config['private_key'], '-----BEGIN')) {
            // 从私钥路径推导：同目录下的 apiclient_cert.pem
            $certDir  = dirname($config['private_key']);
            $certPath = $certDir . DIRECTORY_SEPARATOR . 'apiclient_cert.pem';
            if (is_file($certPath)) {
                $certificate = $certPath;
            }
        }
        if ($certificate && ! str_starts_with($certificate, '-----BEGIN')) {
            $certificate = is_file($certificate) ? file_get_contents($certificate) : '';
        }

        $v3Config = [
            'mch_id'      => $this->mchId,
            'serial_no'   => $this->serialNo,
            'private_key' => $privateKey,
            'certificate' => $certificate,
            'secret_key'  => $this->apiV3Key,
            'http'        => [
                'throw' => false,
            ],
        ];

        // v2 配置（追加 v2_secret_key，用于 MICROPAY / orderquery 等旧版 API）
        $v2Config = array_merge($v3Config, [
            'v2_secret_key' => (string)($config['v2_secret_key'] ?? ''),
        ]);

        $this->v3App = new Application($v3Config);
        $this->v2App = new Application($v2Config);
    }

    // ========================
    //  支付方法
    // ========================

    /**
     * NATIVE 扫码支付（v3）
     *
     * 生成扫码支付的二维码链接，用户扫码后在微信内完成支付。
     * 适用于：PC 端扫码支付、POS 扫码枪主扫模式（展示二维码给用户扫）
     *
     * @param  string  $orderNo     商户订单号（≤32 字符）
     * @param  int     $amount      支付金额（分）
     * @param  string  $description 商品描述
     * @return array{code_url: string, prepay_id: string}|false
     */
    public function native(string $orderNo, int $amount, string $description = '台球消费', string $subMchId = ''): array|false
    {
        // 判断是否服务商模式：subMchId 存在且与服务商商户号不同
        $isPartner = !empty($subMchId) && $subMchId !== $this->mchId;

        if ($isPartner) {
            // 服务商模式：POST /v3/pay/partner/transactions/native
            $body = [
                'sp_appid'     => $this->appId,
                'sp_mchid'     => $this->mchId,
                'sub_mchid'    => $subMchId,
                'description'  => $description,
                'out_trade_no' => $orderNo,
                'notify_url'   => $this->notifyUrl,
                'amount'       => [
                    'total'    => $amount,
                    'currency' => 'CNY',
                ],
            ];
            $path = '/v3/pay/partner/transactions/native';
        } else {
            // 直连商户模式：POST /v3/pay/transactions/native
            $body = [
                'appid'        => $this->appId,
                'mchid'        => $this->mchId,
                'description'  => $description,
                'out_trade_no' => $orderNo,
                'notify_url'   => $this->notifyUrl,
                'amount'       => [
                    'total'    => $amount,
                    'currency' => 'CNY',
                ],
            ];
            $path = '/v3/pay/transactions/native';
        }

        try {
            $response = $this->v3App->getClient()->postJson($path, [
                'json' => $body,
            ]);

            $data = $response->toArray();

            if (isset($data['code_url'])) {
                return [
                    'code_url'  => $data['code_url'],
                    'prepay_id' => $data['prepay_id'] ?? '',
                ];
            }

            $this->logError('native', $body, $data);
            return $this->err('微信下单失败: ' . ($data['message'] ?? '未知错误'));
        } catch (\Throwable $e) {
            $this->logException('native', $body, $e);
            return $this->err('微信下单异常: ' . $e->getMessage());
        }
    }

    /**
     * MICROPAY 付款码支付（v2）
     *
     * 使用扫码枪扫描用户付款码，同步返回支付结果。
     * 适用于：超市/台球室收银台扫用户条码/二维码的场景
     *
     * @param  string  $orderNo     商户订单号（≤32 字符）
     * @param  string  $authCode    用户付款码（条码或二维码数字）
     * @param  int     $amount      支付金额（分）
     * @param  string  $description 商品描述
     * @param  string  $subMchId    特约子商户号（服务商模式必传）
     * @return array{success: bool, transaction_id: string, error_msg?: string}|false
     */
    public function micropay(
        string $orderNo,
        string $authCode,
        int $amount,
        string $description = '台球消费',
        string $subMchId = ''
    ): array|false {
        $body = [
            'appid'            => $this->appId,
            'mch_id'           => $this->mchId,
            'body'             => $description,
            'out_trade_no'     => $orderNo,
            'total_fee'        => $amount,
            'spbill_create_ip' => request()->ip() ?: '127.0.0.1',
            'auth_code'        => $authCode,
        ];

        if (! empty($subMchId)) {
            $body['sub_mch_id'] = $subMchId;
        }

        try {
            /** @var \EasyWeChat\Kernel\HttpClient\Response $response */
            $response = $this->v2App->getClient()->postXml('/pay/micropay', [
                'xml' => $body,
            ]);

            $data = $response->toArray();

            // v2 响应以 XML 形式返回，字段为 return_code / result_code
            $returnCode = $data['return_code'] ?? '';
            $resultCode = $data['result_code'] ?? '';

            if ($returnCode === 'SUCCESS' && $resultCode === 'SUCCESS') {
                return [
                    'success'        => true,
                    'transaction_id' => $data['transaction_id'] ?? '',
                ];
            }

            $errorMsg = $data['err_code_des'] ?? $data['return_msg'] ?? '未知错误';
            return [
                'success'        => false,
                'transaction_id' => $data['transaction_id'] ?? '',
                'error_msg'      => $errorMsg,
            ];
        } catch (\Throwable $e) {
            $this->logException('micropay', $body, $e);
            return $this->err('付款码支付异常: ' . $e->getMessage());
        }
    }

    // ========================
    //  查询方法
    // ========================

    /**
     * 按商户订单号查询支付状态
     *
     * 服务商模式下使用 v3 Partner API 查单（支持 subMchId）
     *
     * @param  string  $orderNo  商户订单号
     * @param  string  $subMchId  特约子商户号（服务商模式必传）
     * @return array{trade_state: string, total_fee: int, transaction_id: string}|false
     */
    public function queryByOutTradeNo(string $orderNo, string $subMchId = ''): array|false
    {
        $isPartner = !empty($subMchId) && $subMchId !== $this->mchId;

        if ($isPartner) {
            // 服务商模式：v3 Partner API
            $path = "/v3/pay/partner/transactions/out-trade-no/{$orderNo}?sp_mchid={$this->mchId}&sub_mchid={$subMchId}";
            try {
                $response = $this->v3App->getClient()->get($path);
                $data = $response->toArray();
                if (isset($data['trade_state'])) {
                    return [
                        'trade_state'    => $data['trade_state'],
                        'total_fee'      => (int) ($data['amount']['total'] ?? 0),
                        'transaction_id' => $data['transaction_id'] ?? '',
                    ];
                }
                $this->logError('queryByOutTradeNo[partner]', ['path' => $path], $data);
                return $this->err('查询订单失败: ' . ($data['message'] ?? '未知错误'));
            } catch (\Throwable $e) {
                $this->logException('queryByOutTradeNo[partner]', ['path' => $path], $e);
                return $this->err('查询订单异常: ' . $e->getMessage());
            }
        }

        // 直连模式：v2 orderquery
        $body = [
            'appid'        => $this->appId,
            'mch_id'       => $this->mchId,
            'out_trade_no' => $orderNo,
        ];

        try {
            /** @var \EasyWeChat\Kernel\HttpClient\Response $response */
            $response = $this->v2App->getClient()->postXml('/pay/orderquery', [
                'xml' => $body,
            ]);

            $data = $response->toArray();

            $returnCode = $data['return_code'] ?? '';
            $resultCode = $data['result_code'] ?? '';

            if ($returnCode === 'SUCCESS' && $resultCode === 'SUCCESS') {
                return [
                    'trade_state'    => $data['trade_state'] ?? '',
                    'total_fee'      => (int) ($data['total_fee'] ?? 0),
                    'transaction_id' => $data['transaction_id'] ?? '',
                ];
            }

            $this->logError('queryByOutTradeNo', $body, $data);
            return $this->err('查询订单失败: ' . ($data['err_code_des'] ?? $data['return_msg'] ?? '未知错误'));
        } catch (\Throwable $e) {
            $this->logException('queryByOutTradeNo', $body, $e);
            return $this->err('查询订单异常: ' . $e->getMessage());
        }
    }

    // ========================
    //  退款方法
    // ========================

    /**
     * 按商户订单号发起退款（v3）
     *
     * @param  string  $orderNo      原商户订单号
     * @param  string  $refundNo     商户退款单号（唯一定位一笔退款）
     * @param  int     $totalAmount  原订单总金额（分）
     * @param  int     $refundAmount 本次退款金额（分）
     * @param  string  $reason       退款原因（选填，≤80 字符）
     * @return array|false
     */
    public function refund(
        string $orderNo,
        string $refundNo,
        int $totalAmount,
        int $refundAmount,
        string $reason = ''
    ): array|false {
        $body = [
            'out_trade_no'  => $orderNo,
            'out_refund_no' => $refundNo,
            'amount'        => [
                'refund'   => $refundAmount,
                'total'    => $totalAmount,
                'currency' => 'CNY',
            ],
        ];

        if (! empty($reason)) {
            $body['reason'] = $reason;
        }

        try {
            $response = $this->v3App->getClient()->postJson('/v3/refund/domestic/refunds', [
                'json' => $body,
            ]);

            $data = $response->toArray();

            if (isset($data['refund_id'])) {
                return $data;
            }

            $this->logError('refund', $body, $data);
            return $this->err('发起退款失败: ' . ($data['message'] ?? '未知错误'));
        } catch (\Throwable $e) {
            $this->logException('refund', $body, $e);
            return $this->err('发起退款异常: ' . $e->getMessage());
        }
    }

    // ========================
    //  回调验证
    // ========================

    /**
     * 处理微信支付回调通知（v3）
     *
     * 自动完成以下步骤：
     * 1. 从请求头验证回调签名（Wechatpay-Signature）
     * 2. 读取原始 JSON 报文体
     * 3. 使用 API v3 密钥解密 resource.ciphertext（AES-256-GCM）
     * 4. 返回解密后的支付事件数据
     *
     * @return array{eventType: string, outTradeNo: string, transactionId: string, amount: int}|false
     */
    public function handleCallback(): array|false
    {
        try {
            // EasyWeChat Server 自动验签（Wechatpay-Signature）+ 解密（AES-256-GCM）
            $message = $this->v3App->getServer()->getRequestMessage();

            $attrs = $message->toArray();

            return [
                'eventType'     => $message->getEventType() ?? '',
                'outTradeNo'    => (string) ($attrs['out_trade_no'] ?? ''),
                'transactionId' => (string) ($attrs['transaction_id'] ?? ''),
                'amount'        => (int) ($attrs['amount']['total'] ?? 0),
            ];
        } catch (InvalidArgumentException | InvalidConfigException $e) {
            Log::error('[WechatPaymentService] 回调验签/解密失败: ' . $e->getMessage());
            return $this->err('回调验证失败: ' . $e->getMessage());
        } catch (\Throwable $e) {
            Log::error('[WechatPaymentService] 回调处理异常: ' . $e->getMessage());
            return $this->err('回调处理异常: ' . $e->getMessage());
        }
    }

    // ========================
    //  内部辅助
    // ========================

    /**
     * 记录错误日志
     */
    protected function logError(string $method, array $request, array $response): void
    {
        Log::error("[WechatPaymentService] {$method} 失败", [
            'request'  => $request,
            'response' => $response,
        ]);
    }

    /**
     * 记录异常日志
     */
    protected function logException(string $method, array $request, \Throwable $e): void
    {
        Log::error("[WechatPaymentService] {$method} 异常: {$e->getMessage()}", [
            'request' => $request,
            'trace'   => $e->getTraceAsString(),
        ]);
    }

    /**
     * 统一错误返回
     */
    protected function err(string $msg): array
    {
        Log::error('[WechatPaymentService] ' . $msg);
        return ['error_msg' => $msg];
    }
}
