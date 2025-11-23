const express = require('express');
const Redis = require('ioredis');
const { Command } = require('ioredis');
const cors = require('cors');

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(cors());

const host = process.env.REDIS_HOST || 'redis';
const port = parseInt(process.env.REDIS_PORT || '6379', 10);
const password = process.env.REDIS_PASSWORD || '';

const redis = new Redis({ host, port, password });

app.post('/', async (req, res) => {
  const { command } = req.body || {};
  if (!Array.isArray(command) || !command.length) {
    return res.status(400).json({ error: 'Body must include { "command": ["PING"] }' });
  }

  try {
    const redisCommand = new Command(command[0], command.slice(1).map(String), {
      replyEncoding: 'utf8',
    });
    const result = await redis.sendCommand(redisCommand);
    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const portHttp = parseInt(process.env.PORT || '8080', 10);
app.listen(portHttp, () => {
  console.log(`Redis REST bridge listening on port ${portHttp}`);
});
