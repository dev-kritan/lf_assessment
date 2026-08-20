import type { Knex } from 'knex';
import path from 'path';
import { config } from './env';

const migrationsPath = path.resolve(__dirname, '../../database/migrations');
const seedsPath = path.resolve(__dirname, '../../database/seeds');

const knexConfig: { [key: string]: Knex.Config } = {
  development: {
    client: config.db.client,
    connection: config.db.client === 'better-sqlite3' 
      ? { filename: config.db.filename }
      : {
          host: config.db.host,
          port: config.db.port,
          user: config.db.user,
          password: config.db.password,
          database: config.db.database,
          charset: 'utf8mb4',
        },
    useNullAsDefault: config.db.client === 'better-sqlite3',
    pool: config.db.client === 'better-sqlite3' ? { min: 1, max: 1 } : { min: 2, max: 10 },
    migrations: {
      directory: migrationsPath,
      extension: 'ts',
    },
    seeds: {
      directory: seedsPath,
      extension: 'ts',
    },
  },

  test: {
    client: 'better-sqlite3',
    connection: {
      filename: ':memory:',
    },
    useNullAsDefault: true,
    pool: { min: 1, max: 1 },
    migrations: {
      directory: migrationsPath,
      extension: 'ts',
    },
    seeds: {
      directory: seedsPath,
      extension: 'ts',
    },
  },

  production: {
    client: 'mysql2',
    connection: {
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      charset: 'utf8mb4',
    },
    pool: { min: 2, max: 20 },
    migrations: {
      directory: migrationsPath,
      extension: 'ts',
    },
    seeds: {
      directory: seedsPath,
      extension: 'ts',
    },
  },
};

export default knexConfig;
