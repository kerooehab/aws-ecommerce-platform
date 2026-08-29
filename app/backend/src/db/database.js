const { Pool } = require("pg");
const fs = require("fs");
const getDatabaseSecret = require("../config/secrets");

let pool;

async function initializeDatabase() {
    const secret = await getDatabaseSecret();

    pool = new Pool({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME || "postgres",
        user: secret.username,
        password: secret.password,
        ssl: {
            ca: fs.readFileSync("/tmp/global-bundle.pem").toString(),
            rejectUnauthorized: true
        }
    });

    await pool.query("SELECT 1");

    console.log("Connected to RDS PostgreSQL");
}

async function query(text, params) {
    if (!pool) {
        throw new Error("Database pool has not been initialized");
    }

    return pool.query(text, params);
}

module.exports = {
    initializeDatabase,
    query
};
