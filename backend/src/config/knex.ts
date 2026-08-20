import knex, { Knex } from 'knex';
import knexConfig from './knexfile';
import { config } from './env';
import { logger } from '../utils/logger';

const environment = config.nodeEnv || 'development';
const environmentConfig = knexConfig[environment] || knexConfig.development;

export const db: Knex = knex(environmentConfig);

export async function testDbConnection(): Promise<boolean> {
  try {
    await db.raw('SELECT 1');
    logger.info(`✅ Database connected successfully (${environmentConfig.client})`);
    return true;
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    return false;
  }
}

export default db;
