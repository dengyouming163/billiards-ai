<?php
// +----------------------------------------------------------------------
// | likeadmin快速开发前后端分离管理后台（PHP版）
// +----------------------------------------------------------------------
// | 欢迎阅读学习系统程序代码，建议反馈是我们前进的动力
// | 开源版本可自由商用，可去除界面版权logo
// | gitee下载：https://gitee.com/likeshop_gitee/likeadmin
// | github下载：https://github.com/likeshop-github/likeadmin
// | 访问官网：https://www.likeadmin.cn
// | likeadmin团队 版权所有 拥有最终解释权
// +----------------------------------------------------------------------
// | author: likeadminTeam
// +----------------------------------------------------------------------

namespace app\common\config;

/**
 * 台球游戏规则配置类
 * Class GameRules
 * @package app\common\config
 */
class GameRules
{
    public static function getRules(string $gameType): array
    {
        $rules = [
            'eight_ball' => [
                'title' => '中式八球规则',
                'basic' => [
                    '开球后首个合法进球确定球色（全色1-7/花色9-15）',
                    '定色后，只能打己方的球',
                    '打完己方7颗球后，才能打8号球',
                ],
                'win' => [
                    '在己方球全部进袋后，将8号球打入指定袋口获胜',
                ],
                'foul' => [
                    '8号球提前入袋判负',
                    '8号球飞出台面判负',
                    '母球飞出台面算犯规',
                ],
            ],
            'nine_ball' => [
                'title' => '美式九球规则',
                'basic' => [
                    '母球必须先碰到台面最小号码的球',
                    '打进9号球即可获胜，无论之前进了多少球',
                ],
                'win' => [
                    '将9号球打入任何袋口即获胜',
                ],
                'foul' => [
                    '未先碰到最小号码球犯规',
                    '母球飞出台面算犯规',
                ],
            ],
            'snooker' => [
                'title' => '斯诺克规则',
                'basic' => [
                    '红球1分、黄球2分、绿球3分、棕球4分、蓝球5分、粉球6分、黑球7分',
                    '必须按"红球→彩球"顺序击打',
                    '打进彩球后，彩球重置回台面',
                ],
                'win' => [
                    '红球全部进袋后，按分值从低到高清空彩球',
                    '总分高者获胜',
                ],
                'foul' => [
                    '犯规一般罚4分',
                    '母球飞出台面算犯规',
                ],
            ],
            'carom' => [
                'title' => '开仑台球规则',
                'basic' => [
                    '母球必须在碰到第一个目标球前先碰库边',
                    '一杆合法击中两个目标球得1分',
                    '赛前约定目标分值（默认40分）',
                ],
                'win' => [
                    '先达到目标分者获胜',
                ],
                'foul' => [
                    '未碰到两个目标球犯规',
                    '母球飞出台面算犯规',
                ],
            ],
            'straight_pool' => [
                'title' => '14-1直池规则',
                'basic' => [
                    '每进一球得1分',
                    '赛前约定目标分值（默认100分）',
                    '可任意选择目标球',
                ],
                'win' => [
                    '先达到目标分者获胜',
                ],
                'foul' => [
                    '母球飞出台面算犯规',
                    '未碰到目标球犯规',
                ],
            ],
            'ten_ball' => [
                'title' => '美式10球规则',
                'basic' => [
                    '指球定袋，必须明确目标球和袋口',
                    '母球必须先碰到台面最小号码的球',
                ],
                'win' => [
                    '指球定袋合法打进10号球即获胜',
                ],
                'foul' => [
                    '未先碰到最小号码球犯规',
                    '母球飞出台面算犯规',
                    '未指球定袋犯规',
                ],
            ],
            'chasing' => [
                'title' => '追分规则',
                'basic' => [
                    '多人玩法，按顺序轮流上场',
                    '大金：一杆清台1-9号球',
                    '小金：一杆清台1-8号球，未打进9号球',
                    '普胜：正常获胜',
                ],
                'win' => [
                    '按约定的分数规则累计得分',
                    '总分高者获胜',
                ],
                'foul' => [
                    '母球飞出台面算犯规',
                    '未先碰到最小号码球犯规',
                ],
            ],
            'draw_lots' => [
                'title' => '摸牌/挂杆规则',
                'basic' => [
                    '赛前每人抽取或分配手牌',
                    '按顺序击打属于自己的球',
                ],
                'win' => [
                    '率先打完自己所有手牌者获胜',
                ],
                'foul' => [
                    '母球飞出台面算犯规',
                    '打进他人手牌犯规',
                ],
            ],
            'shootout' => [
                'title' => '打枪规则',
                'basic' => [
                    '只有母球和目标球',
                    '轮流点球，赛前约定目标分值（默认3分）',
                ],
                'win' => [
                    '先达到目标分者获胜',
                ],
                'foul' => [
                    '母球飞出台面算犯规',
                    '未碰到目标球犯规',
                ],
            ],
            'rolling_score' => [
                'title' => '摇分规则',
                'basic' => [
                    '进球号码即所得分数',
                    '可任意选择目标球',
                    '赛前约定比赛时间或球数',
                ],
                'win' => [
                    '累积分高者获胜',
                ],
                'foul' => [
                    '母球飞出台面算犯规',
                    '未碰到目标球犯规',
                ],
            ],
        ];
        
        return $rules[$gameType] ?? [];
    }
    
    public static function getBallConfig(string $gameType): array
    {
        $balls = [
            'eight_ball' => [
                ['id' => 1, 'type' => 'solid', 'color' => '#f9ca24'],
                ['id' => 2, 'type' => 'solid', 'color' => '#3035d6'],
                ['id' => 3, 'type' => 'solid', 'color' => '#eb4d4d'],
                ['id' => 4, 'type' => 'solid', 'color' => '#8e44ad'],
                ['id' => 5, 'type' => 'solid', 'color' => '#f39c12'],
                ['id' => 6, 'type' => 'solid', 'color' => '#27ae60'],
                ['id' => 7, 'type' => 'solid', 'color' => '#7f3d3d'],
                ['id' => 8, 'type' => 'eight', 'color' => '#1a1a1a'],
                ['id' => 9, 'type' => 'stripe', 'color' => '#f9ca24'],
                ['id' => 10, 'type' => 'stripe', 'color' => '#3035d6'],
                ['id' => 11, 'type' => 'stripe', 'color' => '#eb4d4d'],
                ['id' => 12, 'type' => 'stripe', 'color' => '#8e44ad'],
                ['id' => 13, 'type' => 'stripe', 'color' => '#f39c12'],
                ['id' => 14, 'type' => 'stripe', 'color' => '#27ae60'],
                ['id' => 15, 'type' => 'stripe', 'color' => '#7f3d3d'],
            ],
            'nine_ball' => [
                ['id' => 1, 'type' => 'numbered', 'color' => '#f9ca24'],
                ['id' => 2, 'type' => 'numbered', 'color' => '#3035d6'],
                ['id' => 3, 'type' => 'numbered', 'color' => '#eb4d4d'],
                ['id' => 4, 'type' => 'numbered', 'color' => '#8e44ad'],
                ['id' => 5, 'type' => 'numbered', 'color' => '#f39c12'],
                ['id' => 6, 'type' => 'numbered', 'color' => '#27ae60'],
                ['id' => 7, 'type' => 'numbered', 'color' => '#7f3d3d'],
                ['id' => 8, 'type' => 'numbered', 'color' => '#1a1a1a'],
                ['id' => 9, 'type' => 'numbered', 'color' => '#ffd700'],
            ],
            'snooker' => [
                ['id' => 'R', 'type' => 'red', 'color' => '#ff0000', 'points' => 1],
                ['id' => 'Y', 'type' => 'color', 'color' => '#ffff00', 'points' => 2],
                ['id' => 'G', 'type' => 'color', 'color' => '#00ff00', 'points' => 3],
                ['id' => 'Br', 'type' => 'color', 'color' => '#8b4513', 'points' => 4],
                ['id' => 'B', 'type' => 'color', 'color' => '#0000ff', 'points' => 5],
                ['id' => 'P', 'type' => 'color', 'color' => '#ff69b4', 'points' => 6],
                ['id' => 'BK', 'type' => 'color', 'color' => '#000000', 'points' => 7],
            ],
            'carom' => [
                ['id' => 'W1', 'type' => 'white', 'color' => '#ffffff'],
                ['id' => 'W2', 'type' => 'white', 'color' => '#f0f0f0'],
                ['id' => 'R', 'type' => 'red', 'color' => '#ff0000'],
            ],
            'straight_pool' => [
                ['id' => 1, 'type' => 'numbered', 'color' => '#f9ca24', 'points' => 1],
                ['id' => 2, 'type' => 'numbered', 'color' => '#3035d6', 'points' => 1],
                ['id' => 3, 'type' => 'numbered', 'color' => '#eb4d4d', 'points' => 1],
                ['id' => 4, 'type' => 'numbered', 'color' => '#8e44ad', 'points' => 1],
                ['id' => 5, 'type' => 'numbered', 'color' => '#f39c12', 'points' => 1],
                ['id' => 6, 'type' => 'numbered', 'color' => '#27ae60', 'points' => 1],
                ['id' => 7, 'type' => 'numbered', 'color' => '#7f3d3d', 'points' => 1],
                ['id' => 8, 'type' => 'numbered', 'color' => '#1a1a1a', 'points' => 1],
                ['id' => 9, 'type' => 'numbered', 'color' => '#ffd700', 'points' => 1],
                ['id' => 10, 'type' => 'numbered', 'color' => '#3035d6', 'points' => 1],
                ['id' => 11, 'type' => 'numbered', 'color' => '#eb4d4d', 'points' => 1],
                ['id' => 12, 'type' => 'numbered', 'color' => '#8e44ad', 'points' => 1],
                ['id' => 13, 'type' => 'numbered', 'color' => '#f39c12', 'points' => 1],
                ['id' => 14, 'type' => 'numbered', 'color' => '#27ae60', 'points' => 1],
                ['id' => 15, 'type' => 'numbered', 'color' => '#7f3d3d', 'points' => 1],
            ],
            'ten_ball' => [
                ['id' => 1, 'type' => 'numbered', 'color' => '#f9ca24'],
                ['id' => 2, 'type' => 'numbered', 'color' => '#3035d6'],
                ['id' => 3, 'type' => 'numbered', 'color' => '#eb4d4d'],
                ['id' => 4, 'type' => 'numbered', 'color' => '#8e44ad'],
                ['id' => 5, 'type' => 'numbered', 'color' => '#f39c12'],
                ['id' => 6, 'type' => 'numbered', 'color' => '#27ae60'],
                ['id' => 7, 'type' => 'numbered', 'color' => '#7f3d3d'],
                ['id' => 8, 'type' => 'numbered', 'color' => '#1a1a1a'],
                ['id' => 9, 'type' => 'numbered', 'color' => '#ffd700'],
                ['id' => 10, 'type' => 'numbered', 'color' => '#3035d6'],
            ],
            'chasing' => [
                ['id' => 1, 'type' => 'numbered', 'color' => '#f9ca24'],
                ['id' => 2, 'type' => 'numbered', 'color' => '#3035d6'],
                ['id' => 3, 'type' => 'numbered', 'color' => '#eb4d4d'],
                ['id' => 4, 'type' => 'numbered', 'color' => '#8e44ad'],
                ['id' => 5, 'type' => 'numbered', 'color' => '#f39c12'],
                ['id' => 6, 'type' => 'numbered', 'color' => '#27ae60'],
                ['id' => 7, 'type' => 'numbered', 'color' => '#7f3d3d'],
                ['id' => 8, 'type' => 'numbered', 'color' => '#1a1a1a'],
                ['id' => 9, 'type' => 'numbered', 'color' => '#ffd700'],
            ],
            'draw_lots' => [
                ['id' => 1, 'type' => 'numbered', 'color' => '#f9ca24'],
                ['id' => 2, 'type' => 'numbered', 'color' => '#3035d6'],
                ['id' => 3, 'type' => 'numbered', 'color' => '#eb4d4d'],
                ['id' => 4, 'type' => 'numbered', 'color' => '#8e44ad'],
                ['id' => 5, 'type' => 'numbered', 'color' => '#f39c12'],
                ['id' => 6, 'type' => 'numbered', 'color' => '#27ae60'],
                ['id' => 7, 'type' => 'numbered', 'color' => '#7f3d3d'],
                ['id' => 8, 'type' => 'numbered', 'color' => '#1a1a1a'],
                ['id' => 9, 'type' => 'numbered', 'color' => '#ffd700'],
                ['id' => 10, 'type' => 'numbered', 'color' => '#3035d6'],
                ['id' => 11, 'type' => 'numbered', 'color' => '#eb4d4d'],
                ['id' => 12, 'type' => 'numbered', 'color' => '#8e44ad'],
                ['id' => 13, 'type' => 'numbered', 'color' => '#f39c12'],
                ['id' => 14, 'type' => 'numbered', 'color' => '#27ae60'],
                ['id' => 15, 'type' => 'numbered', 'color' => '#7f3d3d'],
            ],
            'shootout' => [
                ['id' => 1, 'type' => 'target', 'color' => '#ff0000'],
            ],
            'rolling_score' => [
                ['id' => 1, 'type' => 'numbered', 'color' => '#f9ca24', 'points' => 1],
                ['id' => 2, 'type' => 'numbered', 'color' => '#3035d6', 'points' => 2],
                ['id' => 3, 'type' => 'numbered', 'color' => '#eb4d4d', 'points' => 3],
                ['id' => 4, 'type' => 'numbered', 'color' => '#8e44ad', 'points' => 4],
                ['id' => 5, 'type' => 'numbered', 'color' => '#f39c12', 'points' => 5],
                ['id' => 6, 'type' => 'numbered', 'color' => '#27ae60', 'points' => 6],
                ['id' => 7, 'type' => 'numbered', 'color' => '#7f3d3d', 'points' => 7],
                ['id' => 8, 'type' => 'numbered', 'color' => '#1a1a1a', 'points' => 8],
                ['id' => 9, 'type' => 'numbered', 'color' => '#ffd700', 'points' => 9],
                ['id' => 10, 'type' => 'numbered', 'color' => '#3035d6', 'points' => 10],
                ['id' => 11, 'type' => 'numbered', 'color' => '#eb4d4d', 'points' => 11],
                ['id' => 12, 'type' => 'numbered', 'color' => '#8e44ad', 'points' => 12],
                ['id' => 13, 'type' => 'numbered', 'color' => '#f39c12', 'points' => 13],
                ['id' => 14, 'type' => 'numbered', 'color' => '#27ae60', 'points' => 14],
                ['id' => 15, 'type' => 'numbered', 'color' => '#7f3d3d', 'points' => 15],
            ],
        ];
        
        return $balls[$gameType] ?? [];
    }
}
