
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    connectionString: 'postgresql://finance_db_u5rk_user:mrorwFig4OsnXJ3pLzV0vEdpYGHuRVdB@dpg-d5n1a16mcj7s73cct0ig-a.oregon-postgres.render.com/finance_db_u5rk',
    ssl: { rejectUnauthorized: false }
});

async function testConnection() {
    try {
        console.log('Testing connection...');
        const client = await pool.connect();
        console.log('Connected!');
        const res = await client.query('SELECT NOW()');
        console.log('Current DB Time:', res.rows[0]);
        client.release();
        await pool.end();
        console.log('Connection closed.');
    } catch (err) {
        console.error('Connection failed:', err);
    }
}

testConnection();
