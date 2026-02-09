const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection using Render's DATABASE_URL or your provided credentials
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://finance_db_u5rk_user:mrorwFig4OsnXJ3pLzV0vEdpYGHuRVdB@dpg-d5n1a16mcj7s73cct0ig-a.oregon-postgres.render.com/finance_db_u5rk',
    ssl: { rejectUnauthorized: false }
});

// Initialize database tables
async function initDatabase() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS groups (
                id VARCHAR(255) PRIMARY KEY,
                group_no VARCHAR(50) UNIQUE NOT NULL,
                group_name VARCHAR(255) NOT NULL,
                group_head_name VARCHAR(255),
                head_contact VARCHAR(50),
                meeting_day VARCHAR(50),
                formation_date VARCHAR(50)
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS members (
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
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS collections (
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
            )
        `);

        console.log('✅ Database tables initialized');
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

// Helper to convert snake_case to camelCase
function toCamelCase(row) {
    if (!row) return null;
    const result = {};
    for (const key in row) {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        result[camelKey] = row[key];
    }
    return result;
}

// ============== GROUPS API ==============

app.get('/api/groups', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM groups ORDER BY group_no');
        res.json(result.rows.map(toCamelCase));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/groups/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM groups WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Group not found' });
        }
        res.json(toCamelCase(result.rows[0]));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/groups', async (req, res) => {
    try {
        const { groupNo, groupName, groupHeadName, headContact, meetingDay, formationDate } = req.body;
        const id = uuidv4();
        await pool.query(
            'INSERT INTO groups (id, group_no, group_name, group_head_name, head_contact, meeting_day, formation_date) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [id, groupNo, groupName, groupHeadName, headContact, meetingDay, formationDate]
        );
        res.status(201).json({ id, groupNo, groupName, groupHeadName, headContact, meetingDay, formationDate });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/groups/:id', async (req, res) => {
    try {
        const { groupNo, groupName, groupHeadName, headContact, meetingDay, formationDate } = req.body;
        await pool.query(
            'UPDATE groups SET group_no = $1, group_name = $2, group_head_name = $3, head_contact = $4, meeting_day = $5, formation_date = $6 WHERE id = $7',
            [groupNo, groupName, groupHeadName, headContact, meetingDay, formationDate, req.params.id]
        );
        res.json({ id: req.params.id, groupNo, groupName, groupHeadName, headContact, meetingDay, formationDate });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/groups/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM groups WHERE id = $1', [req.params.id]);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============== MEMBERS API ==============

app.get('/api/members', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM members ORDER BY member_id');
        res.json(result.rows.map(toCamelCase));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/members/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM members WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Member not found' });
        }
        res.json(toCamelCase(result.rows[0]));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/members/group/:groupNo', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM members WHERE group_no = $1', [req.params.groupNo]);
        res.json(result.rows.map(toCamelCase));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/members', async (req, res) => {
    try {
        const { memberId, memberName, address, landmark, groupNo, loanAmount, totalInterest, weeks, startDate, status, notes } = req.body;
        const id = uuidv4();
        await pool.query(
            'INSERT INTO members (id, member_id, member_name, address, landmark, group_no, loan_amount, total_interest, weeks, start_date, status, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
            [id, memberId, memberName, address, landmark, groupNo, loanAmount, totalInterest, weeks, startDate, status, notes]
        );
        res.status(201).json({ id, memberId, memberName, address, landmark, groupNo, loanAmount, totalInterest, weeks, startDate, status, notes });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/members/:id', async (req, res) => {
    try {
        const { memberId, memberName, address, landmark, groupNo, loanAmount, totalInterest, weeks, startDate, status, notes } = req.body;
        await pool.query(
            'UPDATE members SET member_id = $1, member_name = $2, address = $3, landmark = $4, group_no = $5, loan_amount = $6, total_interest = $7, weeks = $8, start_date = $9, status = $10, notes = $11 WHERE id = $12',
            [memberId, memberName, address, landmark, groupNo, loanAmount, totalInterest, weeks, startDate, status, notes, req.params.id]
        );
        res.json({ id: req.params.id, memberId, memberName, address, landmark, groupNo, loanAmount, totalInterest, weeks, startDate, status, notes });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/members/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM members WHERE id = $1', [req.params.id]);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============== COLLECTIONS API ==============

app.get('/api/collections', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM collections ORDER BY week_no, collection_date');
        res.json(result.rows.map(toCamelCase));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/collections/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM collections WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Collection not found' });
        }
        res.json(toCamelCase(result.rows[0]));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/collections/member/:memberId', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM collections WHERE member_id = $1', [req.params.memberId]);
        res.json(result.rows.map(toCamelCase));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/collections/week/:weekNo', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM collections WHERE week_no = $1', [parseInt(req.params.weekNo)]);
        res.json(result.rows.map(toCamelCase));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/collections', async (req, res) => {
    try {
        const { collectionDate, memberId, groupNo, weekNo, amountPaid, status, collectedBy } = req.body;
        let { principalPaid, interestPaid } = req.body;

        // Auto-calculate principal/interest if not provided
        if (principalPaid === undefined || interestPaid === undefined) {
            const memberResult = await pool.query('SELECT loan_amount, total_interest FROM members WHERE member_id = $1', [memberId]);
            if (memberResult.rows.length > 0) {
                const member = memberResult.rows[0];
                const totalPayable = parseFloat(member.loan_amount) + parseFloat(member.total_interest);
                const principalRatio = parseFloat(member.loan_amount) / totalPayable;
                const interestRatio = parseFloat(member.total_interest) / totalPayable;
                principalPaid = Math.round(amountPaid * principalRatio * 100) / 100;
                interestPaid = Math.round(amountPaid * interestRatio * 100) / 100;
            }
        }

        const id = uuidv4();
        await pool.query(
            'INSERT INTO collections (id, collection_date, member_id, group_no, week_no, amount_paid, principal_paid, interest_paid, status, collected_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
            [id, collectionDate, memberId, groupNo, weekNo, amountPaid, principalPaid, interestPaid, status, collectedBy]
        );
        res.status(201).json({ id, collectionDate, memberId, groupNo, weekNo, amountPaid, principalPaid, interestPaid, status, collectedBy });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/collections/:id', async (req, res) => {
    try {
        const { collectionDate, memberId, groupNo, weekNo, amountPaid, principalPaid, interestPaid, status, collectedBy } = req.body;
        await pool.query(
            'UPDATE collections SET collection_date = $1, member_id = $2, group_no = $3, week_no = $4, amount_paid = $5, principal_paid = $6, interest_paid = $7, status = $8, collected_by = $9 WHERE id = $10',
            [collectionDate, memberId, groupNo, weekNo, amountPaid, principalPaid, interestPaid, status, collectedBy, req.params.id]
        );
        res.json({ id: req.params.id, collectionDate, memberId, groupNo, weekNo, amountPaid, principalPaid, interestPaid, status, collectedBy });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/collections/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM collections WHERE id = $1', [req.params.id]);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============== UTILITY API ==============

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/data', async (req, res) => {
    try {
        const [groups, members, collections] = await Promise.all([
            pool.query('SELECT * FROM groups'),
            pool.query('SELECT * FROM members'),
            pool.query('SELECT * FROM collections')
        ]);
        res.json({
            groups: groups.rows.map(toCamelCase),
            members: members.rows.map(toCamelCase),
            collections: collections.rows.map(toCamelCase)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/data/clear', async (req, res) => {
    try {
        await pool.query('DELETE FROM collections');
        await pool.query('DELETE FROM members');
        await pool.query('DELETE FROM groups');
        res.json({ message: 'All data cleared' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'Microfinance API Server',
        endpoints: ['/api/groups', '/api/members', '/api/collections', '/api/health']
    });
});

// Initialize database and start server
initDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Microfinance Backend running on port ${PORT}`);
    });
});
