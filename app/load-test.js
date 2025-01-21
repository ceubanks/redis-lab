import { check, sleep } from 'k6';
import http from 'k6/http';

export const options = {
    stages: [
        { duration: '30s', target: 20 }, // Ramp up to 20 users
        { duration: '1m', target: 20 },  // Stay at 20 users
        { duration: '30s', target: 0 },  // Ramp down to 0 users
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    },
};

// Use Docker service name instead of localhost
const BASE_URL = 'http://app:3000';

export default function () {
    const key = `test-key-${__VU}-${__ITER}`;

    // Test Redis caching
    const redisResponse = http.get(`${BASE_URL}/redis-cache/${key}`);
    check(redisResponse, {
        'redis status is 200': (r) => r.status === 200,
    });

    // Test Memcached caching
    const memcachedResponse = http.get(`${BASE_URL}/memcached-cache/${key}`);
    check(memcachedResponse, {
        'memcached status is 200': (r) => r.status === 200,
    });

    // Test no caching (should be slower)
    const noCacheResponse = http.get(`${BASE_URL}/no-cache/${key}`);
    check(noCacheResponse, {
        'no-cache status is 200': (r) => r.status === 200,
    });

    // Test comparison endpoint
    const compareResponse = http.get(`${BASE_URL}/compare/${key}`);
    check(compareResponse, {
        'compare status is 200': (r) => r.status === 200,
    });

    sleep(1);
} 