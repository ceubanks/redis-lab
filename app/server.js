import cors from 'cors';
import express from 'express';
import Memcached from 'memcached';
import redis from 'redis';

const app = express();
app.use(express.json());
app.use(cors());

const port = 3000;

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const MEMCACHED_HOST = process.env.MEMCACHED_HOST || 'localhost';

const redisClient = redis.createClient({
    url: `redis://${REDIS_HOST}:6379`
});

const memcachedClient = new Memcached(`${MEMCACHED_HOST}:11211`);

// Promisify memcached operations
const memcachedSet = (key, value, lifetime) => {
    return new Promise((resolve, reject) => {
        memcachedClient.set(key, value, lifetime, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
};

const memcachedGet = (key) => {
    return new Promise((resolve, reject) => {
        memcachedClient.get(key, (err, data) => {
            if (err) reject(err);
            else resolve(data);
        });
    });
};

// Simulate a slow database query
const simulateDBQuery = async (delay = 500) => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({
                timestamp: new Date().toISOString(),
                data: `Sample data with ${delay}ms delay`
            });
        }, delay);
    });
};

// Redis cache example
app.get('/redis-cache/:key', async (req, res) => {
    try {
        if (!redisClient.isOpen) {
            await redisClient.connect();
        }

        const { key } = req.params;
        const cachedValue = await redisClient.get(key);

        if (cachedValue) {
            return res.json({ 
                source: 'redis-cache',
                data: cachedValue,
                hit: true 
            });
        }

        const data = await simulateDBQuery();
        await redisClient.set(key, JSON.stringify(data), { EX: 60 });

        res.json({ 
            source: 'database',
            data,
            hit: false 
        });
    } catch (error) {
        console.error('Redis error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Memcached cache example
app.get('/memcached-cache/:key', async (req, res) => {
    try {
        const { key } = req.params;
        const cachedValue = await memcachedGet(key);

        if (cachedValue) {
            return res.json({ 
                source: 'memcached-cache',
                data: cachedValue,
                hit: true 
            });
        }

        const data = await simulateDBQuery();
        await memcachedSet(key, JSON.stringify(data), 60);

        res.json({ 
            source: 'database',
            data,
            hit: false 
        });
    } catch (error) {
        console.error('Memcached error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Bad caching example (no cache)
app.get('/no-cache/:key', async (req, res) => {
    try {
        const data = await simulateDBQuery(1000); // Slower query
        res.json({ 
            source: 'database',
            data,
            hit: false 
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Cache comparison endpoint
app.get('/compare/:key', async (req, res) => {
    try {
        if (!redisClient.isOpen) {
            await redisClient.connect();
        }

        const { key } = req.params;
        
        // Measure Redis timing
        const redisStart = process.hrtime();
        const redisValue = await redisClient.get(key);
        const redisEnd = process.hrtime(redisStart);
        const redisDuration = (redisEnd[0] * 1e9 + redisEnd[1]) / 1e6;

        // Measure Memcached timing
        const memcachedStart = process.hrtime();
        const memcachedValue = await memcachedGet(key);
        const memcachedEnd = process.hrtime(memcachedStart);
        const memcachedDuration = (memcachedEnd[0] * 1e9 + memcachedEnd[1]) / 1e6;

        const data = await simulateDBQuery(200);

        res.json({
            redis: {
                hit: !!redisValue,
                data: redisValue ? JSON.parse(redisValue) : null,
                duration: redisDuration
            },
            memcached: {
                hit: !!memcachedValue,
                data: memcachedValue ? JSON.parse(memcachedValue) : null,
                duration: memcachedDuration
            },
            database: data
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});