<?php
$file = "/www/wwwroot/wwwapi/app/storeapi/controller/pos/OrderController.php";
$f = file_get_contents($file);

// Replace: insert missing fields before the closing ]);
$f = str_replace(
    "'verify_code'   => \$this->request->post('verify_code', null),\n        ]);",
    "'verify_code'   => \$this->request->post('verify_code', null),\n            'pay_type'      => \$this->request->post('pay_type', 'cash'),\n            'pay_amount'    => floatval(\$data['pay_amount'] ?? 0),\n            'bill_locked_at' => \$this->request->post('bill_locked_at', null),\n            'discount'      => floatval(\$data['discount'] ?? 0),\n            'remark'        => \$this->request->post('remark', ''),\n        ]);",
    $f
);
file_put_contents($file, $f);
echo "Fixed controller\n";
