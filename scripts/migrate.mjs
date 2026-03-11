/**
 * Lightweight database migration runner for Docker entrypoint.
 * Uses only the `postgres` package (available in standalone bundle).
 * Reads Drizzle migration journal and applies pending SQL migrations.
 */
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import postgres from 'postgres';

const MIGRATIONS_DIR = process.env.MIGRATIONS_DIR || './migrations';

async function migrate() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not set, skipping migrations');
    process.exit(1);
  }

  const sql = postgres(url, { max: 1 });

  try {
    // Ensure migrations tracking table exists
    await sql`
      CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
        id SERIAL PRIMARY KEY,
        hash TEXT NOT NULL,
        created_at BIGINT
      )
    `;

    // Read journal
    const journalPath = join(MIGRATIONS_DIR, 'meta', '_journal.json');
    const journal = JSON.parse(readFileSync(journalPath, 'utf-8'));

    // Get already-applied migration hashes
    const applied = await sql`SELECT hash FROM "__drizzle_migrations"`;
    const appliedHashes = new Set(applied.map((r) => r.hash));

    let count = 0;
    for (const entry of journal.entries) {
      const tag = entry.tag;
      if (appliedHashes.has(tag)) continue;

      const filePath = join(MIGRATIONS_DIR, `${tag}.sql`);
      const sqlContent = readFileSync(filePath, 'utf-8');

      console.log(`  Applying migration: ${tag}`);
      await sql.unsafe(sqlContent);
      await sql`INSERT INTO "__drizzle_migrations" (hash, created_at) VALUES (${tag}, ${Date.now()})`;
      count++;
    }

    if (count === 0) {
      console.log('  No pending migrations');
    } else {
      console.log(`  Applied ${count} migration(s)`);
    }
  } finally {
    await sql.end();
  }
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
