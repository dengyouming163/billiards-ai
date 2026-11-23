<?php

declare (strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class File extends Model
{
    protected $name = 'busi_file';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    
    protected $schema = [
        'id' => 'string',
        'store_id' => 'string',
        'category' => 'string',
        'file_name' => 'string',
        'original_name' => 'string',
        'file_path' => 'string',
        'file_url' => 'string',
        'file_type' => 'string',
        'file_size' => 'bigint',
        'width' => 'integer',
        'height' => 'integer',
        'uploader_id' => 'string',
        'uploader_name' => 'string',
        'description' => 'string',
        'created_at' => 'datetime',
    ];
}