// ============================================================
// 服务层入口 - 商业台球系统
// ============================================================
// 使用方式：
//   import { appService } from '@/services';
//   const data = await appService.loadInitialData();
//
// 切换实现：
//   修改下方的 appService 导出即可切换本地/远程后端
// ============================================================

export type { AppService, InitialData } from './types';
export { localAppService } from './local-service';
export { apiAppService } from './api-service';

// ============================================================
// 当前使用的服务实现
// ============================================================
// 开发阶段使用 localAppService（纯前端静态数据）
// 后端 API 就绪后切换为 apiAppService（调用远程 API）
// 也可以通过环境变量动态切换

import { localAppService } from './local-service';
import type { AppService } from './types';

// 根据 NEXT_PUBLIC_SERVICE_MODE 环境变量切换服务实现
// 'local' (默认) - 本地静态数据
// 'api' - 远程 API
const serviceMode = process.env.NEXT_PUBLIC_SERVICE_MODE || 'local';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _service: AppService = localAppService as any;

if (serviceMode === 'api') {
  // 动态导入避免在本地模式下加载 API 相关代码
  import('./api-service').then(({ apiAppService }) => {
    _service = apiAppService;
  });
}

export const appService: AppService = _service;
