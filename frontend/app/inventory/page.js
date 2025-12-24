"use client";
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Trash2, Edit2, AlertCircle, Bot, X, CheckCircle, TrendingDown, DollarSign, Package } from 'lucide-react';

export default function InventoryPage() {
    const [items, setItems] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', quantity: '', threshold: 10, price: '' });
    const [editId, setEditId] = useState(null);

    // AI State
    const [showAiModal, setShowAiModal] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiStatus, setAiStatus] = useState('');
    const [aiResult, setAiResult] = useState([]);
    //Added
    const fetchItems = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/inventory');
            setItems(res.data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => { fetchItems(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editId) {
                await axios.put(`http://localhost:5000/api/inventory/${editId}`, formData);
            } else {
                await axios.post('http://localhost:5000/api/inventory', formData);
            }
            setShowModal(false);
            setFormData({ name: '', quantity: '', threshold: 10, price: '' });
            setEditId(null);
            fetchItems();
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure?")) return;
        try {
            await axios.delete(`http://localhost:5000/api/inventory/${id}`);
            fetchItems();
        } catch (err) { console.error(err); }
    };

    const openEdit = (item) => {
        setFormData(item);
        setEditId(item.id);
        setShowModal(true);
    };

    // Helper to safely parse JSON from AI response
    const parseJsonFromResponse = (response) => {
        try {
            let text = '';

            // Priority 1: Check for standard OpenAI/Puter response structure
            if (response?.message?.content) {
                text = response.message.content;
            }
            // Priority 2: Check if it's a raw string
            else if (typeof response === 'string') {
                text = response;
            }
            // Priority 3: Check if it's already the data object (and not a wrapper)
            else if (typeof response === 'object' && response !== null) {
                // If it's an array, it's likely our data list
                if (Array.isArray(response)) return response;
                // If it has 'role' or 'usage', it's likely a wrapper we failed to handle above
                if (response.role || response.usage) {
                    // Fallback: try to stringify and parse if it's a weird wrapper
                    text = JSON.stringify(response);
                } else {
                    return response; // Assume it's the data object
                }
            }

            // Cleanup code blocks if present (markdown)
            const jsonMatch = text.match(/\[[\s\S]*\]/) || text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            // Fallback: try parsing the whole text
            return JSON.parse(text);
        } catch (e) {
            console.error("JSON Parsing Error:", e);
            return []; // Return empty array on failure
        }
    };

    const runAiAnalysis = async () => {
        setShowAiModal(true);
        setAiLoading(true);
        setAiResult([]);
        setAiStatus("Initializing Agent Team...");

        try {
            if (!window.puter) throw new Error("Puter.js not loaded");

            // --- Data Enrichment (Simulating Sales Data) ---
            const enrichedItems = items.map(item => {
                // Simulate random daily sales between 0 and 20% of current stock
                const avgDailySales = Math.max(1, Math.floor(Math.random() * (Number(item.quantity) * 0.2)));
                const ageDays = Math.floor((Date.now() - Number(item.id)) / (1000 * 60 * 60 * 24));

                return {
                    sku_id: `SKU-${item.id.slice(-4)}`,
                    name: item.name,
                    current_stock: Number(item.quantity),
                    price: Number(item.price),
                    avg_daily_sales: avgDailySales,
                    age_days: isNaN(ageDays) ? 0 : ageDays
                };
            });

            const inventoryContext = JSON.stringify(enrichedItems);

            // --- Step 1: Inventory Analyst ---
            setAiStatus("Agent 1/3: Inventory Analyst is crunching numbers...");
            const analystPrompt = `
            Role: Inventory Analyst.
            Task: Analyze raw data and generate insights.
            Inputs: ${inventoryContext}
            
            Strictly Output ONLY a JSON Array of objects (no markdown, no plain text) with this exact schema for each item:
            {
              "sku_id": "SKU-...",
              "name": "Item Name",
              "current_stock": 123,
              "days_of_inventory": (calculate: current_stock / avg_daily_sales),
              "stock_health": "OVERSTOCKED" | "HEALTHY" | "LOW_STOCK",
              "aging_risk": "HIGH" | "MEDIUM" | "LOW",
              "key_observations": ["observation 1", "observation 2"]
            }
            `;
            const analystRes = await window.puter.ai.chat(analystPrompt);
            const analystData = parseJsonFromResponse(analystRes);

            setAiResult(prev => [...prev, { role: 'Inventory Analyst', data: analystData, type: 'analyst' }]);

            // --- Step 2: Procurement Manager ---
            setAiStatus("Agent 2/3: Procurement Manager is deciding actions...");
            const procurementPrompt = `
            Role: Procurement Manager.
            Task: Convert analysis into actions.
            Input Analyst Report: ${JSON.stringify(analystData)}
            
            Strictly Output ONLY a JSON Array of objects with this exact schema:
            {
              "sku_id": "SKU-...",
              "procurement_decision": "HOLD" | "REORDER",
              "recommended_reorder_qty": 0,
              "sales_action": "CLEARANCE" | "NONE" | "PROMOTION",
              "suggested_discount": "20%",
              "rationale": ["reason 1"]
            }
            `;
            const procRes = await window.puter.ai.chat(procurementPrompt);
            const procData = parseJsonFromResponse(procRes);

            setAiResult(prev => [...prev, { role: 'Procurement Manager', data: procData, type: 'procurement' }]);

            // --- Step 3: Team Lead ---
            setAiStatus("Agent 3/3: Team Lead is finalizing executive plan...");
            const managerPrompt = `
            Role: Team Lead.
            Task: Final decision & executive summary.
            Input Procurement Recommendations: ${JSON.stringify(procData)}
            
            Strictly Output ONLY a JSON Array of objects with this exact schema:
            {
              "sku_id": "SKU-...",
              "final_decision": "Decision String",
              "business_impact": {
                "capital_unlocked_estimate": 0,
                "stock_risk_reduction": "HIGH" | "LOW"
              },
              "executive_summary": "One sentence summary."
            }
            `;
            const leadRes = await window.puter.ai.chat(managerPrompt);
            const leadData = parseJsonFromResponse(leadRes);

            setAiResult(prev => [...prev, { role: 'Team Lead', data: leadData, type: 'lead' }]);

        } catch (err) {
            console.error(err);
            setAiResult(prev => [...prev, { role: 'System Error', content: err.message, type: 'error' }]);
        }
        setAiLoading(false);
        setAiStatus("Analysis Complete");
    };

    // --- Render Helpers ---
    const renderAnalystCard = (item) => (
        <div key={item.sku_id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-2 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <span className="font-bold text-black text-lg">{item.name}</span>
                    <span className="text-xs text-gray-500 ml-2 font-mono">[{item.sku_id}]</span>
                </div>
                <div className="flex gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold border ${item.stock_health === 'OVERSTOCKED' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                        {item.stock_health}
                    </span>
                    {item.aging_risk === 'HIGH' && <span className="bg-orange-50 text-orange-800 border border-orange-200 px-2 py-0.5 rounded text-xs font-bold">AGING RISK</span>}
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm text-black">
                <div className="flex flex-col">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Days of Inventory</span>
                    <span className="font-mono font-bold text-lg">{Math.round(item.days_of_inventory)}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Key Observation</span>
                    <span className="italic">{item.key_observations?.[0]}</span>
                </div>
            </div>
        </div>
    );

    const renderProcurementCard = (item) => (
        <div key={item.sku_id} className="bg-white p-4 rounded-lg border border-purple-100 shadow-sm mb-2 hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500"></div>
            <div className="flex justify-between items-start mb-2 pl-2">
                <span className="font-mono font-bold text-black">{item.sku_id}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold border ${item.procurement_decision === 'REORDER' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                    {item.procurement_decision}
                </span>
            </div>
            <div className="text-sm text-black pl-2 space-y-2">
                {item.sales_action !== 'NONE' && (
                    <div className="flex items-center gap-2 font-semibold text-red-600">
                        <TrendingDown size={16} />
                        <span>{item.sales_action}</span>
                        <span className="bg-red-100 text-red-800 text-xs px-1 rounded">{item.suggested_discount}</span>
                    </div>
                )}
                {item.recommended_reorder_qty > 0 && (
                    <div className="flex items-center gap-2 font-semibold text-green-600">
                        <Package size={16} />
                        <span>Order: {item.recommended_reorder_qty} units</span>
                    </div>
                )}
                <div className="text-xs text-gray-600 border-t border-gray-100 pt-2 mt-2">
                    <span className="font-semibold text-purple-700">Rationale:</span> {item.rationale?.[0]}
                </div>
            </div>
        </div>
    );

    const renderLeadCard = (item) => (
        <div key={item.sku_id} className="bg-gray-900 p-4 rounded-lg border border-gray-700 shadow-md mb-2 text-white">
            <div className="flex justify-between items-start mb-2">
                <span className="font-mono font-bold text-gray-300">{item.sku_id}</span>
                <span className="bg-emerald-500 text-white px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 shadow-sm">
                    <CheckCircle size={12} /> {item.final_decision}
                </span>
            </div>
            <div className="text-sm">
                <div className="font-medium mb-3 text-gray-100 leading-relaxed">"{item.executive_summary}"</div>
                <div className="grid grid-cols-2 gap-4 mt-2 pt-3 border-t border-gray-700">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-400 uppercase">Capital Unlocked</span>
                        <span className="font-mono text-emerald-400 font-bold flex items-center">
                            <DollarSign size={14} /> {item.business_impact?.capital_unlocked_estimate?.toLocaleString()}
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-400 uppercase">Risk Reduction</span>
                        <span className="font-mono text-blue-400 font-bold">
                            {item.business_impact?.stock_risk_reduction}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl text white font-bold text-gray-800">Inventory Logic</h1>
                <div className="flex gap-2">
                    <button onClick={runAiAnalysis} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition">
                        <Bot size={18} /> Ask AI Agent
                    </button>
                    <button onClick={() => { setEditId(null); setFormData({ name: '', quantity: '', threshold: 10, price: '' }); setShowModal(true); }} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition">
                        <Plus size={18} /> Add Item
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="p-4 font-medium text-gray-600">Name</th>
                            <th className="p-4 font-medium text-gray-600">Quantity</th>
                            <th className="p-4 font-medium text-gray-600">Price</th>
                            <th className="p-4 font-medium text-gray-600">Status</th>
                            <th className="p-4 font-medium text-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(item => (
                            <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                                <td className="p-4 font-medium text-gray-800">{item.name}</td>
                                <td className="p-4 text-gray-600">{item.quantity}</td>
                                <td className="p-4 text-gray-600">₹{item.price}</td>
                                <td className="p-4">
                                    {Number(item.quantity) < Number(item.threshold || 10) ? (
                                        <span className="bg-red-50 text-red-600 px-2 py-1 rounded text-xs font-semibold flex items-center w-fit gap-1">
                                            <AlertCircle size={12} /> Low Stock
                                        </span>
                                    ) : (
                                        <span className="bg-green-50 text-green-600 px-2 py-1 rounded text-xs font-semibold">In Stock</span>
                                    )}
                                </td>
                                <td className="p-4 flex gap-2">
                                    <button onClick={() => openEdit(item)} className="p-2 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-blue-50"><Edit2 size={16} /></button>
                                    <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-50"><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                        {items.length === 0 && (
                            <tr>
                                <td colSpan="5" className="p-8 text-center text-gray-400">No items found. Add one to get started.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <h2 className="text-xl text-black font-bold mb-4">{editId ? 'Edit Item' : 'Add New Item'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-black mb-1">Item Name</label>
                                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full text-black border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Cement Bags" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-black mb-1">Quantity</label>
                                    <input required type="number" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} className="w-full text-black border border-gray-300 rounded-lg p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-black mb-1">Price (₹)</label>
                                    <input required type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="w-full text-black border border-gray-300 rounded-lg p-2" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-black mb-1">Low Stock Threshold</label>
                                <input required type="number" value={formData.threshold} onChange={e => setFormData({ ...formData, threshold: e.target.value })} className="w-full text-black border border-gray-300 rounded-lg p-2" />
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 text-black px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Item</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showAiModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-2xl p-6 relative shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-indigo-700">
                                <Bot size={24} /> Agentic Workflow
                            </h2>
                            <button onClick={() => setShowAiModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>

                        <div className="bg-indigo-50 px-6 py-2 text-sm font-medium text-indigo-700 border-b border-indigo-100 flex items-center gap-2">
                            {aiLoading && <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>}
                            {aiStatus}
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {aiResult.map((msg, idx) => (
                                <div key={idx} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold
                                            ${msg.type === 'analyst' ? 'bg-blue-500' :
                                                msg.type === 'procurement' ? 'bg-purple-500' :
                                                    msg.type === 'lead' ? 'bg-emerald-500' : 'bg-gray-500'}`}>
                                            {msg.type === 'analyst' ? 'A' : msg.type === 'procurement' ? 'P' : msg.type === 'lead' ? 'L' : '?'}
                                        </div>
                                        <h3 className="font-bold text-gray-900">{msg.role}</h3>
                                    </div>

                                    {msg.type === 'error' ? (
                                        <div className="text-red-500">{msg.content}</div>
                                    ) : (
                                        <div className="space-y-2 pl-10">
                                            {Array.isArray(msg.data) ? msg.data.map(item => {
                                                if (msg.type === 'analyst') return renderAnalystCard(item);
                                                if (msg.type === 'procurement') return renderProcurementCard(item);
                                                if (msg.type === 'lead') return renderLeadCard(item);
                                                return null;
                                            }) : <pre className="text-xs">{JSON.stringify(msg.data, null, 2)}</pre>}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {aiResult.length === 0 && !aiLoading && (
                                <div className="text-center text-gray-500 py-12">
                                    Ready to start analysis.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
