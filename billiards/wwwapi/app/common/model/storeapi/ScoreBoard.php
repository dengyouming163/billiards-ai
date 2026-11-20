<?php
declare (strict_types=1);

namespace app\common\model\storeapi;

use think\Model;

class ScoreBoard extends Model
{
    protected $name = 'bi_busi_score_board';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = 'updated_at';
    protected $deleteTime = 'deleted_at';
    
    protected $schema = [
        'id' => 'string',
        'table_id' => 'string',
        'game_type' => 'string',
        'game_name' => 'string',
        'status' => 'string',
        'players' => 'string',
        'current_player_index' => 'integer',
        'balls_remaining' => 'string',
        'balls_sunk' => 'string',
        'scores' => 'string',
        'target_score' => 'integer',
        'winner' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];
    
    protected $json = ['players', 'balls_remaining', 'balls_sunk', 'scores'];
}
