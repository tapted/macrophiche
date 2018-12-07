import idb from 'idb';

import {photos} from './photos_api';

const kUserStoreName = 'mp-user';
const kGlobalStoreName = 'mp-global';
const kGlobalKey = 0;
const idbReady = idb.open('users', 4, upgradeDB => {
  console.log('Preparing indexdb. oldVersion: ' + upgradeDB.oldVersion);
  switch (upgradeDB.oldVersion) {
  case 0:
    upgradeDB.createObjectStore(kUserStoreName);
  case 3:
    upgradeDB.createObjectStore(kGlobalStoreName);
  }
});

async function getStore(store: string, write = false) {
  const db = await idbReady;
  const tx = db.transaction(store, write ? 'readwrite' : 'readonly');
  return tx.objectStore(store);
}

export async function getForUid(uid: any) {
  const store = await getStore(kUserStoreName, false);
  const data = await store.get(uid);
  return data ? data : {albums : []};
}

export async function setForUid(uid: any, data: any) {
  const store = await getStore(kUserStoreName, true);
  return store.put(data, uid);
}

export async function getGlobal() {
  const store = await getStore(kGlobalStoreName, false);
  const data = await store.get(kGlobalKey);
  return data ? data : {lastUid : ''};
}

export async function setGlobal(data: any) {
  const store = await getStore(kGlobalStoreName, true);
  return store.put(data, kGlobalKey);
}
