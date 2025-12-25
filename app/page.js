"use client";
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { TrendingUp, AlertTriangle, Package, Activity } from 'lucide-react';

const Card = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <h3 className="text-3xl font-bold mt-2 text-gray-800">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState({ totalItems: 0, totalValue: 0, lowStock: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch stats
    axios.get('/api/inventory')
      .then(res => {
        const items = res.data;
        const totalItems = items.length;
        const totalValue = items.reduce((acc, item) => acc + (Number(item.price || 0) * Number(item.quantity || 0)), 0);
        const lowStock = items.filter(i => Number(i.quantity) < (Number(i.threshold) || 10)).length;
        setStats({ totalItems, totalValue, lowStock });
        setLoading(false);
      })
      .catch(err => {
        console.error("Backend error:", err);
        setLoading(false);
      });
  }, []);



  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white-800">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your inventory health.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Total SKUs" value={loading ? "..." : stats.totalItems} icon={Package} color="bg-blue-500" />
        <Card title="Total Value" value={loading ? "..." : `₹${stats.totalValue.toLocaleString()}`} icon={TrendingUp} color="bg-green-500" />
        <Card title="Low Stock Alerts" value={loading ? "..." : stats.lowStock} icon={AlertTriangle} color="bg-red-500" />
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={20} className="text-gray-400" />
          <h2 className="text-lg font-semibold">System Status</h2>
        </div>
        <p className="text-gray-600">
          {loading ? "Connecting to backend..." : "System is online. Real-time tracking enabled."}
        </p>
      </div>
    </div>
  );
}
