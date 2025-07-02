const DB_NAME = "calorieTrackerDB";
const DB_VERSION = 1;

let db: IDBDatabase;

export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      db = (event.target as IDBOpenDBRequest).result;

      // currentProfile Object Store
      if (!db.objectStoreNames.contains("currentProfile")) {
        db.createObjectStore("currentProfile", { keyPath: "id" });
      }

      // profileHistory Object Store
      if (!db.objectStoreNames.contains("profileHistory")) {
        const profileHistoryStore = db.createObjectStore("profileHistory", {
          keyPath: "timestamp",
        });
        profileHistoryStore.createIndex("dateIndex", "date");
      }

      // mealEntries Object Store
      if (!db.objectStoreNames.contains("mealEntries")) {
        const mealEntriesStore = db.createObjectStore("mealEntries", {
          keyPath: "timestamp",
        });
        mealEntriesStore.createIndex("dateIndex", "date");
        mealEntriesStore.createIndex("foodIdIndex", "food.id");
      }

      // pantryBatches Object Store
      if (!db.objectStoreNames.contains("pantryBatches")) {
        const pantryBatchesStore = db.createObjectStore("pantryBatches", {
          keyPath: "id",
        });
        pantryBatchesStore.createIndex("foodIdIndex", "foodId");
        pantryBatchesStore.createIndex(
          "remainingQuantityIndex",
          "remainingQuantityInUnits"
        );
      }

      // recentFoods Object Store
      if (!db.objectStoreNames.contains("recentFoods")) {
        const recentFoodsStore = db.createObjectStore("recentFoods", {
          keyPath: "id",
        });
        recentFoodsStore.createIndex("mealTypeIndex", "mealType");
        recentFoodsStore.createIndex("mealTypeAndLastUsedIndex", [
          "mealType",
          "lastUsed",
        ]);
      }
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onerror = (event) => {
      reject(
        "Error opening IndexedDB: " + (event.target as IDBOpenDBRequest).error
      );
    };
  });
};

export const addData = <T>(storeName: string, data: T): Promise<void> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.add(data);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      reject("Error adding data: " + (event.target as IDBRequest).error);
    };
  });
};

export const getData = <T>(
  storeName: string,
  key: IDBValidKey
): Promise<T | undefined> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = () => {
      resolve(request.result as T);
    };

    request.onerror = (event) => {
      reject("Error getting data: " + (event.target as IDBRequest).error);
    };
  });
};

export const getAllData = <T>(storeName: string): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result as T[]);
    };

    request.onerror = (event) => {
      reject("Error getting all data: " + (event.target as IDBRequest).error);
    };
  });
};

export const updateData = <T>(storeName: string, data: T): Promise<void> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.put(data);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      reject("Error updating data: " + (event.target as IDBRequest).error);
    };
  });
};

export const deleteData = (
  storeName: string,
  key: IDBValidKey
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      reject("Error deleting data: " + (event.target as IDBRequest).error);
    };
  });
};

export const getByIndex = <T>(
  storeName: string,
  indexName: string,
  query: IDBValidKey | IDBKeyRange
): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readonly");
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(query);

    request.onsuccess = () => {
      resolve(request.result as T[]);
    };

    request.onerror = (event) => {
      reject(
        "Error getting data by index: " + (event.target as IDBRequest).error
      );
    };
  });
};
