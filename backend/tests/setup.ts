import db from '../src/config/knex';

beforeAll(async () => {
  // Run migrations and seeds on the test database
  await db.migrate.latest({
    directory: './database/migrations',
  });
  await db.seed.run({
    directory: './database/seeds',
  });
});

afterAll(async () => {
  await db.destroy();
});
