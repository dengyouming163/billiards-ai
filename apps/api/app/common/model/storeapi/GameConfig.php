<?php
declare (strict_types=1);

namespace app\common\model\storeapi;

use think\Model;

class GameConfig extends Model
{
    protected $name = 'bi_busi_game_config';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = 'updated_at';
    protected $deleteTime = 'deleted_at';
    
    protected $schema = [
        'id' => 'string',
        'code' => 'string',
        'name' => 'string',
        'icon' => 'string',
        'description' => 'text',
        'ball_count' => 'integer',
        'ball_type' => 'string',
        'scoring_type' => 'string',
        'target_score' => 'integer',
        'default_player_count' => 'integer',
        'sort_order' => 'integer',
        'status' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];
    
    public static function getConfigs()
    {
        return self::where('status', 1)
            ->order('sort_order', 'asc')
            ->select();
    }
    
    public static function getConfigByCode(string $code)
    {
        return self::where('code', $code)
            ->where('status', 1)
            ->find();
    }
}
