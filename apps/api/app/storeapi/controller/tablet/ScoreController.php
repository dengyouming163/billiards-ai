<?php

declare (strict_types=1);

namespace app\storeapi\controller\tablet;

use app\common\model\merchant\Table;
use think\facade\Cache;

class ScoreController extends BaseTabletController
{
    public array $notNeedLogin = ['gameConfigs', 'rules', 'create', 'get', 'sinkBall', 'foul', 'switchPlayer', 'endGame', 'reset'];

    private array $gameConfigs = [
        'eight_ball' => [
            'name' => '中式八球',
            'description' => '经典中式台球玩法，选手需按规则依次击入目标球',
            'ball_count' => 16,
            'max_players' => 2,
            'winning_condition' => 'clear_all',
            'rules' => [
                'ball_types' => [
                    'solid' => ['name' => '实心球', 'balls' => [1, 2, 3, 4, 5, 6, 7]],
                    'stripe' => ['name' => '花色球', 'balls' => [9, 10, 11, 12, 13, 14, 15]],
                    'eight' => ['name' => '8号球', 'balls' => [8]]
                ],
                'scoring' => '每进一球计1分',
                'foul_conditions' => [
                    '白球落袋',
                    '击球未碰到目标球',
                    '击球后无球碰库',
                    '连击',
                    '触球后白球落袋'
                ],
                'foul_penalty' => '对方获得自由球'
            ]
        ],
        'nine_ball' => [
            'name' => '美式九球',
            'description' => '以击中9号球为胜利目标的台球游戏',
            'ball_count' => 10,
            'max_players' => 2,
            'winning_condition' => 'nine_ball_first',
            'rules' => [
                'ball_order' => [1, 2, 3, 4, 5, 6, 7, 8, 9],
                'scoring' => '无积分，目标为首先合法击入9号球',
                'foul_conditions' => [
                    '白球落袋',
                    '首先碰撞非编号最低球',
                    '无球碰库',
                    '球跳离台面'
                ],
                'foul_penalty' => '对方获得自由球'
            ]
        ],
        'snooker' => [
            'name' => '斯诺克',
            'description' => '绅士运动，追求高分值的台球竞技',
            'ball_count' => 22,
            'max_players' => 2,
            'winning_condition' => 'highest_score',
            'rules' => [
                'ball_types' => [
                    'red' => ['name' => '红球', 'balls' => 15, 'points' => 1],
                    'colors' => ['name' => '彩球', 'balls' => ['Y' => 2, 'G' => 3, 'Br' => 4, 'B' => 5, 'P' => 6, 'BK' => 7]]
                ],
                'scoring' => [
                    '红球' => 1,
                    '黄球' => 2,
                    '绿球' => 3,
                    '棕球' => 4,
                    '蓝球' => 5,
                    '粉球' => 6,
                    '黑球' => 7
                ],
                'foul_conditions' => [
                    '白球落袋',
                    '首先碰撞红球外的球',
                    '红球未入袋时彩球未复位',
                    '击球后无球碰库'
                ],
                'foul_penalty' => '对方获得4分基础罚分'
            ]
        ],
        'carom' => [
            'name' => '开仑',
            'description' => '三球制台球，追求碰库得分的经典玩法',
            'ball_count' => 3,
            'max_players' => 2,
            'winning_condition' => 'points_target',
            'rules' => [
                'balls' => ['W1' => '白球1', 'W2' => '白球2', 'R' => '红球'],
                'scoring' => '每次合法碰库得分',
                'target_score' => 100,
                'foul_conditions' => [
                    '白球落袋',
                    '碰库数不足',
                    '连续三次碰目标球'
                ],
                'foul_penalty' => '对方加2分'
            ]
        ]
    ];

    public function gameConfigs()
    {
        $configs = [];
        foreach ($this->gameConfigs as $code => $config) {
            $configs[] = [
                'code' => $code,
                'name' => $config['name'],
                'description' => $config['description'],
                'ball_count' => $config['ball_count'],
                'max_players' => $config['max_players'],
                'winning_condition' => $config['winning_condition']
            ];
        }
        return $this->success('获取成功', $configs);
    }

    public function rules()
    {
        $gameType = $this->request->get('game_type');
        
        if (!$gameType) {
            return $this->fail('游戏类型不能为空');
        }
        
        if (!isset($this->gameConfigs[$gameType])) {
            return $this->fail('不支持的游戏类型');
        }
        
        return $this->success('获取成功', $this->gameConfigs[$gameType]);
    }

    public function create()
    {
        $data = $this->request->post();
        
        $tableId = $data['table_id'] ?? '';
        $gameType = $data['game_type'] ?? 'eight_ball';
        $player1Name = $data['player1_name'] ?? '玩家1';
        $player2Name = $data['player2_name'] ?? '玩家2';
        $targetScore = $data['target_score'] ?? null;
        
        if (!$tableId) {
            return $this->fail('桌台ID不能为空');
        }
        
        if (!isset($this->gameConfigs[$gameType])) {
            return $this->fail('不支持的游戏类型');
        }
        
        $table = Table::where('id', $tableId)->find();
        if (!$table) {
            return $this->fail('桌台不存在');
        }
        
        $existingBoard = Cache::get('score_board_' . $tableId);
        if ($existingBoard && $existingBoard['status'] !== 'ended') {
            return $this->fail('该桌台已有正在进行的游戏');
        }
        
        $scoreBoard = [
            'id' => $this->uuid(),
            'table_id' => $tableId,
            'game_type' => $gameType,
            'game_name' => $this->gameConfigs[$gameType]['name'],
            'players' => [
                ['id' => 0, 'name' => $player1Name, 'balls' => [], 'is_online' => true],
                ['id' => 1, 'name' => $player2Name, 'balls' => [], 'is_online' => true]
            ],
            'current_player_index' => 0,
            'balls_remaining' => $this->getInitialBalls($gameType),
            'balls_sunk' => [
                ['player_index' => 0, 'balls' => []],
                ['player_index' => 1, 'balls' => []]
            ],
            'scores' => [0, 0],
            'target_score' => $targetScore,
            'status' => 'playing',
            'winner' => null,
            'foul_count' => [0, 0],
            'history' => [],
            'created_at' => date('Y-m-d H:i:s')
        ];
        
        Cache::set('score_board_' . $tableId, $scoreBoard, 7200);
        
        return $this->success('计分板创建成功', $scoreBoard);
    }

    public function get()
    {
        $tableId = $this->request->get('table_id');
        
        if (!$tableId) {
            return $this->fail('桌台ID不能为空');
        }
        
        $scoreBoard = Cache::get('score_board_' . $tableId);
        
        if (!$scoreBoard) {
            return $this->success('获取成功', null);
        }
        
        return $this->success('获取成功', $scoreBoard);
    }

    public function sinkBall()
    {
        $data = $this->request->post();
        
        $tableId = $data['table_id'] ?? '';
        $ballId = $data['ball_id'] ?? null;
        
        if (!$tableId) {
            return $this->fail('桌台ID不能为空');
        }
        
        if ($ballId === null) {
            return $this->fail('球ID不能为空');
        }
        
        $scoreBoard = Cache::get('score_board_' . $tableId);
        if (!$scoreBoard) {
            return $this->fail('计分板不存在');
        }
        
        if ($scoreBoard['status'] === 'ended') {
            return $this->fail('游戏已结束');
        }
        
        $currentPlayerIndex = $scoreBoard['current_player_index'];
        $gameType = $scoreBoard['game_type'];
        $ballsRemaining = $scoreBoard['balls_remaining'];
        
        if (is_array($ballId)) {
            $ballId = $ballId[0];
        }
        
        if (is_numeric($ballId)) {
            $ballId = intval($ballId);
        }
        
        if (is_string($ballId) && is_numeric($ballId)) {
            $ballId = intval($ballId);
        }
        
        $ballExists = false;
        foreach ($ballsRemaining as $ball) {
            if ($ball === $ballId || $ball == $ballId) {
                $ballExists = true;
                break;
            }
        }
        
        if (!$ballExists) {
            return $this->fail('该球已不在剩余球中');
        }
        
        $points = $this->calculatePoints($gameType, $ballId);
        
        $scoreBoard['balls_sunk'][$currentPlayerIndex]['balls'][] = $ballId;
        $scoreBoard['scores'][$currentPlayerIndex] += $points;
        $scoreBoard['players'][$currentPlayerIndex]['balls'][] = $ballId;
        
        $scoreBoard['balls_remaining'] = array_values(array_filter($ballsRemaining, function($b) use ($ballId) {
            return $b !== $ballId && $b != $ballId;
        }));
        
        $scoreBoard['history'][] = [
            'type' => 'sink',
            'player_index' => $currentPlayerIndex,
            'ball_id' => $ballId,
            'points' => $points,
            'time' => date('H:i:s')
        ];
        
        $winResult = $this->checkWinCondition($scoreBoard);
        
        if ($winResult !== null) {
            $scoreBoard['status'] = 'ended';
            $scoreBoard['winner'] = $winResult;
            
            Cache::set('score_board_' . $tableId, $scoreBoard, 7200);
            
            return $this->success('游戏结束', [
                'score_board' => $scoreBoard,
                'winner' => $winResult,
                'winner_name' => $scoreBoard['players'][$winResult]['name'],
                'final_scores' => $scoreBoard['scores']
            ]);
        }
        
        if ($gameType === 'snooker' && !is_numeric($ballId)) {
            $scoreBoard['balls_remaining'][] = $ballId;
        }
        
        if ($gameType !== 'carom') {
            $scoreBoard['current_player_index'] = $currentPlayerIndex === 0 ? 1 : 0;
        }
        
        Cache::set('score_board_' . $tableId, $scoreBoard, 7200);
        
        return $this->success('进球记录成功', [
            'score_board' => $scoreBoard,
            'points_earned' => $points,
            'current_player' => $scoreBoard['current_player_index']
        ]);
    }

    public function foul()
    {
        $data = $this->request->post();
        
        $tableId = $data['table_id'] ?? '';
        $foulType = $data['foul_type'] ?? 'general';
        $penalty = $data['penalty'] ?? 4;
        
        if (!$tableId) {
            return $this->fail('桌台ID不能为空');
        }
        
        $scoreBoard = Cache::get('score_board_' . $tableId);
        if (!$scoreBoard) {
            return $this->fail('计分板不存在');
        }
        
        if ($scoreBoard['status'] === 'ended') {
            return $this->fail('游戏已结束');
        }
        
        $currentPlayerIndex = $scoreBoard['current_player_index'];
        $opponentIndex = $currentPlayerIndex === 0 ? 1 : 0;
        
        $scoreBoard['foul_count'][$currentPlayerIndex]++;
        
        if ($scoreBoard['game_type'] === 'snooker') {
            $scoreBoard['scores'][$opponentIndex] += $penalty;
        } elseif ($scoreBoard['game_type'] === 'carom') {
            $scoreBoard['scores'][$opponentIndex] += 2;
        } else {
            $scoreBoard['scores'][$opponentIndex] += $penalty;
        }
        
        $scoreBoard['current_player_index'] = $opponentIndex;
        
        $scoreBoard['history'][] = [
            'type' => 'foul',
            'player_index' => $currentPlayerIndex,
            'foul_type' => $foulType,
            'penalty' => $penalty,
            'time' => date('H:i:s')
        ];
        
        Cache::set('score_board_' . $tableId, $scoreBoard, 7200);
        
        return $this->success('犯规记录成功', [
            'score_board' => $scoreBoard,
            'penalty_applied' => $penalty,
            'current_player' => $scoreBoard['current_player_index']
        ]);
    }

    public function switchPlayer()
    {
        $tableId = $this->request->post('table_id');
        
        if (!$tableId) {
            return $this->fail('桌台ID不能为空');
        }
        
        $scoreBoard = Cache::get('score_board_' . $tableId);
        if (!$scoreBoard) {
            return $this->fail('计分板不存在');
        }
        
        if ($scoreBoard['status'] === 'ended') {
            return $this->fail('游戏已结束');
        }
        
        $scoreBoard['current_player_index'] = $scoreBoard['current_player_index'] === 0 ? 1 : 0;
        
        $scoreBoard['history'][] = [
            'type' => 'switch',
            'player_index' => $scoreBoard['current_player_index'],
            'time' => date('H:i:s')
        ];
        
        Cache::set('score_board_' . $tableId, $scoreBoard, 7200);
        
        return $this->success('切换成功', [
            'current_player_index' => $scoreBoard['current_player_index'],
            'current_player_name' => $scoreBoard['players'][$scoreBoard['current_player_index']]['name']
        ]);
    }

    public function endGame()
    {
        $tableId = $this->request->post('table_id');
        
        if (!$tableId) {
            return $this->fail('桌台ID不能为空');
        }
        
        $scoreBoard = Cache::get('score_board_' . $tableId);
        if (!$scoreBoard) {
            return $this->fail('计分板不存在');
        }
        
        $scoreBoard['status'] = 'ended';
        
        $player1Score = $scoreBoard['scores'][0];
        $player2Score = $scoreBoard['scores'][1];
        
        $winner = null;
        if ($player1Score > $player2Score) {
            $winner = 0;
        } elseif ($player2Score > $player1Score) {
            $winner = 1;
        }
        
        $scoreBoard['winner'] = $winner;
        
        $scoreBoard['history'][] = [
            'type' => 'end',
            'reason' => 'manual_end',
            'winner' => $winner,
            'time' => date('H:i:s')
        ];
        
        Cache::set('score_board_' . $tableId, $scoreBoard, 7200);
        
        return $this->success('游戏结束', [
            'winner' => $winner,
            'winner_name' => $winner !== null ? $scoreBoard['players'][$winner]['name'] : null,
            'player1_score' => $player1Score,
            'player2_score' => $player2Score,
            'game_status' => 'ended'
        ]);
    }

    public function reset()
    {
        $tableId = $this->request->post('table_id');
        
        if (!$tableId) {
            return $this->fail('桌台ID不能为空');
        }
        
        Cache::delete('score_board_' . $tableId);
        
        return $this->success('重置成功');
    }

    private function checkWinCondition($scoreBoard): ?int
    {
        $gameType = $scoreBoard['game_type'];
        
        switch ($gameType) {
            case 'eight_ball':
                if (!in_array(8, $scoreBoard['balls_remaining']) && !in_array(8, array_map('intval', $scoreBoard['balls_remaining']))) {
                    return $scoreBoard['current_player_index'];
                }
                break;
                
            case 'nine_ball':
                $hasNine = false;
                foreach ($scoreBoard['balls_remaining'] as $ball) {
                    if ($ball === 9 || $ball == 9) {
                        $hasNine = true;
                        break;
                    }
                }
                if (!$hasNine) {
                    return $scoreBoard['current_player_index'];
                }
                break;
                
            case 'snooker':
                if (count($scoreBoard['balls_remaining']) === 0) {
                    if ($scoreBoard['scores'][0] > $scoreBoard['scores'][1]) {
                        return 0;
                    } elseif ($scoreBoard['scores'][1] > $scoreBoard['scores'][0]) {
                        return 1;
                    }
                    return null;
                }
                break;
                
            case 'carom':
                if ($scoreBoard['target_score']) {
                    if ($scoreBoard['scores'][0] >= $scoreBoard['target_score']) {
                        return 0;
                    } elseif ($scoreBoard['scores'][1] >= $scoreBoard['target_score']) {
                        return 1;
                    }
                }
                break;
        }
        
        return null;
    }

    private function calculatePoints(string $gameType, $ballId): int
    {
        $pointsMap = [
            'snooker' => [
                'R' => 1, 'Y' => 2, 'G' => 3, 'Br' => 4, 'B' => 5, 'P' => 6, 'BK' => 7
            ],
        ];
        
        if (isset($pointsMap[$gameType])) {
            if (isset($pointsMap[$gameType][$ballId])) {
                return $pointsMap[$gameType][$ballId];
            }
            if (is_numeric($ballId) && $ballId == 1) {
                return 1;
            }
            return 1;
        }
        
        if (is_numeric($ballId)) {
            return intval($ballId);
        }
        
        return 1;
    }

    private function getInitialBalls(string $gameType): array
    {
        switch ($gameType) {
            case 'eight_ball':
                return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
            case 'nine_ball':
                return [1, 2, 3, 4, 5, 6, 7, 8, 9];
            case 'snooker':
                return array_merge(
                    array_fill(0, 15, 'R'),
                    ['Y', 'G', 'Br', 'B', 'P', 'BK']
                );
            case 'carom':
                return ['W1', 'W2', 'R'];
            default:
                return [];
        }
    }
}
