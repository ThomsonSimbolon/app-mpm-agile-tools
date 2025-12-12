/**
 * Script to clean up duplicate indexes in database
 * Run this once to fix "Too many keys specified" error
 */

const mysql = require("mysql2/promise");
require("dotenv").config();

async function cleanDuplicateIndexes() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "mpm_agile_tools",
  });

  console.log("🔍 Connected to database. Checking for duplicate indexes...\n");

  try {
    // Get all tables
    const [tables] = await connection.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'`,
      [process.env.DB_NAME || "mpm_agile_tools"]
    );

    for (const table of tables) {
      const tableName = table.TABLE_NAME;

      // Get all indexes for this table
      const [indexes] = await connection.query(
        `SHOW INDEX FROM \`${tableName}\``
      );

      // Group by column name to find duplicates
      const columnIndexMap = {};
      for (const idx of indexes) {
        if (idx.Key_name === "PRIMARY") continue; // Skip primary key

        const key = `${idx.Column_name}`;
        if (!columnIndexMap[key]) {
          columnIndexMap[key] = [];
        }
        columnIndexMap[key].push(idx.Key_name);
      }

      // Find and remove duplicate indexes (keep only first one)
      for (const [column, indexNames] of Object.entries(columnIndexMap)) {
        if (indexNames.length > 1) {
          console.log(`📋 Table: ${tableName}, Column: ${column}`);
          console.log(
            `   Found ${indexNames.length} indexes: ${indexNames.join(", ")}`
          );

          // Keep the first index, drop the rest
          for (let i = 1; i < indexNames.length; i++) {
            try {
              console.log(`   🗑️  Dropping duplicate index: ${indexNames[i]}`);
              await connection.query(
                `ALTER TABLE \`${tableName}\` DROP INDEX \`${indexNames[i]}\``
              );
              console.log(`   ✅ Dropped: ${indexNames[i]}`);
            } catch (err) {
              if (err.code === "ER_CANT_DROP_FIELD_OR_KEY") {
                console.log(
                  `   ⚠️  Index ${indexNames[i]} already dropped or doesn't exist`
                );
              } else {
                console.log(
                  `   ❌ Error dropping ${indexNames[i]}: ${err.message}`
                );
              }
            }
          }
          console.log("");
        }
      }

      // Show remaining index count
      const [remainingIndexes] = await connection.query(
        `SHOW INDEX FROM \`${tableName}\``
      );
      const uniqueIndexNames = [
        ...new Set(remainingIndexes.map((i) => i.Key_name)),
      ];
      console.log(
        `✓ ${tableName}: ${uniqueIndexNames.length} indexes remaining`
      );
    }

    console.log("\n✅ Index cleanup completed!");
    console.log("\n📌 Next steps:");
    console.log("   1. Set DB_AUTO_SYNC=true in .env");
    console.log("   2. Run: npm run dev");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await connection.end();
  }
}

cleanDuplicateIndexes();
