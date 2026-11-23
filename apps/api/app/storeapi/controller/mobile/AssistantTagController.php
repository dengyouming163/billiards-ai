<?php

namespace app\storeapi\controller\mobile;

use app\storeapi\controller\BaseStoreController;
use app\storeapi\logic\mobile\AssistantTagLogic;
use app\common\annotation\Permission;
use app\common\service\JsonService;

class AssistantTagController extends BaseStoreController
{
    #[Permission('mobile:assistant', '助教宣传', 'mobile', '个人', ['boss', 'manager', 'assistant', 'coach'])]
    public function list()
    {
        $result = AssistantTagLogic::getTags();
        return JsonService::data($result);
    }
    
    #[Permission('mobile:assistant', '助教宣传', 'mobile', '个人', ['boss', 'manager', 'assistant', 'coach'])]
    public function listGrouped()
    {
        $result = AssistantTagLogic::getTagsGrouped();
        return JsonService::data($result);
    }
}
