import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

import dotenv from 'dotenv';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const file = join(__dirname, 'db.json');
const adapter = new JSONFile(file);
const defaultData = { inventory: [] };
const db = new Low(adapter, defaultData);

await db.read();
db.data ||= defaultData;
await db.write();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Routes
app.get('/api/inventory', async (req, res) => {
  await db.read();
  res.json(db.data.inventory);
});

app.post('/api/inventory', async (req, res) => {
  const item = req.body;
  await db.read();

  // specific logic to merge items if name matches (case-insensitive) AND price matches
  const existingItemIndex = db.data.inventory.findIndex(
    i => i.name.toLowerCase().trim() === item.name.toLowerCase().trim() && Number(i.price) === Number(item.price)
  );

  if (existingItemIndex > -1) {
    // Update existing item
    const existingItem = db.data.inventory[existingItemIndex];
    // meaningful merge: add quantities
    const newQuantity = Number(existingItem.quantity) + Number(item.quantity);
    db.data.inventory[existingItemIndex] = {
      ...existingItem,
      quantity: newQuantity,
      // Optional: Update price or other fields if desired, but usually keep existing or overwrite?
      // Let's keep existing price unless specified otherwise, or overwrite? 
      // User said "add it to previous item". Usually implies just quantity.
      // But if price changed, maybe update price? Let's stick to quantity merge for now.
    };
    await db.write();
    res.json(db.data.inventory[existingItemIndex]);
  } else {
    // Create new
    item.id = Date.now().toString();
    db.data.inventory.push(item);
    await db.write();
    res.status(201).json(item);
  }
});

app.put('/api/inventory/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  await db.read();
  const index = db.data.inventory.findIndex(i => i.id === id);
  if (index > -1) {
    db.data.inventory[index] = { ...db.data.inventory[index], ...updates };
    await db.write();
    res.json(db.data.inventory[index]);
  } else {
    res.status(404).json({ error: 'Item not found' });
  }
});

app.delete('/api/inventory/:id', async (req, res) => {
  const { id } = req.params;
  await db.read();
  db.data.inventory = db.data.inventory.filter(i => i.id !== id);
  await db.write();
  res.json({ success: true });
});

// Agentic AI Endpoint


const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
