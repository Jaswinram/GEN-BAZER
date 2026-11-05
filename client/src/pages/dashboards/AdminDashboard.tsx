import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  Package,
  ShoppingBag,
  TrendingUp,
  Wrench,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
} from 'lucide-react';
import api from '../../services/api';
import { User, PlatformReport } from '../../types';
import { formatINR } from '../../utils/currency';
import { Badge } from '../../components/Badge';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<PlatformReport[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      const [statsRes, usersRes, repRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/reports'),
      ]);
      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (usersRes.data.success) setUsers(usersRes.data.users);
      if (repRes.data.success) setReports(repRes.data.reports);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const res = await api.patch(`/admin/users/${userId}/status`, { status: nextStatus });
      if (res.data.success) {
        setUsers(users.map((u) => (u._id === userId ? { ...u, status: nextStatus } : u)));
      }
    } catch (err) {
      console.error('Failed to update user status:', err);
    }
  };

  const handleResolveReport = async (reportId: string, status: string) => {
    try {
      const res = await api.patch(`/admin/reports/${reportId}`, {
        status,
        adminNotes: 'Resolved by Administrator after inspection.',
      });
      if (res.data.success) {
        setReports(reports.map((r) => (r._id === reportId ? res.data.report : r)));
      }
    } catch (err) {
      console.error('Failed to resolve report:', err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="h-96 bg-stone-100 rounded-3xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-stone-200">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-stone-900 text-white uppercase">
            Platform Master Console
          </span>
          <Badge variant="green" size="sm">System Operational</Badge>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight mt-1">
          Gen Baazar Administration & Compliance
        </h1>
        <p className="text-xs text-stone-500">
          Server-side role verification, user account moderation, marketplace liquidity, and complaint tracking.
        </p>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-[11px] text-stone-500 font-semibold uppercase">Total Users</div>
          <div className="text-2xl font-black text-stone-900 mt-1">{stats?.totalUsers || 0}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-[11px] text-stone-500 font-semibold uppercase">Products</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{stats?.totalProducts || 0}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-[11px] text-stone-500 font-semibold uppercase">Orders</div>
          <div className="text-2xl font-black text-blue-700 mt-1">{stats?.totalOrders || 0}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-[11px] text-stone-500 font-semibold uppercase">Gross Sales (INR)</div>
          <div className="text-xl font-black text-emerald-800 mt-1">{formatINR(stats?.totalSalesINR || 0)}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-[11px] text-stone-500 font-semibold uppercase">Fleet Machinery</div>
          <div className="text-2xl font-black text-amber-700 mt-1">{stats?.totalMachinery || 0}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-[11px] text-stone-500 font-semibold uppercase">Open Reports</div>
          <div className="text-2xl font-black text-rose-600 mt-1">{stats?.openReports || 0}</div>
        </div>
      </div>

      {/* Users By Role Breakdown */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 space-y-4">
        <h2 className="text-base font-bold text-stone-900">Ecosystem Stakeholder Breakdown</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          {stats?.usersByRole &&
            Object.entries(stats.usersByRole).map(([role, count]) => (
              <div key={role} className="p-3 bg-stone-50 rounded-xl border border-stone-100">
                <div className="text-stone-500 capitalize font-medium">{role.replace('_', ' ')}</div>
                <div className="text-lg font-black text-stone-900 mt-0.5">{String(count)}</div>
              </div>
            ))}
        </div>
      </div>

      {/* Reported Listings & Complaints Moderation */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-bold text-stone-900">Marketplace Moderation & Complaints</h2>
          </div>
          <span className="text-xs text-stone-500">{reports.length} Reports Logged</span>
        </div>

        {reports.length === 0 ? (
          <div className="text-center py-6 text-stone-400 text-xs">
            No complaints or reported listings found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 font-bold uppercase text-[11px]">
                  <th className="py-2 px-3">Reported Entity</th>
                  <th className="py-2 px-3">Reason</th>
                  <th className="py-2 px-3">Reporter</th>
                  <th className="py-2 px-3">Details</th>
                  <th className="py-2 px-3 text-center">Status</th>
                  <th className="py-2 px-3 text-right">Moderation Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {reports.map((rep) => (
                  <tr key={rep._id} className="hover:bg-stone-50">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-stone-900">{rep.targetTitle}</div>
                      <div className="text-[10px] text-stone-400 capitalize">{rep.targetType} (ID: {rep.targetId.slice(-6)})</div>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-stone-800">{rep.reason}</td>
                    <td className="py-2.5 px-3 text-stone-600">{rep.reporterName}</td>
                    <td className="py-2.5 px-3 text-stone-500 max-w-xs truncate">{rep.details || 'None provided'}</td>
                    <td className="py-2.5 px-3 text-center">
                      <Badge variant={rep.status === 'resolved' ? 'green' : rep.status === 'open' ? 'red' : 'amber'} size="sm">
                        {rep.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-right space-x-1">
                      {rep.status === 'open' && (
                        <>
                          <button
                            onClick={() => handleResolveReport(rep._id, 'resolved')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold"
                          >
                            Resolve
                          </button>
                          <button
                            onClick={() => handleResolveReport(rep._id, 'dismissed')}
                            className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-[11px] font-semibold"
                          >
                            Dismiss
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Platform Users Table with Suspend / Reactivate controls */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 space-y-4">
        <h2 className="text-base font-bold text-stone-900">User Account Management & Roles</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 text-stone-500 font-bold uppercase text-[11px]">
                <th className="py-2.5 px-3">User</th>
                <th className="py-2.5 px-3">Email</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">District</th>
                <th className="py-2.5 px-3 text-center">Account Status</th>
                <th className="py-2.5 px-3 text-right">Access Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-stone-50">
                  <td className="py-3 px-3">
                    <div className="font-bold text-stone-900">{u.name}</div>
                    <div className="text-[11px] text-stone-400">{u.phone}</div>
                  </td>
                  <td className="py-3 px-3 font-mono text-stone-700">{u.email}</td>
                  <td className="py-3 px-3">
                    <span className="capitalize font-semibold text-stone-800">
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-stone-600">{u.location?.district || 'Tamil Nadu'}</td>
                  <td className="py-3 px-3 text-center">
                    <Badge variant={u.status === 'active' ? 'green' : 'red'} size="sm">
                      {u.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 text-right">
                    {u.role !== 'admin' && (
                      <button
                        onClick={() => handleToggleUserStatus(u._id, u.status)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                          u.status === 'active'
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {u.status === 'active' ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                        <span>{u.status === 'active' ? 'Suspend' : 'Reactivate'}</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

