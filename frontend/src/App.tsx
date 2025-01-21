import { useEffect, useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import './App.css';

interface Metric {
  timestamp: string;
  redisLatency: number;
  memcachedLatency: number;
  redisHitRate: number;
  memcachedHitRate: number;
}

function App() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Use a rotating set of 5 fixed keys
        const keys = ['test-key-1', 'test-key-2', 'test-key-3', 'test-key-4', 'test-key-5'];
        const key = keys[Math.floor(Date.now() / 2000) % keys.length];
        
        // Use localhost for browser access
        const baseUrl = import.meta.env.DEV ? 'http://localhost:3000' : import.meta.env.VITE_API_URL;
        const response = await fetch(`${baseUrl}/compare/${key}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const comparison = await response.json();
        
        console.log('Response data:', comparison); // Debug log
        
        // Safely access nested properties with proper type conversion
        const redisData = comparison?.redis || {};
        const memcachedData = comparison?.memcached || {};
        
        // Keep durations in seconds with 2 decimal places
        const redisDuration = Number(parseFloat(redisData.duration || '0').toFixed(2));
        const memcachedDuration = Number(parseFloat(memcachedData.duration || '0').toFixed(2));
        
        const newMetric = {
          timestamp: new Date().toLocaleTimeString(),
          redisLatency: redisDuration,
          memcachedLatency: memcachedDuration,
          redisHitRate: redisData.hit ? 100 : 0,
          memcachedHitRate: memcachedData.hit ? 100 : 0,
        };

        console.log('New metric:', newMetric); // Debug log

        setMetrics(prevMetrics => {
          const updatedMetrics = [...prevMetrics, newMetric];
          return updatedMetrics.slice(-30); // Keep last 30 data points
        });
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      }
    };

    const interval = setInterval(fetchData, 2000); // Fetch every 2 seconds
    fetchData(); // Initial fetch
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Cache Performance Dashboard</h1>
        
        {error && (
          <div className="bg-red-50 p-4 rounded-md mb-8">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Latency Comparison</h2>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp"
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis 
                  label={{ value: 'Latency (seconds)', angle: -90, position: 'insideLeft' }}
                  domain={[0, 'dataMax + 0.1']}
                  tickFormatter={(value) => value.toFixed(2)}
                />
                <Tooltip formatter={(value) => `${Number(value).toFixed(2)}s`} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="redisLatency" 
                  name="Redis Latency"
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="memcachedLatency"
                  name="Memcached Latency" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Hit Rate Comparison</h2>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp"
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis 
                  label={{ value: 'Hit Rate (%)', angle: -90, position: 'insideLeft' }}
                  domain={[0, 100]}
                />
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="redisHitRate"
                  name="Redis Hit Rate" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="memcachedHitRate"
                  name="Memcached Hit Rate" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
