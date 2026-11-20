<?php
declare (strict_types=1);

namespace app\common\model\storeapi;

use think\Model;

class SinkingRecord extends Model
{
    protected $name = 'bi_busi_sinking_record';
    protected $pk = 'id';
    protected $autoWriteTimestamp = false;
    protected $createTime = 'created_at';
    
    protected $schema = [
        'id' => 'string',
        'score_board_id' => 'string',
        'player_index' => 'integer',
        'ball_id' => 'string',
        'points' => 'integer',
        'round_number' => 'integer',
        'created_at' => 'datetime',
    ];
    
    public function scoreBoard()
    {
        return $this->belongsTo(ScoreBoard::class, 'score_board_id');
    }
}
