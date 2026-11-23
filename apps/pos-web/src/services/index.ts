export type { AppService, InitialData } from './types';
import { apiAppService } from './api-service';
export { apiAppService };
export const appService = apiAppService;
