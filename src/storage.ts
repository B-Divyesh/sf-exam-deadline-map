import type { PersistedState } from './types';

const DATABASE = 'exam-deadline-map';
const STORE = 'state';
const KEY = 'current';

function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadState(): Promise<PersistedState | undefined> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readonly');
    const request = transaction.objectStore(STORE).get(KEY);
    request.onsuccess = () => resolve(request.result as PersistedState | undefined);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
  });
}

export async function saveState(state: PersistedState): Promise<void> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).put(state, KEY);
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function clearState(): Promise<void> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).delete(KEY);
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onerror = () => reject(transaction.error);
  });
}
