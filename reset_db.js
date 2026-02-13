
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    connectionString: 'postgresql://finance_db_u5rk_user:mrorwFig4OsnXJ3pLzV0vEdpYGHuRVdB@dpg-d5n1a16mcj7s73cct0ig-a.oregon-postgres.render.com/finance_db_u5rk',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000
});

async function resetSchema() {
    try {
        const client = await pool.connect();
        console.log('Resetting schema...');

        // Drop existing tables
        await client.query('DROP TABLE IF EXISTS collections CASCADE');
        await client.query('DROP TABLE IF EXISTS members CASCADE');
        await client.query('DROP TABLE IF EXISTS groups CASCADE');

        console.log('Tables dropped. Recreating...');

        // Recreate Groups
        await client.query(`
            CREATE TABLE groups (
                id VARCHAR(255) PRIMARY KEY,
                group_no VARCHAR(50) UNIQUE NOT NULL,
                group_name VARCHAR(255) NOT NULL,
                group_head_name VARCHAR(255),
                head_contact VARCHAR(50),
                meeting_day VARCHAR(50),
                formation_date VARCHAR(50)
            );
        `);

        // Recreate Members
        await client.query(`
            CREATE TABLE members (
                id VARCHAR(255) PRIMARY KEY,
                member_id VARCHAR(50) UNIQUE NOT NULL,
                member_name VARCHAR(255) NOT NULL,
                address TEXT,
                landmark VARCHAR(255),
                group_no VARCHAR(50) NOT NULL,
                loan_amount DECIMAL(10,2) NOT NULL,
                total_interest DECIMAL(10,2) NOT NULL,
                weeks INTEGER NOT NULL,
                start_date VARCHAR(50),
                status VARCHAR(50) NOT NULL,
                notes TEXT
            );
        `);

        // Recreate Collections
        await client.query(`
            CREATE TABLE collections (
                id VARCHAR(255) PRIMARY KEY,
                collection_date VARCHAR(50) NOT NULL,
                member_id VARCHAR(50) NOT NULL,
                group_no VARCHAR(50) NOT NULL,
                week_no INTEGER NOT NULL,
                amount_paid DECIMAL(10,2) NOT NULL,
                principal_paid DECIMAL(10,2) NOT NULL,
                interest_paid DECIMAL(10,2) NOT NULL,
                status VARCHAR(50) NOT NULL,
                collected_by VARCHAR(255)
            );
        `);

        console.log('Schema reset complete!');
        client.release();
        process.exit(0);
    } catch (err) {
        console.error('Schema Reset Failed:', err);
        process.exit(1);
    }
}

resetSchema();
