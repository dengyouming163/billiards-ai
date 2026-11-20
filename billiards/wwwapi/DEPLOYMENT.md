# 部署说明文档

## 项目信息
- 项目名称：台球房管理系统
- 框架：ThinkPHP 8
- 日期：2026-05-15

## 数据库迁移步骤

### 1. 检查数据库连接
确保 `.env` 文件中的数据库配置正确：
```
DATABASE_HOSTNAME=localhost
DATABASE_DATABASE=your_database
DATABASE_USERNAME=your_username
DATABASE_PASSWORD=your_password
```

### 2. 执行数据库迁移
有两种方式可以执行数据填充：

#### 方式一：使用PHP脚本（推荐）
```bash
# 进入项目目录
cd d:\wwwroot\wwwbilliards\www\wwwapi

# 执行PHP数据填充脚本
php seed_game_configs.php
```

#### 方式二：使用SQL文件
```bash
# 进入项目目录
cd d:\wwwroot\wwwbilliards\www\wwwapi

# 执行游戏配置初始化脚本
mysql -u your_username -p your_database < database/migrations/2026_05_15_init_game_configs.sql
```

或者通过数据库管理工具（如 Navicat、phpMyAdmin）直接导入 SQL 文件。

## 数据填充步骤

### 1. 游戏配置数据
文件位置：`database/migrations/2026_05_15_init_game_configs.sql`

该脚本会初始化以下10种玩法配置：

| ID | 玩法代码 | 玩法名称 | 球数 | 说明 |
|----|----------|----------|------|------|
| gc_001 | eight_ball | 中式八球 | 16 | 中国最流行的台球玩法 |
| gc_002 | nine_ball | 美式九球 | 9 | 必须先碰最小号码球 |
| gc_003 | snooker | 斯诺克 | 22 | 红球+彩球循环计分 |
| gc_004 | carom | 开仑台球 | 3 | 无袋台球，一杆碰两球 |
| gc_005 | straight_pool | 14-1直池 | 15 | 经典玩法，每球1分 |
| gc_006 | ten_ball | 美式10球 | 10 | 指球定袋 |
| gc_007 | chasing | 追分 | 9 | 多人趣味玩法 |
| gc_008 | draw_lots | 摸牌/挂杆 | 15 | 完成手牌即获胜 |
| gc_009 | shootout | 打枪 | 1 | 点球大战 |
| gc_010 | rolling_score | 摇分 | 15 | 进球号码即分数 |

## 功能验证清单

### 数据库验证
- [ ] 确认 `bi_game_config` 表存在
- [ ] 确认表中有10条游戏配置记录
- [ ] 确认所有记录的 `status` 为 1（启用状态）
- [ ] 确认记录按 `sort_order` 正确排序

### 接口验证
- [ ] 验证获取游戏配置列表接口正常工作
- [ ] 验证通过 code 获取单个游戏配置接口正常

### 前端验证
- [ ] 验证游戏玩法选择功能正常
- [ ] 验证游戏配置显示正确

## 注意事项

1. **备份数据**：执行迁移前请先备份数据库
2. **表前缀**：确保表前缀配置为 `bi_`（在 `config/database.php` 中配置）
3. **字符集**：确保数据库使用 `utf8mb4` 字符集
4. **时间戳**：迁移脚本会自动设置 `created_at` 和 `updated_at` 字段

## 回滚操作

如需回滚游戏配置数据，可以执行以下SQL：

```sql
DELETE FROM `bi_game_config` WHERE `id` LIKE 'gc_%';
```

## 相关文件

- 游戏配置模型：`app/common/model/storeapi/GameConfig.php`
- PHP数据填充脚本：`seed_game_configs.php`
- SQL迁移文件：`database/migrations/2026_05_15_init_game_configs.sql`
