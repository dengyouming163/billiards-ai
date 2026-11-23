/**
 * API 迁移指南
 * 
 * 本项目已改造为前后端分离架构，支持无缝迁移到真实后端 API
 */

// ============== 迁移步骤 ==============

/**
 * 1. 配置文件
 * 
 * 设置环境变量：
 * - 开发环境: .env.local
 *   NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
 * 
 * - 生产环境: .env.production.local
 *   NEXT_PUBLIC_API_BASE_URL=https://your-api-domain.com/api
 */

// ============== 使用示例 ==============

/**
 * 2. 组件中使用 API
 * 
 * 方式一：使用 useApiData Hook（推荐）
 */

// import { useApiData } from '@/lib/hooks/use-api-data';
// import { tablesApi } from '@/lib/api';

// function TablesPage() {
//   const { data: tables, loading, error, refetch } = useApiData(
//     () => tablesApi.fetchTables({ storeId: 'store_1' }),
//     []
//   );
// 
//   if (loading) return <div>加载中...</div>;
//   if (error) return <div>错误: {error.message}</div>;
// 
//   return <div>{/* 渲染表格 */}</div>;
// }

/**
 * 方式二：直接使用 API 函数
 */

// import { tablesApi } from '@/lib/api';

// async function handleCreateTable() {
//   try {
//     const newTable = await tablesApi.createTable({
//       number: 'A01',
//       type: 'standard',
//       zoneId: 'zone_1',
//       storeId: 'store_1',
//     });
//     console.log('创建成功:', newTable);
//   } catch (error) {
//     console.error('创建失败:', error.message);
//   }
// }

/**
 * 方式三：使用 DataStore（当前模式，已内置 API 切换开关）
 * 
 * 只需将 USE_API_MODE 改为 true，即可切换到 API 模式
 * DataStore 会自动调用对应的 API 服务
 */

// ============== API 端点 ==============

/**
 * 完整 API 端点列表，请查看：
 * src/lib/api/config.ts
 */

// ============== Mock 数据说明 ==============

/**
 * 当前使用 localStorage 存储数据
 * 切换到 API 模式后，数据将保存在后端数据库
 * 
 * 切换前请确保：
 * 1. 后端 API 服务已启动
 * 2. API 端点已正确配置
 * 3. 数据格式与 API 响应格式一致
 */

// ============== 错误处理 ==============

/**
 * 所有 API 请求统一使用 ApiException 处理错误
 * 
 * try {
 *   await tablesApi.createTable(data);
 * } catch (error) {
 *   if (error instanceof ApiException) {
 *     console.error(`错误码: ${error.code}, 消息: ${error.message}`);
 *   }
 * }
 */

// ============== 认证 ==============

/**
 * API 客户端自动处理 JWT Token
 * 
 * 登录后保存 token：
 * localStorage.setItem('token', 'your-jwt-token');
 * 
 * 登出时清除：
 * localStorage.removeItem('token');
 */

// ============== 文件上传 ==============

/**
 * 使用 upload 函数上传文件
 * 
 * import { upload } from '@/lib/api/client';
 * 
 * const formData = new FormData();
 * formData.append('file', fileInput.files[0]);
 * 
 * await upload('/upload', formData);
 */

// ============== 文件下载 ==============

/**
 * 使用 download 函数下载文件
 * 
 * import { download } from '@/lib/api/client';
 * 
 * await download('/export/excel', { date: '2024-01' }, 'report.xlsx');
 */
