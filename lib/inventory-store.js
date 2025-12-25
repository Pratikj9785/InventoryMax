// Shared in-memory store for inventory items
// Note: In production, replace this with a proper database (MongoDB, PostgreSQL, etc.)
// This in-memory store will reset on server restart

let inventoryStore = [];

export function getStore() {
    return inventoryStore;
}

export function setStore(newStore) {
    inventoryStore = newStore;
}

export function addItem(item) {
    inventoryStore.push(item);
    return item;
}

export function updateItem(id, updates) {
    const index = inventoryStore.findIndex(item => item.id === id);
    if (index === -1) return null;
    
    inventoryStore[index] = { ...inventoryStore[index], ...updates };
    return inventoryStore[index];
}

export function deleteItem(id) {
    const index = inventoryStore.findIndex(item => item.id === id);
    if (index === -1) return false;
    
    inventoryStore.splice(index, 1);
    return true;
}

export function findItem(id) {
    return inventoryStore.find(item => item.id === id);
}

export function findItemIndex(predicate) {
    return inventoryStore.findIndex(predicate);
}

