const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Simple agent runner endpoint
app.post('/agent/run', async (req, res) => {
  try {
    const { agent, prompt, context } = req.body || {};

    // Minimal behavior: echo and simulate processing
    const output = `NodeAgent(${agent || 'default'}): processed prompt '${(prompt || '').slice(0,200)}'`;

    // Return a structured response that Python orchestrator can consume
    return res.json({ status: 'ok', agent: agent || 'default', output, details: { processedAt: new Date().toISOString() } });
  } catch (err) {
    console.error('Agent run error', err);
    return res.status(500).json({ status: 'error', message: String(err) });
  }
});

app.get('/', (req, res) => res.json({ status: 'ok', service: 'voltherm-node-agent' }));

app.listen(PORT, () => console.log(`Voltherm Node Agent running on http://0.0.0.0:${PORT}`));
