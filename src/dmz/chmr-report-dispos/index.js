/*  Automatic promoter loop  */
import { createClient } from 'redis';
import axios from 'axios';

const REDIS_URL   = process.env.HOST_REDIS || 'redis://chmr-dmz-redis:6379';
const PROMOTE_URL = process.env.DMZ_DAL_PROMOTE_URL_PREFIX
                 || 'http://chmr-dmz-dal:5000/report/promote/';
const INTERVAL_MS = Number(process.env.DISPOS_INTERVAL_MS) || 30_000;

const redis = createClient({ url: REDIS_URL });
await redis.connect();
console.log('[dispos] loop every', INTERVAL_MS / 1000, 's');

async function promote(obj) {
  try {
    await axios.post(PROMOTE_URL + encodeURIComponent(obj.id), obj, { timeout: 10_000 });
    console.log('[dispos] promoted', obj.id);
  } catch (err) {
    if (err.response?.status === 409) return;        // already done
    console.error('[dispos] failed', obj.id, err.message);
  }
}

async function scan() {
  for (const prefix of ['Civilian Report', 'DoD Report']) {
    let cursor = '0';
    do {
      const { cursor: nextCursor, keys } =
            await redis.scan(cursor, { MATCH: `${prefix}:*`, COUNT: 100 });
      cursor = nextCursor;

      for (const k of keys) {
        const raw = await redis.get(k);
        if (!raw) continue;
        const obj = JSON.parse(raw);
        if (obj.status === 'promotable')
          await promote(obj);
      }
    } while (cursor !== '0');
  }
}

setInterval(scan, INTERVAL_MS);
scan();  // initial run