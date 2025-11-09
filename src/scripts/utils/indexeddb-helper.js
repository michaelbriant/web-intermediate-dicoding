import { openDB } from 'idb';

const DB_NAME = 'story-db';
const DB_VERSION = 1;
const OUTBOX_STORE = 'story-outbox';

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(OUTBOX_STORE)) {
      db.createObjectStore(OUTBOX_STORE, { autoIncrement: true, keyPath: 'id' });
    }
  },
});

const StoryDb = {
  async addStoryToOutbox(story) {
    return (await dbPromise).add(OUTBOX_STORE, story);
  },
  async getAllStoriesFromOutbox() {
    return (await dbPromise).getAll(OUTBOX_STORE);
  },
  async deleteStoryFromOutbox(id) {
    return (await dbPromise).delete(OUTBOX_STORE, id);
  },
};

export default StoryDb;