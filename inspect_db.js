
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    connectionString: 'postgresql://finance_db_u5rk_user:mrorwFig4OsnXJ3pLzV0vEdpYGHuRVdB@dpg-d5n1a16mcj7s73cct0ig-a.oregon-postgres.render.com/finance_db_u5rk',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000
});

async function inspectSchema() {
    try {
        const client = await pool.connect();
        console.log('Connected. Querying schema for "groups" table...');

        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'groups';
        `);

        console.log('Columns in "groups":');
        console.table(res.rows);

        client.release();
        process.exit(0);
    } catch (err) {
        console.error('Inspection Failed:', err);
        process.exit(1);
    }
}

inspectSchema();
