const API_BASE = 'https://web-production-d7336.up.railway.app';

let _cache = null;
let _cacheTs = 0;
const CACHE_TTL = 60_000;

export async function fetchOpsData(force = false) {
  const now = Date.now();
  if (!force && _cache && now - _cacheTs < CACHE_TTL) return _cache;
  const res = await fetch(`${API_BASE}/api/query`);
  if (!res.ok) throw new Error(`API ${res.status}`);
  _cache = await res.json();
  _cacheTs = now;
  return _cache;
}

export async function sendChat(messages, context) {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, context }),
  });
  if (!res.ok) throw new Error(`Chat API ${res.status}`);
  return res.json();
}
