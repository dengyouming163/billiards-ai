<?php

namespace app\common\service\pay;

class WechatPayService
{
    protected $config = [];
    protected $mchid = '';
    protected $serialNo = '';
    protected $privateKey = '';
    protected $apiv3Key = '';
    protected $wechatpayPublicKey = '';
    protected $wechatpayPublicKeyId = '';

    public function __construct($config = [])
    {
        $this->config = $config;
        $this->mchid = $config['mchid'] ?? '';
        $this->serialNo = $config['serial_no'] ?? '';
        $this->privateKey = $config['private_key'] ?? '';
        $this->apiv3Key = $config['apiv3_key'] ?? '';
        $this->wechatpayPublicKey = $config['wechatpay_public_key'] ?? '';
        $this->wechatpayPublicKeyId = $config['wechatpay_public_key_id'] ?? '';
    }

    public function submitApplyment($data)
    {
        $url = 'https://api.mch.weixin.qq.com/v3/applyment4sub/applyment/';
        return $this->request('POST', $url, $data);
    }

    public function queryApplyment($applymentId)
    {
        $url = "https://api.mch.weixin.qq.com/v3/applyment4sub/applyment/applyment_id/{$applymentId}";
        return $this->request('GET', $url);
    }

    public function queryApplymentByBusinessCode($businessCode)
    {
        $url = "https://api.mch.weixin.qq.com/v3/applyment4sub/applyment/business_code/{$businessCode}";
       
        return $this->request('GET', $url);
    }

    public function modifySettlement($subMchid, $data)
    {
        $url = "https://api.mch.weixin.qq.com/v3/apply4sub/sub_merchants/{$subMchid}/modify-settlement";
        return $this->request('POST', $url, $data);
    }

    public function querySettlement($subMchid, $accountNumberRule = 'ACCOUNT_NUMBER_RULE_MASK_V1')
    {
        $url = "https://api.mch.weixin.qq.com/v3/apply4sub/sub_merchants/{$subMchid}/settlement?account_number_rule={$accountNumberRule}";
        return $this->request('GET', $url);
    }

    public function querySettlementModifyStatus($subMchid, $applicationNo, $accountNumberRule = 'ACCOUNT_NUMBER_RULE_MASK_V1')
    {
        $url = "https://api.mch.weixin.qq.com/v3/apply4sub/sub_merchants/{$subMchid}/application/{$applicationNo}?account_number_rule={$accountNumberRule}";
        return $this->request('GET', $url);
    }

    /** 查询支付订单（Partner NATIVE） */
    public function queryOrderByOutTradeNo($outTradeNo, $subMchid = null)
    {
        $mchid = $this->mchid;
        $query = "?sp_mchid={$mchid}";
        if ($subMchid) $query .= "&sub_mchid={$subMchid}";
        $url = "https://api.mch.weixin.qq.com/v3/pay/partner/transactions/out-trade-no/{$outTradeNo}{$query}";
        return $this->request('GET', $url);
    }

    public function uploadImage($filePath, $filename = null)
    {
        $url = 'https://api.mch.weixin.qq.com/v3/merchant/media/upload';
        return $this->uploadMedia($url, $filePath, 'image', $filename);
    }

    public function uploadVideo($filePath, $filename = null)
    {
        $url = 'https://api.mch.weixin.qq.com/v3/merchant/media/video_upload';
        return $this->uploadMedia($url, $filePath, 'video', $filename);
    }

    public function getCertificates()
    {
        $url = 'https://api.mch.weixin.qq.com/v3/certificates';
        return $this->request('GET', $url);
    }

    public function getWechatPublicKey()
    {
        $url = 'https://api.mch.weixin.qq.com/v3/get-wechat-public-key';
        return $this->request('GET', $url);
    }

    public function searchBanksByBankAccount($accountNumber)
    {
        try {
            $publicKey = $this->getEncryptPublicKey();
            if (!$publicKey) {
                return [
                    'code' => -1,
                    'message' => '获取加密公钥失败，请检查微信支付配置',
                    'data' => null
                ];
            }
            
            $encryptedAccount = $this->encryptWithKey($accountNumber, $publicKey);
            $encodedAccount = urlencode($encryptedAccount);
            $url = "https://api.mch.weixin.qq.com/v3/capital/capitallhh/banks/search-banks-by-bank-account?account_number={$encodedAccount}";
            return $this->request('GET', $url);
        } catch (\Exception $e) {
            return [
                'code' => -1,
                'message' => '加密失败: ' . $e->getMessage(),
                'data' => null
            ];
        }
    }

    public function encryptWithKey($text, $publicKey)
    {
        $key = openssl_pkey_get_public($publicKey);
        if (!$key) {
            throw new \Exception('公钥格式错误: ' . openssl_error_string());
        }
        
        $encrypted = '';
        if (!openssl_public_encrypt($text, $encrypted, $key, OPENSSL_PKCS1_OAEP_PADDING)) {
            throw new \Exception('加密失败: ' . openssl_error_string());
        }
        
        return base64_encode($encrypted);
    }

    public function getPersonalBankingBanks($offset = 0, $limit = 200)
    {
        $url = "https://api.mch.weixin.qq.com/v3/capital/capitallhh/banks/personal-banking?offset={$offset}&limit={$limit}";
        return $this->request('GET', $url);
    }

    public function getCorporateBankingBanks($offset = 0, $limit = 200)
    {
        $url = "https://api.mch.weixin.qq.com/v3/capital/capitallhh/banks/corporate-banking?offset={$offset}&limit={$limit}";
        return $this->request('GET', $url);
    }

    public function getProvinces()
    {
        $url = 'https://api.mch.weixin.qq.com/v3/capital/capitallhh/areas/provinces';
        return $this->request('GET', $url);
    }

    public function getCities($provinceCode)
    {
        $url = "https://api.mch.weixin.qq.com/v3/capital/capitallhh/areas/provinces/{$provinceCode}/cities";
        return $this->request('GET', $url);
    }

    public function getBankBranches($bankAliasCode, $cityCode, $offset = 0, $limit = 200)
    {
        $url = "https://api.mch.weixin.qq.com/v3/capital/capitallhh/banks/{$bankAliasCode}/branches?city_code={$cityCode}&offset={$offset}&limit={$limit}";
        return $this->request('GET', $url);
    }

    public function encryptSensitiveInfo($text)
    {
        $publicKey = $this->getEncryptPublicKey();
        if (!$publicKey) {
            throw new \Exception('获取加密公钥失败');
        }
        
        $key = openssl_pkey_get_public($publicKey);
        if (!$key) {
            throw new \Exception('公钥格式错误');
        }
        
        $encrypted = '';
        if (!openssl_public_encrypt($text, $encrypted, $key, OPENSSL_PKCS1_OAEP_PADDING)) {
            throw new \Exception('加密失败: ' . openssl_error_string());
        }
        
        return base64_encode($encrypted);
    }

    public function encrypt($text)
    {
        return $this->encryptSensitiveInfo($text);
    }

    protected function getEncryptPublicKey()
    {
        if (!empty($this->wechatpayPublicKey)) {
            return $this->wechatpayPublicKey;
        }
        
        $publicKey = $this->getWechatPublicKeyFromApi();
        if ($publicKey) {
            return $publicKey;
        }
        
        return $this->getWechatPayPlatformCertificate();
    }

    protected function getWechatPublicKeyFromApi()
    {
        $cacheKey = 'wechatpay_public_key_' . $this->mchid;
        $cached = cache($cacheKey);
        
        if ($cached) {
            return $cached;
        }
        
        $result = $this->getWechatPublicKey();
        
        \think\facade\Log::write('WechatPay getWechatPublicKey result: ' . json_encode($result, JSON_UNESCAPED_UNICODE), 'debug');
        
        if ($result['code'] !== 0) {
            \think\facade\Log::write('WechatPay getWechatPublicKey failed: ' . $result['message'], 'error');
            return null;
        }
        
        $pubKey = null;
        if (isset($result['data']['pub_key'])) {
            $pubKey = $result['data']['pub_key'];
        } elseif (isset($result['data']['data']['pub_key'])) {
            $pubKey = $result['data']['data']['pub_key'];
        }
        
        if (!$pubKey) {
            \think\facade\Log::write('WechatPay getWechatPublicKey no pub_key in response: ' . json_encode($result['data'] ?? [], JSON_UNESCAPED_UNICODE), 'error');
            return null;
        }
        
        $publicKey = $this->formatPublicKey($pubKey);
        
        $testKey = openssl_pkey_get_public($publicKey);
        if (!$testKey) {
            \think\facade\Log::write('WechatPay public key format error: ' . openssl_error_string(), 'error');
            return null;
        }
        
        cache($cacheKey, $publicKey, 7200);
        
        return $publicKey;
    }

    protected function formatPublicKey($pubKey)
    {
        if (strpos($pubKey, '-----BEGIN') !== false) {
            return $pubKey;
        }
        
        return "-----BEGIN PUBLIC KEY-----\n" . 
               wordwrap($pubKey, 64, "\n", true) . 
               "\n-----END PUBLIC KEY-----";
    }

    protected function getWechatPayPlatformCertificate()
    {
        $cacheKey = 'wechatpay_platform_cert_' . $this->mchid;
        $cached = cache($cacheKey);
        
        if ($cached) {
            return $cached;
        }
        
        $result = $this->getCertificates();
        
        \think\facade\Log::write('WechatPay getCertificates result: ' . json_encode($result, JSON_UNESCAPED_UNICODE), 'debug');
        
        if ($result['code'] !== 0) {
            \think\facade\Log::write('WechatPay getCertificates failed: ' . $result['message'], 'error');
            return null;
        }
        
        if (!isset($result['data']['data'][0])) {
            \think\facade\Log::write('WechatPay getCertificates no certificate data', 'error');
            return null;
        }
        
        $certData = $result['data']['data'][0];
        $encryptCert = $certData['encrypt_certificate'];
        
        $certificate = $this->decryptCertificate($encryptCert);
        
        if (!$certificate) {
            \think\facade\Log::write('WechatPay decryptCertificate failed', 'error');
            return null;
        }
        
        cache($cacheKey, $certificate, 7200);
        
        return $certificate;
    }

    public function verifyCallback($headers, $body)
    {
        $timestamp = $headers['wechatpay-timestamp'] ?? '';
        $nonce = $headers['wechatpay-nonce'] ?? '';
        $signature = $headers['wechatpay-signature'] ?? '';
        $serial = $headers['wechatpay-serial'] ?? '';
        
        if (!$timestamp || !$nonce || !$signature || !$serial) {
            return false;
        }
        
        $fiveMinutesAgo = time() - 300;
        if ($timestamp < $fiveMinutesAgo) {
            return false;
        }
        
        $message = "{$timestamp}\n{$nonce}\n{$body}\n";
        
        $publicKey = $this->getWechatPayPlatformCertificate();
        if (!$publicKey) {
            return false;
        }
        
        $key = openssl_pkey_get_public($publicKey);
        if (!$key) {
            return false;
        }
        
        $signatureDecoded = base64_decode($signature);
        $result = openssl_verify($message, $signatureDecoded, $key, OPENSSL_ALGO_SHA256);
        
        return $result === 1;
    }

    public function decryptCallbackResource($encryptedData)
    {
        $ciphertext = base64_decode($encryptedData['ciphertext']);
        $nonce = $encryptedData['nonce'];
        $associatedData = $encryptedData['associated_data'] ?? '';
        
        $plaintext = openssl_decrypt(
            $ciphertext,
            'aes-256-gcm',
            $this->apiv3Key,
            OPENSSL_RAW_DATA,
            $nonce,
            $encryptedData['tag'],
            $associatedData
        );
        
        return $plaintext;
    }

    protected function uploadMedia($url, $filePath, $type = 'image', $customFilename = null)
    {
        if (!file_exists($filePath)) {
            return [
                'code' => -1,
                'message' => '文件不存在',
                'data' => null
            ];
        }

        $filename = $customFilename ?: basename($filePath);
        $fileContent = file_get_contents($filePath);
        $sha256 = hash('sha256', $fileContent);
        
        $meta = json_encode([
            'filename' => $filename,
            'sha256' => $sha256
        ], JSON_UNESCAPED_UNICODE);
        
        $boundary = '----WechatPayFormBoundary' . md5(time() . mt_rand());
        
        $timestamp = time();
        $nonce = $this->generateNonce();
        
        $uri = parse_url($url, PHP_URL_PATH);
        $message = "POST\n{$uri}\n{$timestamp}\n{$nonce}\n{$meta}\n";
        $signature = $this->sign($message);
        
        $authorization = $this->buildAuthorization('POST', $uri, $meta);
        
        $mimeType = $type === 'video' ? $this->getVideoMimeType($filename) : $this->getImageMimeType($filename);
        
        $body = "--{$boundary}\r\n";
        $body .= "Content-Disposition: form-data; name=\"meta\";\r\n";
        $body .= "Content-Type: application/json\r\n\r\n";
        $body .= "{$meta}\r\n";
        $body .= "--{$boundary}\r\n";
        $body .= "Content-Disposition: form-data; name=\"file\"; filename=\"{$filename}\";\r\n";
        $body .= "Content-Type: {$mimeType}\r\n\r\n";
        $body .= $fileContent . "\r\n";
        $body .= "--{$boundary}--\r\n";
        
        $headers = [
            'Authorization: ' . $authorization,
            'Accept: application/json',
            'Content-Type: multipart/form-data; boundary=' . $boundary,
            'User-Agent: WechatPay-PHP/1.0',
        ];
        
        \think\facade\Log::write('WechatPay UploadMedia Headers: ' . json_encode($headers, JSON_UNESCAPED_UNICODE), 'debug');
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 60);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_HEADER, true);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        curl_close($ch);
        
        if ($error) {
            return [
                'code' => -1,
                'message' => '上传失败: ' . $error,
                'data' => null
            ];
        }
        
        $responseBody = substr($response, $headerSize);
        $result = json_decode($responseBody, true);
        
        \think\facade\Log::write('WechatPay UploadMedia Response: httpCode=' . $httpCode . ', body=' . $responseBody, 'debug');
        
        if ($httpCode >= 200 && $httpCode < 300) {
            return [
                'code' => 0,
                'message' => 'success',
                'data' => $result
            ];
        }
        
        return [
            'code' => $httpCode,
            'message' => $result['message'] ?? '上传失败',
            'data' => $result
        ];
    }

    protected function getImageMimeType($filename)
    {
        $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        $mimeTypes = [
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'bmp' => 'image/bmp',
        ];
        return $mimeTypes[$ext] ?? 'image/jpeg';
    }

    protected function getVideoMimeType($filename)
    {
        $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        $mimeTypes = [
            'avi' => 'video/x-msvideo',
            'wmv' => 'video/x-ms-wmv',
            'mpeg' => 'video/mpeg',
            'mp4' => 'video/mp4',
            'mov' => 'video/quicktime',
            'mkv' => 'video/x-matroska',
            'flv' => 'video/x-flv',
            'f4v' => 'video/x-f4v',
            'm4v' => 'video/x-m4v',
            'rmvb' => 'application/vnd.rn-realmedia-vbr',
        ];
        return $mimeTypes[$ext] ?? 'video/mp4';
    }

    protected function request($method, $url, $data = null)
    {
        $timestamp = time();
        $nonce = $this->generateNonce();
        $body = $data ? json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : '';
        
        $uri = parse_url($url, PHP_URL_PATH);
        $query = parse_url($url, PHP_URL_QUERY);
        if ($query) {
            $uri .= '?' . $query;
        }
        
        $authorization = $this->buildAuthorization($method, $uri, $body);
        
        $headers = [
            'Authorization: ' . $authorization,
            'Accept: application/json',
            'Content-Type: application/json',
            'User-Agent: WechatPay-PHP/1.0',
        ];
        
        if (!empty($this->wechatpayPublicKeyId)) {
            $headers[] = 'Wechatpay-Serial: ' . $this->wechatpayPublicKeyId;
        }
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        
        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
        } elseif ($method === 'GET') {
            curl_setopt($ch, CURLOPT_HTTPGET, true);
        }
        
        $response = curl_exec($ch); 
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
       
        if ($error) {
            return [
                'code' => -1,
                'message' => '请求失败: ' . $error,
                'data' => null
            ];
        }
        $result = json_decode($response, true);
        
        if ($httpCode >= 200 && $httpCode < 300) {
            return [
                'code' => 0,
                'message' => 'success',
                'data' => $result
            ];
        }
        
        return [
            'code' => $httpCode,
            'message' => $result['message'] ?? '请求失败',
            'data' => $result
        ];
    }

    protected function buildAuthorization($method, $uri, $body = '')
    {
        $timestamp = time();
        $nonce = $this->generateNonce();
        $message = "{$method}\n{$uri}\n{$timestamp}\n{$nonce}\n{$body}\n";
        $signature = $this->sign($message);
        
        return sprintf(
            'WECHATPAY2-SHA256-RSA2048 mchid="%s",nonce_str="%s",timestamp="%s",serial_no="%s",signature="%s"',
            $this->mchid,
            $nonce,
            $timestamp,
            $this->serialNo,
            $signature
        );
    }

    protected function sign($message)
    {
        $privateKey = openssl_pkey_get_private($this->privateKey);
        if (!$privateKey) {
            throw new \Exception('私钥格式错误');
        }
        
        openssl_sign($message, $signature, $privateKey, OPENSSL_ALGO_SHA256);
        
        return base64_encode($signature);
    }

    protected function decryptCertificate($encryptCert)
    {
        $ciphertext = base64_decode($encryptCert['ciphertext']);
        $nonce = $encryptCert['nonce'];
        $associatedData = $encryptCert['associated_data'];
        
        $plaintext = openssl_decrypt(
            $ciphertext,
            'aes-256-gcm',
            $this->apiv3Key,
            OPENSSL_RAW_DATA,
            $nonce,
            $encryptCert['tag'],
            $associatedData
        );
        
        return $plaintext;
    }

    protected function generateNonce($length = 32)
    {
        $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        $str = '';
        for ($i = 0; $i < $length; $i++) {
            $str .= $chars[random_int(0, strlen($chars) - 1)];
        }
        return $str;
    }

    public function getMchid()
    {
        return $this->mchid;
    }

    public function getSerialNo()
    {
        return $this->serialNo;
    }

    public function getWechatpayPublicKeyId()
    {
        return $this->wechatpayPublicKeyId;
    }

    public static function getInstance($config = null)
    {
        if ($config === null) {
            $confPath = app()->getRootPath() . 'config/wechatpay.php';
            if (file_exists($confPath)) {
                $config = include $confPath;
            } else {
                $config = [];
            }
            // Resolve file paths for key files
            if (!empty($config['private_key']) && file_exists($config['private_key'])) {
                $config['private_key'] = file_get_contents($config['private_key']);
            }
            if (!empty($config['wechatpay_public_key']) && file_exists($config['wechatpay_public_key'])) {
                $config['wechatpay_public_key'] = file_get_contents($config['wechatpay_public_key']);
            }
        }
        return new self($config);
    }
}
