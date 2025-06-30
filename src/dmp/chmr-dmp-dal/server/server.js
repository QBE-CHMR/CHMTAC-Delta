/*  ES-module version  */
import express  from 'express';
import { Pool } from 'pg';

const app  = express();
const port = process.env.PORT_DMP_DAL || 5000;

/* ---------- Postgres pool ---------- */
const pool = new Pool({
  host    : process.env.HOST_POSTGRES,
  user    : process.env.PGUSER     || 'postgres',
  password: process.env.PGPASSWORD || undefined,
  database: process.env.PGDATABASE || 'chmr_dmp',
  max     : 10
});

app.use(express.json({ limit:'5mb' }));

function toArgs(j) {
  const files = (j.filereferences || [])
                .map(f => f.originalName ?? f.filename);
  return [
    j.id, j.full_name, j.given_name, j.surname,
    j.assigned_unit, j.reporting_unit, j.dod_id,
    j.duty_title, j.duty_type, j.rank,
    j.phone_commercial, j.dsn_phone, j.email,
    j.combatant_command, j.other_command,
    j.start_datetime, j.end_datetime, j.time_zone,
    j.location, j.total_harm, j.us_harm,
    j.contactType === 'CIVILIAN' ? 0 : 1,
    j.confidence_level, j.poc1_name, j.poc1_info,
    j.poc2_name, j.poc2_info, files,
    j.information_url || ''
  ];
}

app.post('/ingest', async (req, res) => {
  const args = toArgs(req.body);
  const ph   = args.map((_, i) => `$${i+1}`).join(',');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`CALL ingest_intake(${ph})`, args);
    await client.query('COMMIT');
    res.status(201).json({ status:'ok', id:req.body.id });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[ingest] failed:', e.message);
    res.status(500).json({ error:'InternalServerError' });
  } finally { client.release(); }
});

app.listen(port, () => console.log(`chmr-dmp-dal listening on ${port}`));
