interface Env {
  JOURNAL_KV: KVNamespace;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function getUserId(request: Request): string | null {
  return request.headers.get('X-User-Id');
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const userId = getUserId(request);
    if (!userId || userId.length !== 64) {
      return json({ error: 'Missing or invalid X-User-Id' }, 401);
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // GET /manifest — return { dates: { "YYYY-MM-DD": updatedAt, ... } }
    if (path === '/manifest' && request.method === 'GET') {
      const manifest = await env.JOURNAL_KV.get(`${userId}:_manifest`, 'json') as Record<string, number> | null;
      return json({ dates: manifest || {} });
    }

    // GET /entries?since=timestamp — return entries updated since timestamp
    if (path === '/entries' && request.method === 'GET') {
      const since = parseInt(url.searchParams.get('since') || '0');
      const manifest = await env.JOURNAL_KV.get(`${userId}:_manifest`, 'json') as Record<string, number> | null;
      if (!manifest) return json({ entries: {} });

      const entries: Record<string, { blob: string; updatedAt: number }> = {};
      const datesToFetch = Object.entries(manifest).filter(([, ts]) => ts > since);

      await Promise.all(
        datesToFetch.map(async ([date, updatedAt]) => {
          const blob = await env.JOURNAL_KV.get(`${userId}:${date}`);
          if (blob) entries[date] = { blob, updatedAt };
        })
      );

      return json({ entries });
    }

    // PUT /entries — { entries: { "YYYY-MM-DD": { blob, updatedAt } } }
    if (path === '/entries' && request.method === 'PUT') {
      const body = await request.json() as {
        entries: Record<string, { blob: string; updatedAt: number }>;
      };

      const manifest = (await env.JOURNAL_KV.get(`${userId}:_manifest`, 'json') as Record<string, number>) || {};

      await Promise.all(
        Object.entries(body.entries).map(async ([date, { blob, updatedAt }]) => {
          await env.JOURNAL_KV.put(`${userId}:${date}`, blob);
          manifest[date] = updatedAt;
        })
      );

      await env.JOURNAL_KV.put(`${userId}:_manifest`, JSON.stringify(manifest));
      return json({ ok: true });
    }

    // DELETE /entries/:date
    if (path.startsWith('/entries/') && request.method === 'DELETE') {
      const date = path.replace('/entries/', '');
      await env.JOURNAL_KV.delete(`${userId}:${date}`);

      const manifest = (await env.JOURNAL_KV.get(`${userId}:_manifest`, 'json') as Record<string, number>) || {};
      delete manifest[date];
      await env.JOURNAL_KV.put(`${userId}:_manifest`, JSON.stringify(manifest));
      return json({ ok: true });
    }

    // GET /export — full dump of all encrypted blobs
    if (path === '/export' && request.method === 'GET') {
      const manifest = await env.JOURNAL_KV.get(`${userId}:_manifest`, 'json') as Record<string, number> | null;
      if (!manifest) return json({ entries: {} });

      const entries: Record<string, string> = {};
      await Promise.all(
        Object.keys(manifest).map(async (date) => {
          const blob = await env.JOURNAL_KV.get(`${userId}:${date}`);
          if (blob) entries[date] = blob;
        })
      );

      return json({ entries });
    }

    return json({ error: 'Not found' }, 404);
  },
};
