<?php

declare(strict_types=1);

namespace app\storeapi\controller\agent;

use app\storeapi\controller\BaseStoreController;
use app\storeapi\logic\agent\ReconciliationEvidenceLogic;
use app\storeapi\logic\agent\StoreAccessLogic;

class ReconciliationController extends BaseStoreController
{
    public function shiftEvidence()
    {
        StoreAccessLogic::rejectIdentityOverrides($this->request->get(), $this->request->post());

        $storeId = $this->getStoreId();
        $shiftId = (string)$this->request->get('shift_id', '');
        if ($storeId === '' || $shiftId === '') {
            return json(['code' => 'invalid_evidence_context', 'message' => 'shift_id 和 store_id 不能为空'], 422);
        }

        $access = StoreAccessLogic::assertAccess($this->employeeId, $storeId);
        $this->employeeInfo = $access['employee'];
        $this->storeId = $storeId;
        if (!$access['is_boss']) {
            $this->checkPermission('finance:cashflow');
        }

        return json(ReconciliationEvidenceLogic::getShiftEvidence($shiftId, $storeId));
    }
}
