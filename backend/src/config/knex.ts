import knex, { Knex } from "knex";
import { logger } from "../utils/logger";
import { config } from "./env";
import knexConfig from "./knexfile";

const environment = config.nodeEnv || "development";
const environmentConfig = knexConfig[environment] || knexConfig.development;

export const db: Knex = knex(environmentConfig);

export async function testDbConnection(): Promise<boolean> {
  try {
    await db.raw("SELECT 1");
    logger.info(
      `✅ Database connected successfully (${environmentConfig.client})`,
    );
    return true;
  } catch (error) {
    logger.error("❌ Database connection failed:", error);
    return false;
  }
}

export default db;
