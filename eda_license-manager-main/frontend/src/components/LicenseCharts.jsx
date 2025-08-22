import React, { useMemo } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js';
import './LicenseCharts.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title
);

const monthMap = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

function getExpiryBucket(expiry) {
  if (!expiry || expiry === 'N/A') return 'valid';
  try {
    const parts = expiry.split('-');
    if (parts.length !== 3) return 'valid';
    const day = parseInt(parts[0]);
    const month = monthMap[parts[1]?.toLowerCase()];
    const year = parseInt(parts[2]);
    if (month === undefined) return 'valid';
    const d = new Date(year, month, day);
    d.setHours(23, 59, 59, 999);
    const now = new Date();
    const soon = new Date();
    soon.setDate(now.getDate() + 30);
    if (d <= now) return 'expired';
    if (d <= soon) return 'expiring-soon';
    return 'valid';
  } catch {
    return 'valid';
  }
}

const LicenseCharts = ({ data, selectedTool }) => {
  // Filter rows once based on selected tool
  const rows = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return selectedTool === 'all'
      ? data
      : data.filter(r => (r.tool || '').toLowerCase() === selectedTool.toLowerCase());
  }, [data, selectedTool]);

  // Aggregate unique users by tool
  const usersAgg = useMemo(() => {
    const map = new Map(); // key -> Set of usernames
    for (const row of rows) {
      const key = (row.tool || 'unknown').toUpperCase();
      const set = map.get(key) || new Set();
      if (Array.isArray(row.users)) {
        for (const u of row.users) {
          if (u) set.add(String(u));
        }
      }
      map.set(key, set);
    }
    const labels = Array.from(map.keys());
    const userCounts = labels.map(k => (map.get(k) ? map.get(k).size : 0));
    return { labels, userCounts };
  }, [rows]);

  // Small summary stats for chart labels
  const summary = useMemo(() => {
    const featureCount = rows.length;
    const inUseFeaturesCount = rows.reduce((acc, r) => acc + (Number(r.inUse || 0) > 0 ? 1 : 0), 0);
    // Tool count (distinct tools in current rows)
    const toolCount = new Set(rows.map(r => (r.tool || 'unknown').toUpperCase())).size;
    // Unique users across all rows
    const usersSet = new Set();
    for (const r of rows) {
      if (Array.isArray(r.users)) {
        for (const u of r.users) {
          if (u) usersSet.add(String(u));
        }
      }
    }
    const uniqueUsers = usersSet.size;
    return { featureCount, inUseFeaturesCount, toolCount, uniqueUsers };
  }, [rows]);

  // Expiry distribution (filtered by selected tool if not 'all')
  const expiryAgg = useMemo(() => {
    const counts = { valid: 0, 'expiring-soon': 0, expired: 0 };
    for (const row of rows) {
      const b = getExpiryBucket(row.expiry);
      counts[b] += 1;
    }
    return counts;
  }, [rows]);

  const barData = {
    labels: usersAgg.labels,
    datasets: [
      {
        label: 'Users',
        data: usersAgg.userCounts,
        backgroundColor: 'rgba(54, 162, 235, 0.8)'
      }
    ]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: {
        display: true,
        text: selectedTool === 'all'
          ? 'Users by Tool'
          : `Users - ${selectedTool.toUpperCase()}`
      }
    },
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0 } }
    }
  };

  // Pie: user share by tool
  const pieData = {
    labels: usersAgg.labels,
    datasets: [
      {
        data: usersAgg.userCounts,
        backgroundColor: usersAgg.labels.map((_, i) => {
          const palette = [
            'rgba(99, 102, 241, 0.9)', // indigo
            'rgba(34, 197, 94, 0.9)',  // green
            'rgba(234, 179, 8, 0.9)',  // amber
            'rgba(239, 68, 68, 0.9)',  // red
            'rgba(59, 130, 246, 0.9)', // blue
            'rgba(168, 85, 247, 0.9)', // purple
            'rgba(20, 184, 166, 0.9)'  // teal
          ];
          return palette[i % palette.length];
        }),
        borderWidth: 1
      }
    ]
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
      title: { display: true, text: 'User Distribution by Tool' }
    }
  };

  return (
    <div className="charts-grid">
      <div className="chart-card">
        <div className="chart-meta">Tools: {summary.toolCount} • Users: {summary.uniqueUsers}</div>
        <Bar data={barData} options={barOptions} />
      </div>
      <div className="chart-card">
        <div className="chart-meta">Tools: {summary.toolCount} • Users: {summary.uniqueUsers}</div>
        <Pie data={pieData} options={pieOptions} />
      </div>
    </div>
  );
};

export default LicenseCharts;
