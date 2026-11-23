<?php

declare(strict_types=1);

namespace app\storeapi\tests\controller;

use PHPUnit\Framework\TestCase;

class TabletControllerTest extends TestCase
{
    /**
     * 测试订单控制器方法存在性
     */
    public function testOrderControllerMethodsExist()
    {
        $controllerClass = 'app\\storeapi\\controller\\tablet\\OrderController';

        $this->assertTrue(
            method_exists($controllerClass, 'quickCreate'),
            'quickCreate method should exist'
        );

        $this->assertTrue(
            method_exists($controllerClass, 'prepaidCreate'),
            'prepaidCreate method should exist'
        );

        $this->assertTrue(
            method_exists($controllerClass, 'addItem'),
            'addItem method should exist'
        );

        $this->assertTrue(
            method_exists($controllerClass, 'getOrder'),
            'getOrder method should exist'
        );

        $this->assertTrue(
            method_exists($controllerClass, 'getBill'),
            'getBill method should exist'
        );

        $this->assertTrue(
            method_exists($controllerClass, 'checkout'),
            'checkout method should exist'
        );

        $this->assertTrue(
            method_exists($controllerClass, 'merge'),
            'merge method should exist'
        );

        $this->assertTrue(
            method_exists($controllerClass, 'changeTable'),
            'changeTable method should exist'
        );

        $this->assertTrue(
            method_exists($controllerClass, 'cancel'),
            'cancel method should exist'
        );
    }

    /**
     * 测试助教控制器方法存在性
     */
    public function testAssistantControllerMethodsExist()
    {
        $controllerClass = 'app\\storeapi\\controller\\tablet\\AssistantController';

        $this->assertTrue(
            method_exists($controllerClass, 'list'),
            'list method should exist'
        );

        $this->assertTrue(
            method_exists($controllerClass, 'book'),
            'book method should exist'
        );

        $this->assertTrue(
            method_exists($controllerClass, 'startService'),
            'startService method should exist'
        );

        $this->assertTrue(
            method_exists($controllerClass, 'endService'),
            'endService method should exist'
        );

        $this->assertTrue(
            method_exists($controllerClass, 'cancel'),
            'cancel method should exist'
        );

        $this->assertTrue(
            method_exists($controllerClass, 'getOrder'),
            'getOrder method should exist'
        );

        $this->assertTrue(
            method_exists($controllerClass, 'levels'),
            'levels method should exist'
        );
    }

    /**
     * 测试 $notNeedLogin 配置
     */
    public function testNotNeedLoginConfig()
    {
        $orderControllerClass = 'app\\storeapi\\controller\\tablet\\OrderController';
        $assistantControllerClass = 'app\\storeapi\\controller\\tablet\\AssistantController';

        $orderReflection = new \ReflectionClass($orderControllerClass);
        $orderProperty = $orderReflection->getProperty('notNeedLogin');
        $orderProperty->setAccessible(true);

        $assistantReflection = new \ReflectionClass($assistantControllerClass);
        $assistantProperty = $assistantReflection->getProperty('notNeedLogin');
        $assistantProperty->setAccessible(true);

        $orderNotNeedLogin = $orderProperty->getDefaultValue();
        $assistantNotNeedLogin = $assistantProperty->getDefaultValue();

        $this->assertIsArray($orderNotNeedLogin);
        $this->assertIsArray($assistantNotNeedLogin);

        $this->assertContains('getBill', $orderNotNeedLogin);
        $this->assertContains('merge', $orderNotNeedLogin);
        $this->assertContains('changeTable', $orderNotNeedLogin);
        $this->assertContains('cancel', $orderNotNeedLogin);

        $this->assertContains('startService', $assistantNotNeedLogin);
        $this->assertContains('endService', $assistantNotNeedLogin);
    }
}
