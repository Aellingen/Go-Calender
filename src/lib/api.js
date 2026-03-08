import { supabase } from './supabase';
import { toast } from '../store/toast';

const QUEUE_KEY = 'go-calendar-offline-queue';
let processing = false;

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

function getQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveQueue(queue) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

async function processQueue() {
  if (processing || !navigator.onLine) return;
  processing = true;

  const queue = getQueue();
  if (queue.length === 0) {
    processing = false;
    return;
  }

  // Get fresh auth headers for replay
  const authHeaders = await getAuthHeaders();

  let synced = 0;
  for (let i = 0; i < queue.length; i++) {
    const entry = queue[i];
    try {
      const res = await fetch(entry.url, {
        method: entry.method,
        headers: { ...entry.headers, ...authHeaders },
        body: entry.body,
      });
      if (!res.ok) {
        saveQueue(queue.slice(i));
        processing = false;
        if (synced > 0) toast.success(`Synced ${synced} queued write(s)`);
        toast.error('Some queued writes failed — will retry');
        return;
      }
      synced++;
    } catch {
      saveQueue(queue.slice(i));
      processing = false;
      if (synced > 0) toast.success(`Synced ${synced} queued write(s)`);
      return;
    }
  }

  saveQueue([]);
  processing = false;

  if (synced > 0) {
    toast.success(`Synced ${synced} queued write(s)`);
  }
}

window.addEventListener('online', () => {
  toast.info('Back online — syncing...');
  processQueue();
});

window.addEventListener('offline', () => {
  toast.info('You are offline — writes will be queued');
});

/**
 * Authenticated fetch wrapper. Injects Supabase Auth token.
 * For write operations when offline, queues the request.
 */
export async function apiFetch(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const authHeaders = await getAuthHeaders();
  const headers = { ...options.headers, ...authHeaders };

  // Read operations go through directly
  if (method === 'GET' || method === 'HEAD') {
    return fetch(url, { ...options, headers });
  }

  // If online, try fetch directly
  if (navigator.onLine) {
    return fetch(url, { ...options, headers });
  }

  // Offline: queue the write
  const queue = getQueue();
  queue.push({
    url,
    method,
    headers: { 'Content-Type': 'application/json', ...options.headers },
    body: options.body || null,
    timestamp: Date.now(),
  });
  saveQueue(queue);

  toast.info('Queued for sync when back online');

  return new Response(JSON.stringify({ data: { queued: true }, error: null }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Process any leftover queue on startup
if (navigator.onLine) {
  setTimeout(processQueue, 2000);
}
