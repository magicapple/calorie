const DB_NAME = "calorieTrackerDB";
const DB_VERSION = 2; // Version 2 to trigger the migration

let db: IDBDatabase;

export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    console.log("Attempting to open DB with version:", DB_VERSION);
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      console.log("Database upgrade needed.");
      const db = (event.target as IDBOpenDBRequest).result;
      const oldVersion = event.oldVersion;
      const tx = (event.target as IDBOpenDBRequest).transaction;

      if (oldVersion < 1) {
        // This block is for brand new users, it sets up the initial schema.
        console.log("Setting up database for the first time (v1).");
        if (!db.objectStoreNames.contains("currentProfile")) {
          db.createObjectStore("currentProfile", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("profileHistory")) {
          const profileHistoryStore = db.createObjectStore("profileHistory", {
            keyPath: "timestamp",
          });
          profileHistoryStore.createIndex("dateIndex", "date");
        }
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
      }

      if (oldVersion < 2) {
        console.log("Upgrading database from v1 to v2.");
        // Migration for mealEntries: keyPath from 'timestamp' to 'id'
        if (db.objectStoreNames.contains("mealEntries")) {
            console.log("Found old 'mealEntries' store. Migrating...");
            const mealStore = tx.objectStore("mealEntries");
            const allMealsRequest = mealStore.getAll();

            allMealsRequest.onsuccess = () => {
                const mealsData = allMealsRequest.result;
                console.log(`Found ${mealsData.length} meals to migrate.`);
                
                db.deleteObjectStore("mealEntries");
                console.log("Old 'mealEntries' store deleted.");

                const newMealEntriesStore = db.createObjectStore("mealEntries", {
                    keyPath: "id", // The correct keyPath
                });
                newMealEntriesStore.createIndex("dateIndex", "date");
                newMealEntriesStore.createIndex("foodIdIndex", "food.id");
                newMealEntriesStore.createIndex("timestampIndex", "timestamp"); // Add a new index for timestamp
                console.log("New 'mealEntries' store created with keyPath 'id'.");

                console.log("Populating new store with migrated data...");
                mealsData.forEach(meal => {
                    if (!meal.id || typeof meal.id !== 'string') {
                        meal.id = meal.timestamp.toString();
                    }
                    newMealEntriesStore.put(meal);
                });
                console.log("Data migration for 'mealEntries' complete.");
            };
        } else {
            // If for some reason it didn't exist, create it correctly.
            const mealEntriesStore = db.createObjectStore("mealEntries", { keyPath: "id" });
            mealEntriesStore.createIndex("dateIndex", "date");
            mealEntriesStore.createIndex("foodIdIndex", "food.id");
            mealEntriesStore.createIndex("timestampIndex", "timestamp");
            console.log("'mealEntries' store did not exist. Created it correctly.");
        }
      }
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      console.log("Database opened successfully.");
      resolve(db);
    };

    request.onerror = (event) => {
      const error = (event.target as IDBOpenDBRequest).error;
      console.error("Error opening IndexedDB:", error);
      reject("Error opening IndexedDB: " + error);
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

export const deleteData = (storeName: string, key: IDBValidKey): Promise<void> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    transaction.oncomplete = () => {
        console.log(`Transaction completed: Key ${key} should be deleted from ${storeName}.`);
        resolve();
    };

    transaction.onerror = (event) => {
        console.error(`Transaction error while deleting key ${key} from ${storeName}:`, transaction.error);
        reject(transaction.error);
    };

    request.onerror = (event) => {
        console.error(`Failed to submit delete request for key ${key} from ${storeName}:`, (event.target as IDBRequest).error);
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