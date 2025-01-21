# Cache Performance Comparison

This project demonstrates and compares the performance of Redis and Memcached as caching layers. It includes a dashboard to visualize real-time metrics and performance data.

## Features

- Redis and Memcached caching implementations
- Real-time performance monitoring
- Interactive dashboard with Grafana
- Load testing with k6
- Docker containerization

## Prerequisites

- Docker and Docker Compose
- Node.js (for local development)

## Quick Start

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd redis-lab
   ```

2. Start the services:
   ```bash
   docker compose up -d
   ```

3. Access the services:
   - Frontend Dashboard: http://localhost:5173
   - Grafana: http://localhost:3001
   - RedisInsight: http://localhost:8001

## Project Structure

- `/app` - Backend API with Redis and Memcached integration
- `/frontend` - React dashboard for visualizing cache performance
- `/grafana` - Grafana dashboards and configuration
- `/prometheus` - Prometheus configuration for metrics collection

## Running Load Tests

The project includes k6 load tests to simulate traffic:

```bash
docker compose run k6 run /scripts/load-test.js
```

## Monitoring

- Redis metrics are exposed on port 9121
- Memcached metrics are exposed on port 9150
- Prometheus scrapes these metrics and stores them
- Grafana visualizes the collected metrics

## Development

1. Install dependencies:
   ```bash
   cd app && npm install
   cd ../frontend && npm install
   ```

2. Run services in development mode:
   ```bash
   docker compose up -d redis memcached redis-exporter memcached-exporter prometheus grafana
   cd app && npm start
   cd frontend && npm run dev
   ```

## License

MIT 