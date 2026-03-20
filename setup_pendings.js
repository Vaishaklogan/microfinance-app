import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    connectionString: 'postgresql://postgres:Anyachan357%40@db.goxfwpqgqvcriwdsthsz.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000
});

async function setup() {
    const client = await pool.connect();
    console.log('✅ Connected to Supabase PostgreSQL');

    try {
        console.log('\n📦 Step 1: Creating pendings table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS public.pendings (
                id TEXT PRIMARY KEY,
                member_id TEXT NOT NULL,
                group_no TEXT NOT NULL,
                week_no INTEGER NOT NULL,
                amount DECIMAL(10,2) NOT NULL DEFAULT 0,
                status TEXT NOT NULL DEFAULT 'Ongoing',
                created_at TEXT NOT NULL,
                cleared_at TEXT
            );
        `);
        console.log('   ✅ pendings table created');

        console.log('\n🔒 Step 2: Setting up RLS policies...');
        await client.query(`ALTER TABLE public.pendings ENABLE ROW LEVEL SECURITY;`);

        await client.query(`DROP POLICY IF EXISTS "Allow all select on pendings" ON public.pendings;`);
        await client.query(`DROP POLICY IF EXISTS "Allow all insert on pendings" ON public.pendings;`);
        await client.query(`DROP POLICY IF EXISTS "Allow all update on pendings" ON public.pendings;`);
        await client.query(`DROP POLICY IF EXISTS "Allow all delete on pendings" ON public.pendings;`);

        await client.query(`CREATE POLICY "Allow all select on pendings" ON public.pendings FOR SELECT USING (true);`);
        await client.query(`CREATE POLICY "Allow all insert on pendings" ON public.pendings FOR INSERT WITH CHECK (true);`);
        await client.query(`CREATE POLICY "Allow all update on pendings" ON public.pendings FOR UPDATE USING (true) WITH CHECK (true);`);
        await client.query(`CREATE POLICY "Allow all delete on pendings" ON public.pendings FOR DELETE USING (true);`);
        console.log('   ✅ RLS enabled on pendings table');

        console.log('\n⚡ Step 3: Creating indexes...');
        await client.query(`CREATE INDEX IF NOT EXISTS idx_pendings_member_id ON public.pendings(member_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_pendings_status ON public.pendings(status);`);

        console.log('\n🔑 Step 4: Granting permissions...');
        await client.query(`GRANT ALL ON public.pendings TO anon, authenticated;`);
        console.log('   ✅ permissions granted');

        // We also need to update the clear_all_data RPC and get_all_data to include pendings
        console.log('\n🔧 Step 5: Updating RPC functions...');

        await client.query(`
            CREATE OR REPLACE FUNCTION public.get_all_data()
            RETURNS JSON
            LANGUAGE plpgsql
            SECURITY DEFINER
            AS $$
            DECLARE
                result JSON;
            BEGIN
                SELECT json_build_object(
                    'groups', COALESCE((SELECT json_agg(row_to_json(g)) FROM public.groups g), '[]'::JSON),
                    'members', COALESCE((SELECT json_agg(row_to_json(m)) FROM public.members m), '[]'::JSON),
                    'collections', COALESCE((SELECT json_agg(row_to_json(c)) FROM public.collections c), '[]'::JSON),
                    'pendings', COALESCE((SELECT json_agg(row_to_json(p)) FROM public.pendings p), '[]'::JSON)
                ) INTO result;
                RETURN result;
            END;
            $$;
        `);

        await client.query(`
            CREATE OR REPLACE FUNCTION public.clear_all_data()
            RETURNS JSON
            LANGUAGE plpgsql
            SECURITY DEFINER
            AS $$
            BEGIN
                DELETE FROM public.collections;
                DELETE FROM public.members;
                DELETE FROM public.groups;
                DELETE FROM public.pendings;
                RETURN json_build_object('message', 'All data cleared including pendings');
            END;
            $$;
        `);

        // Create a new bulk function to save pendings
        await client.query(`
            CREATE OR REPLACE FUNCTION public.bulk_upsert_pendings(new_pendings JSON)
            RETURNS JSON
            LANGUAGE plpgsql
            SECURITY DEFINER
            AS $$
            DECLARE
                p JSON;
                result_count INTEGER := 0;
            BEGIN
                FOR p IN SELECT * FROM json_array_elements(new_pendings)
                LOOP
                    -- Upsert logic: if match id, update, else insert
                    INSERT INTO public.pendings (id, member_id, group_no, week_no, amount, status, created_at, cleared_at)
                    VALUES (
                        (p->>'id')::TEXT,
                        (p->>'memberId')::TEXT,
                        (p->>'groupNo')::TEXT,
                        (p->>'weekNo')::INTEGER,
                        (p->>'amount')::DECIMAL,
                        COALESCE((p->>'status')::TEXT, 'Ongoing'),
                        COALESCE((p->>'createdAt')::TEXT, to_char(CURRENT_DATE, 'YYYY-MM-DD')),
                        (p->>'clearedAt')::TEXT
                    )
                    ON CONFLICT (id) DO UPDATE SET
                        amount = EXCLUDED.amount,
                        status = EXCLUDED.status,
                        cleared_at = EXCLUDED.cleared_at;
                    result_count := result_count + 1;
                END LOOP;
                RETURN json_build_object('message', 'Bulk pendings updated', 'count', result_count);
            END;
            $$;
        `);

        console.log('   ✅ RPC functions updated');

        console.log('\n🎉🎉🎉 Setup complete for pendings! 🎉🎉🎉');

    } catch (err) {
        console.error('❌ Setup failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

setup();
