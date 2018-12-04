import idb from 'idb';

import {photos} from './photos_api';

const kStoreName = 'mp-user';
const idbReady = idb.open('users', 3, upgradeDB => {
  console.log('Preparing indexdb. oldVersion: ' + upgradeDB.oldVersion);
  switch (upgradeDB.oldVersion) {
  case 0:
    upgradeDB.createObjectStore(kStoreName);
  }
});

async function getUserStore(write = false) {
  const db = await idbReady;
  const tx = db.transaction(kStoreName, write ? 'readwrite' : 'readonly');
  return tx.objectStore(kStoreName);
}

export async function getForUid(uid: any) {
  const store = await getUserStore(false);
  const data = await store.get(uid);
  return data ? data : {albums : []};
}

export async function setForUid(uid: any, data: any) {
  const store = await getUserStore(true);
  return store.put(data, uid);
}
