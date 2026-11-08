import fs from "fs";
import path from "path";
import pg from "pg";

const { Client } = pg;

async function run() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL is not set. Cannot apply migrations directly.");
    process.exit(1);
  }

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log("Connected to PostgreSQL database.");

  // Ensure .backup/ directory exists
  const backupDir = path.resolve(process.cwd(), ".backup");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Backup tables if they exist
  const tablesToBackup = ["resources", "contributions", "users"];
  for (const tbl of tablesToBackup) {
    try {
      const res = await client.query(`SELECT * FROM public."${tbl}"`);
      const backupPath = path.join(backupDir, `${tbl}_${Date.now()}.json`);
      fs.writeFileSync(backupPath, JSON.stringify(res.rows, null, 2));
      console.log(`Backed up ${res.rowCount} rows from ${tbl} to ${backupPath}`);
    } catch (e) {
      console.log(`Table ${tbl} not backed up: ${e.message}`);
    }
  }

  // Migrations to apply
  const migrationFiles = [
    "001_security.sql",
    "002_drop_assignments.sql",
    "003_guard_sql_editor.sql",
    "004_drop_legacy_storage.sql",
    "005_files.sql",
    "006_upload_tickets.sql",
  ];

  const migrationsDir = path.resolve(process.cwd(), "supabase", "migrations");

  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    if (!fs.existsSync(filePath)) {
      console.log(`Skipping ${file} (does not exist yet)`);
      continue;
    }
    console.log(`Applying ${file}...`);
    const sql = fs.readFileSync(filePath, "utf-8");
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("COMMIT");
      console.log(`Applied ${file} successfully.`);
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(`Failed to apply ${file}:`, err.message);
      process.exit(1);
    }
  }

  await client.end();
  console.log("All migrations completed successfully.");
}

run().catch((err) => {
  console.error("Migration runner error:", err);
  process.exit(1);
});

