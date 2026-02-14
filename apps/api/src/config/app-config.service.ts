import { AdminConfig, AdminConfigSchema, DEFAULT_ADMIN_CONFIG } from '../domain/config.schema';
import { env } from './env';

export class AppConfigService {
    private static instance: AppConfigService;
    private config: AdminConfig;

    private constructor() {
        this.config = {
            ...DEFAULT_ADMIN_CONFIG,
            timeoutsMs: {
                ...DEFAULT_ADMIN_CONFIG.timeoutsMs,
                stage1: env.STAGE1_TIMEOUT_MS,
                stage2: env.STAGE2_TIMEOUT_MS,
                total: env.TOTAL_TIMEOUT_MS,
            }
        };
    }

    public static getInstance(): AppConfigService {
        if (!AppConfigService.instance) {
            AppConfigService.instance = new AppConfigService();
        }
        return AppConfigService.instance;
    }

    public getConfig(): AdminConfig {
        return { ...this.config };
    }

    public updateConfig(partialConfig: Partial<AdminConfig>): AdminConfig {
        // Validate partial update
        const currentConfig = this.getConfig();
        const merged = { ...currentConfig, ...partialConfig };

        // Zod validation ensures bounds and types
        this.config = AdminConfigSchema.parse(merged);

        return this.getConfig();
    }

    public resetToDefaults(): AdminConfig {
        this.config = { ...DEFAULT_ADMIN_CONFIG };
        return this.getConfig();
    }
}

// Export a convenience instance
export const appConfigService = AppConfigService.getInstance();
