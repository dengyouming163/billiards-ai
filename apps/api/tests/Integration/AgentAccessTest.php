<?php

declare(strict_types=1);

namespace Tests\Integration;

require_once dirname(__DIR__) . '/Support/DatabaseTestCase.php';

use app\common\cache\EmployeeTokenCache;
use app\common\http\middleware\LikeAdminAllowMiddleware;
use app\storeapi\service\EmployeeTokenService;
use Tests\Support\DatabaseTestCase;
use think\app\MultiApp;
use think\facade\Db;
use think\Response;

abstract class AgentAccessTestCase extends DatabaseTestCase
{
    protected ?string $token = null;
    private array $tokens = [];

    protected function tearDown(): void
    {
        $cache = new EmployeeTokenCache();
        foreach ($this->tokens as $token) {
            $cache->deleteEmployeeInfo($token);
        }
        $this->tokens = [];
        $this->token = null;

        parent::tearDown();
    }

    protected function makeStore(string $id, string $merchantId = 'merchant-a'): array
    {
        $row = [
            'id' => $id,
            'merchant_id' => $merchantId,
            'name' => 'Synthetic Store ' . $id,
            'code' => 'T5-' . $id,
            'status' => 1,
        ];
        if (!Db::name('busi_store')->where('id', $id)->find()) {
            Db::name('busi_store')->insert($row);
        }

        return $row;
    }

    protected function makeEmployee(
        string $id,
        string $storeId,
        string $role = 'employee',
        string $merchantId = 'merchant-a',
        int $status = 1
    ): array {
        $row = [
            'id' => $id,
            'merchant_id' => $merchantId,
            'store_id' => $storeId,
            'name' => 'Synthetic Employee ' . $id,
            'phone' => '1300000' . substr(md5($id), 0, 4),
            'id_card' => substr(md5('id-card|' . $id), 0, 20),
            'role' => $role,
            'password' => 'synthetic-password-not-for-output',
            'status' => $status,
        ];
        if (!Db::name('busi_employee')->where('id', $id)->find()) {
            Db::name('busi_employee')->insert($row);
        }

        return $row;
    }

    protected function makeMembership(string $employeeId, string $storeId, string $merchantId = 'merchant-a'): void
    {
        $exists = Db::name('busi_employee_store')
            ->where('employee_id', $employeeId)
            ->where('store_id', $storeId)
            ->find();
        if (!$exists) {
            Db::name('busi_employee_store')->insert([
                'id' => 'es_' . substr(md5($employeeId . '|' . $storeId), 0, 24),
                'merchant_id' => $merchantId,
                'employee_id' => $employeeId,
                'store_id' => $storeId,
                'created_at' => date('Y-m-d H:i:s'),
            ]);
        }
    }

    protected function actingAs(
        string $employeeId,
        string $storeId,
        array $permissions = [],
        string $role = 'employee',
        string $merchantId = 'merchant-a',
        bool $membership = true
    ): void {
        $this->makeStore($storeId, $merchantId);
        $this->makeEmployee($employeeId, $storeId, $role, $merchantId);
        if ($membership) {
            $this->makeMembership($employeeId, $storeId, $merchantId);
        }
        foreach ($permissions as $permission) {
            $this->grantPermission($employeeId, $storeId, $permission, $merchantId);
        }

        $tokenInfo = EmployeeTokenService::setToken($employeeId, $storeId, 'pc');
        self::assertIsArray($tokenInfo);
        $this->token = $tokenInfo['token'];
        $this->tokens[] = $this->token;
    }

    protected function grantPermission(
        string $employeeId,
        string $storeId,
        string $code,
        string $merchantId = 'merchant-a'
    ): void {
        $suffix = substr(md5($employeeId . '|' . $storeId . '|' . $code), 0, 20);
        $roleId = 't5_role_' . $suffix;
        $permissionId = 't5_perm_' . $suffix;
        $now = date('Y-m-d H:i:s');

        if (!Db::name('busi_employee_role')->where('id', $roleId)->find()) {
            Db::name('busi_employee_role')->insert([
                'id' => $roleId,
                'merchant_id' => $merchantId,
                'store_id' => $storeId,
                'name' => 'Synthetic Role',
                'code' => 't5_' . substr($suffix, 0, 12),
                'status' => 1,
                'is_system' => 0,
            ]);
        }
        if (!Db::name('busi_permission')->where('id', $permissionId)->find()) {
            Db::name('busi_permission')->insert([
                'id' => $permissionId,
                'merchant_id' => $merchantId,
                'store_id' => $storeId,
                'name' => 'Synthetic ' . $code,
                'code' => $code,
                'module' => 'pc',
                'type' => 'button',
                'status' => 1,
            ]);
        }
        if (!Db::name('busi_role_permission')->where('role_id', $roleId)->where('permission_id', $permissionId)->find()) {
            Db::name('busi_role_permission')->insert([
                'id' => 't5_rp_' . $suffix,
                'store_id' => $storeId,
                'role_id' => $roleId,
                'permission_id' => $permissionId,
                'created_at' => $now,
            ]);
        }
        if (!Db::name('busi_employee_role_relation')->where('employee_id', $employeeId)->where('role_id', $roleId)->find()) {
            Db::name('busi_employee_role_relation')->insert([
                'id' => 't5_err_' . $suffix,
                'store_id' => $storeId,
                'employee_id' => $employeeId,
                'role_id' => $roleId,
                'created_at' => $now,
            ]);
        }
    }

    protected function get(string $uri, array $body = []): Response
    {
        return $this->request('GET', $uri, $body);
    }

    protected function request(string $method, string $uri, array $body = []): Response
    {
        $parts = parse_url($uri);
        parse_str($parts['query'] ?? '', $query);
        $headers = $this->token === null ? [] : ['Authorization' => 'Bearer ' . $this->token];
        $request = app()->make('request', [], true);
        $request->setMethod($method)
            ->setUrl($uri)
            ->setPathinfo(ltrim($parts['path'] ?? '', '/'))
            ->withGet($query)
            ->withPost($body)
            ->withHeader($headers);

        app()->route->clear();
        app()->instance(LikeAdminAllowMiddleware::class, new class {
            public function handle($request, \Closure $next): Response
            {
                return $next($request);
            }
        });
        app()->instance(MultiApp::class, new class {
            public function handle($request, \Closure $next): Response
            {
                return $next($request);
            }
        });

        return app()->http->run($request);
    }

    protected function responseData(Response $response): array
    {
        $data = json_decode($response->getContent(), true);
        self::assertIsArray($data, $response->getContent());

        return $data;
    }

    protected function makeCashFlow(
        string $id,
        string $employeeId,
        string $storeId,
        string $createdAt,
        array $overrides = []
    ): array {
        $row = array_merge([
            'id' => $id,
            'store_id' => $storeId,
            'order_id' => null,
            'order_no' => 'T5-CF-' . $id,
            'type' => 'income',
            'category' => 'other',
            'amount' => 0,
            'payment_method' => 'cash',
            'balance_before' => 0,
            'balance_after' => 0,
            'description' => 'synthetic-private-description',
            'operator_id' => $employeeId,
            'operator_name' => 'Synthetic Operator',
            'created_at' => $createdAt,
        ], $overrides);
        Db::name('busi_cash_flow')->insert($row);

        return $row;
    }
}

final class AgentAccessTest extends AgentAccessTestCase
{
    public function testAgentEndpointsRequireTokenWithHttp401(): void
    {
        $this->token = null;

        foreach ([
            '/storeapi/agent.Auth/context?store_id=store-a',
            '/storeapi/agent.Reconciliation/shiftEvidence?shift_id=shift-a&store_id=store-a',
        ] as $uri) {
            $response = $this->get($uri);
            self::assertSame(401, $response->getCode(), $uri);
        }
    }

    public function testContextUsesDatabaseIdentityAndPermissions(): void
    {
        $this->actingAs('emp-context', 'store-a', ['finance:cashflow']);

        $response = $this->get('/storeapi/agent.Auth/context?store_id=store-a');

        self::assertSame(200, $response->getCode(), $response->getContent());
        $data = $this->responseData($response);
        self::assertSame([
            'employee_id' => 'emp-context',
            'merchant_id' => 'merchant-a',
            'store_id' => 'store-a',
            'role' => 'employee',
            'permissions' => ['finance:cashflow'],
        ], $data);
    }

    public function testBossCanAccessSameMerchantStoreWithoutMembership(): void
    {
        $this->actingAs('boss-a', 'store-a', [], 'boss', 'merchant-a', false);
        $this->makeStore('store-b', 'merchant-a');

        $response = $this->get('/storeapi/agent.Auth/context?store_id=store-b');

        self::assertSame(200, $response->getCode(), $response->getContent());
        $data = $this->responseData($response);
        self::assertSame('store-b', $data['store_id']);
        self::assertSame(['*'], $data['permissions']);
    }

    public function testBossCannotAccessDisabledStore(): void
    {
        $this->actingAs('boss-disabled', 'store-a', [], 'boss', 'merchant-a', false);
        $this->makeStore('store-disabled-boss', 'merchant-a');
        Db::name('busi_store')->where('id', 'store-disabled-boss')->update(['status' => 0]);

        $response = $this->get('/storeapi/agent.Auth/context?store_id=store-disabled-boss');

        self::assertSame(403, $response->getCode(), $response->getContent());
    }

    public function testEmployeeWithMembershipCannotAccessDisabledStore(): void
    {
        $this->actingAs('emp-disabled', 'store-disabled-employee', ['finance:cashflow']);
        Db::name('busi_store')->where('id', 'store-disabled-employee')->update(['status' => 0]);

        $response = $this->get('/storeapi/agent.Auth/context?store_id=store-disabled-employee');

        self::assertSame(403, $response->getCode(), $response->getContent());
    }

    public function testBossCannotAccessAnotherMerchantStore(): void
    {
        $this->actingAs('boss-cross', 'store-a', [], 'boss', 'merchant-a', false);
        $this->makeStore('store-merchant-b', 'merchant-b');

        $response = $this->get('/storeapi/agent.Auth/context?store_id=store-merchant-b');

        self::assertSame(403, $response->getCode());
    }

    public function testEmployeeWithoutMembershipCannotAccessStore(): void
    {
        $this->actingAs('emp-no-membership', 'store-a', ['finance:cashflow']);
        $this->makeStore('store-unrelated', 'merchant-a');

        $response = $this->get('/storeapi/agent.Auth/context?store_id=store-unrelated');

        self::assertSame(403, $response->getCode());
    }

    public function testEmployeeWithMembershipButWithoutFinancePermissionCannotReadEvidence(): void
    {
        $this->actingAs('emp-no-finance', 'store-a');
        $this->makeShift('shift-no-finance', 'emp-no-finance', 'store-a', 'checked_out');

        $response = $this->get('/storeapi/agent.Reconciliation/shiftEvidence?shift_id=shift-no-finance&store_id=store-a');

        self::assertSame(403, $response->getCode());
    }

    public function testEmployeeCannotReadAnotherStoreShift(): void
    {
        $this->actingAs('emp-a', 'store-a', ['finance:cashflow']);
        $this->makeStore('store-b', 'merchant-a');
        $this->makeShift('shift-b', 'emp-b', 'store-b', 'checked_out');

        $response = $this->get('/storeapi/agent.Reconciliation/shiftEvidence?shift_id=shift-b&store_id=store-b');

        self::assertSame(403, $response->getCode());
    }

    public function testForgedIdentityFieldsAreRejectedInQueryAndBodyWithoutChangingContext(): void
    {
        $this->actingAs('emp-forgery', 'store-a', ['finance:cashflow']);
        $this->makeShift('shift-forgery', 'emp-forgery', 'store-a', 'checked_out');
        $fields = ['tenant_id', 'employee_id', 'role', 'permissions'];

        foreach (['query', 'body'] as $location) {
            foreach ($fields as $field) {
                $forged = [$field => $field === 'permissions' ? '*' : 'forged-identity'];
                $targets = [
                    '/storeapi/agent.Auth/context?store_id=store-a',
                    '/storeapi/agent.Reconciliation/shiftEvidence?shift_id=shift-forgery&store_id=store-a',
                ];
                foreach ($targets as $target) {
                    $uri = $target;
                    $body = [];
                    if ($location === 'query') {
                        $uri .= '&' . http_build_query($forged);
                    } else {
                        $body = $forged;
                    }

                    $response = $this->get($uri, $body);

                    self::assertSame(422, $response->getCode(), $location . ' ' . $field . ' ' . $target);
                }
            }
        }

        $response = $this->get('/storeapi/agent.Auth/context?store_id=store-a');
        $data = $this->responseData($response);
        self::assertSame('emp-forgery', $data['employee_id']);
        self::assertSame('merchant-a', $data['merchant_id']);
        self::assertSame('employee', $data['role']);
        self::assertSame(['finance:cashflow'], $data['permissions']);
    }
}
