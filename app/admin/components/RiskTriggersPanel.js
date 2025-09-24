'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { AlertTriangle, TrendingDown, Activity, Settings, Bell, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function RiskTriggersPanel({ adminId }) {
  const [thresholds, setThresholds] = useState({
    drawdownPercent: 5,
    exposurePercent: 15,
    dailyLossPercent: 5,
    maxTradesPerDay: 50,
    alertEmail: 'admin@polyprop.com'
  });

  // Fetch current risk triggers
  const { data: riskTriggers, error, isLoading, mutate } = useSWR(
    '/api/risk-triggers',
    fetcher,
    { refreshInterval: 30000 }
  );

  // Fetch active alerts
  const { data: activeAlerts, error: alertsError, isLoading: alertsLoading, mutate: mutateAlerts } = useSWR(
    '/api/risk-alerts',
    fetcher,
    { refreshInterval: 15000 } // Refresh every 15 seconds for alerts
  );

  const handleThresholdChange = (key, value) => {
    setThresholds(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveThresholds = async () => {
    try {
      const response = await fetch('/api/risk-triggers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId,
          thresholds
        })
      });

      if (response.ok) {
        toast.success('Risk thresholds updated successfully!');
        mutate();
      } else {
        toast.error('Failed to update thresholds');
      }
    } catch (error) {
      toast.error('Error updating thresholds');
    }
  };

  const handleDismissAlert = async (alertId) => {
    try {
      const response = await fetch('/api/risk-alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertId,
          action: 'dismiss',
          adminId
        })
      });

      if (response.ok) {
        toast.success('Alert dismissed');
        mutateAlerts();
      } else {
        toast.error('Failed to dismiss alert');
      }
    } catch (error) {
      toast.error('Error dismissing alert');
    }
  };

  const handleAcknowledgeAlert = async (alertId) => {
    try {
      const response = await fetch('/api/risk-alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertId,
          action: 'acknowledge',
          adminId
        })
      });

      if (response.ok) {
        toast.success('Alert acknowledged');
        mutateAlerts();
      } else {
        toast.error('Failed to acknowledge alert');
      }
    } catch (error) {
      toast.error('Error acknowledging alert');
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'high':
        return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'low':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5" />;
      case 'high':
        return <TrendingDown className="w-5 h-5" />;
      case 'medium':
        return <AlertCircle className="w-5 h-5" />;
      case 'low':
        return <Bell className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
        <h3 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6" />
          Risk Triggers & Alerts
        </h3>
        <p className="text-slate-400">
          Configure automatic risk monitoring thresholds and manage active alerts
        </p>
      </div>

      {/* Active Alerts */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Active Alerts
        </h4>

        {alertsLoading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-slate-700/50 rounded-lg"></div>
            ))}
          </div>
        ) : activeAlerts?.alerts?.length > 0 ? (
          <div className="space-y-3">
            {activeAlerts.alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getSeverityIcon(alert.severity)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white">{alert.title}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-slate-300 text-sm mb-2">{alert.message}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span>User: {alert.userEmail || alert.userId}</span>
                        <span>{new Date(alert.createdAt).toLocaleString()}</span>
                        {alert.triggeredAt && (
                          <span>Triggered: {new Date(alert.triggeredAt).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleAcknowledgeAlert(alert.id)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                    >
                      Acknowledge
                    </button>
                    <button
                      onClick={() => handleDismissAlert(alert.id)}
                      className="px-3 py-1 bg-slate-600 hover:bg-slate-700 text-white text-sm rounded transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No active risk alerts</p>
            <p className="text-sm">All systems operating within safe parameters</p>
          </div>
        )}
      </div>

      {/* Risk Threshold Configuration */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Risk Threshold Configuration
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Maximum Drawdown (%)
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={thresholds.drawdownPercent}
              onChange={(e) => handleThresholdChange('drawdownPercent', parseFloat(e.target.value))}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-400 mt-1">
              Auto-close positions if drawdown exceeds this percentage
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Maximum Exposure (%)
            </label>
            <input
              type="number"
              min="5"
              max="50"
              value={thresholds.exposurePercent}
              onChange={(e) => handleThresholdChange('exposurePercent', parseFloat(e.target.value))}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-400 mt-1">
              Block new trades if exposure exceeds this percentage of balance
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Daily Loss Limit (%)
            </label>
            <input
              type="number"
              min="1"
              max="15"
              value={thresholds.dailyLossPercent}
              onChange={(e) => handleThresholdChange('dailyLossPercent', parseFloat(e.target.value))}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-400 mt-1">
              Daily loss limit before restricting trading
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Max Trades Per Day
            </label>
            <input
              type="number"
              min="10"
              max="200"
              value={thresholds.maxTradesPerDay}
              onChange={(e) => handleThresholdChange('maxTradesPerDay', parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-400 mt-1">
              Maximum trades allowed per day per user
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Alert Email
            </label>
            <input
              type="email"
              value={thresholds.alertEmail}
              onChange={(e) => handleThresholdChange('alertEmail', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-400 mt-1">
              Email address for critical risk alerts
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSaveThresholds}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Save Thresholds
          </button>
        </div>
      </div>

      {/* Recent Risk Events */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Recent Risk Events
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-2 px-4 text-slate-400 font-medium">Event</th>
                <th className="text-left py-2 px-4 text-slate-400 font-medium">User</th>
                <th className="text-left py-2 px-4 text-slate-400 font-medium">Type</th>
                <th className="text-left py-2 px-4 text-slate-400 font-medium">Value</th>
                <th className="text-left py-2 px-4 text-slate-400 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {(activeAlerts?.recentEvents || []).map((event, index) => (
                <tr key={index} className="border-b border-slate-700/50">
                  <td className="py-3 px-4 text-white">{event.description}</td>
                  <td className="py-3 px-4 text-slate-300">{event.userEmail || event.userId}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(event.type)}`}>
                      {event.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{event.value}</td>
                  <td className="py-3 px-4 text-slate-400">
                    {new Date(event.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
              {(activeAlerts?.recentEvents || []).length === 0 && (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400">
                    No recent risk events
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
