import express from 'express';
import Memcached from 'memcached';
import redis from 'redis';

const app = express();
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

app.get('/', async (req, res) => {
    try {
        // connect to redis if not already connected
        if (!redisClient.isOpen) {
            await redisClient.connect();
        }

        // test redis
        await redisClient.set('hello', 'world');
        const redisValue = await redisClient.get('hello');

        // test memcached
        await memcachedSet('foo', 'bar', 60);
        const memcachedValue = await memcachedGet('foo');

        res.send(`<h1>Testing Redis and Memcached</h1>
        <p>Redis value: ${redisValue}</p>
        <p>Memcached value: ${memcachedValue}</p>`);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send(`Internal server error: ${error.message}`);
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});