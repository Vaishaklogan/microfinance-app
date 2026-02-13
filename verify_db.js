
import pg from 'pg';
const { Pool } = pg;

const connectionString = 'postgresql://finance_db_u5rk_user:mrorwFig4OsnXJ3pLzV0vEdpYGHuRVdB@dpg-d5n1a16mcj7s73cct0ig-a.oregon-postgres.render.com/finance_db_u5rk';

console.log('Testing connection to:', connectionString);

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
});

async function testConnection() {
    try {
        const client = await pool.connect();
        console.log('Successfully connected to database!');
        const res = await client.query('SELECT NOW()');
        console.log('Current DB Time:', res.rows[0]);
        client.release();
        process.exit(0);
    } catch (err) {
        console.error('Connection Failed:', err);
        // Log specific details if available
        if (err.code) console.error('Error Code:', err.code);
        if (err.syscall) console.error('Syscall:', err.syscall);
        if (err.address) console.error('Address:', err.address);
        if (err.port) console.error('Port:', err.port);
        process.exit(1);
    }
}

testConnection();
