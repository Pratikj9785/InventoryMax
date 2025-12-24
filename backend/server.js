import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { spawn } from 'child_process';
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
  // Simple ID generation
  item.id = Date.now().toString();
  await db.read();
  db.data.inventory.push(item);
  await db.write();
  res.status(201).json(item);
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
app.post('/api/analyze', async (req, res) => {
  const { context } = req.body; 
  // context could be "Identify dead stock" or "Suggest reorder for SKU-123"

  // We pass the current inventory snapshot to the agent
  await db.read();
  const inventoryData = JSON.stringify(db.data.inventory);

  // Spawn Python process
  // Adjust path to python and script as needed. Assuming 'python' is in PATH.
  const pythonProcess = spawn('python', ['../agents/inventory_team.py', context], {
    cwd: join(__dirname, '../agents'),
  });

  let output = '';
  // Send inventory data via stdin
  pythonProcess.stdin.write(inventoryData);
  pythonProcess.stdin.end();

  pythonProcess.stdout.on('data', (data) => {
    output += data.toString();
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`Agent Error: ${data}`);
  });

  pythonProcess.on('close', (code) => {
    if (code !== 0) {
      return res.status(500).json({ error: 'Agent analysis failed' });
    }
    // Parse output if it's JSON, or return raw
    try {
        // Find JSON in output if mixed with logs
        const jsonMatch = output.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { message: output };
        res.json(result);
    } catch (e) {
        res.json({ message: output });
    }
  });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
