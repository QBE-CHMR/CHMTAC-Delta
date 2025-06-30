import { Router }  from 'express';
import axios       from 'axios';
import redisClient from '../redisClient.js';
import { STATUS_ENUM } from '../../common/constants/statusEnum.js';

const router = Router();
const TARGET = process.env.DMP_DAL_URL || 'http://chmr-dmp-dal:5000/ingest';
const ALLOW  = (process.env.CHIR_INTK_TYPE || 'BOTH').toUpperCase();

/* locate the Redis key for a UUID */
async function keyFor(id) {
  for (const p of ['Civilian Report', 'DoD Report'])
    if (await redisClient.exists(`${p}:${id}`))
      return `${p}:${id}`;
  return null;
}

router.post('/:id', async (req, res) => {
  try {
    const key = await keyFor(req.params.id);
    if (!key) return res.status(404).json({ error: 'Report not found' });

    const report = JSON.parse(await redisClient.get(key));

    if (ALLOW !== 'BOTH' && report.contactType !== ALLOW)
      return res.status(412).json({ error:`contactType ${report.contactType} not allowed` });

    /* -------- atomic hand-off -------- */
    await axios.post(TARGET, report, { timeout: 10_000 });

    report.status = STATUS_ENUM.PROMOTED;
    await redisClient.set(key, JSON.stringify(report));

    res.status(201).json({ message:'Promoted', id:report.id });
  } catch (err) {
    console.error('[promote] failed:', err.message);
    res.status(502).json({ error:'Promotion failed', detail:err.message });
  }
});

export default router;