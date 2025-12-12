/**
 * =============================================================================
 * APPROVAL DASHBOARD PAGE
 * =============================================================================
 * Halaman untuk mengelola approval workflow
 * - View pending approvals
 * - Approve/Reject requests
 * - View approval history
 * =============================================================================
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  User,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { useRbac } from "../contexts/RbacContext";
import approvalService from "../services/approvalService";

const ApprovalDashboard = () => {
  const { hasPermission } = useRbac();
  const [activeTab, setActiveTab] = useState("pending");
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [approvalHistory, setApprovalHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [historyFilter, setHistoryFilter] = useState({ status: "", type: "" });
  const [historyPagination, setHistoryPagination] = useState({
    page: 1,
    totalPages: 1,
  });

  // Modal states
  const [approveModal, setApproveModal] = useState({
    open: false,
    approval: null,
  });
  const [rejectModal, setRejectModal] = useState({
    open: false,
    approval: null,
  });
  const [actionLoading, setActionLoading] = useState(false);

  // Check permission
  const canApprove = hasPermission("approve_workflow");

  // Fetch data
  const fetchPendingApprovals = useCallback(async () => {
    try {
      const response = await approvalService.getMyPendingApprovals();
      if (response.success) {
        setPendingApprovals(response.data.approvals || []);
      }
    } catch (err) {
      console.error("Failed to fetch pending approvals:", err);
    }
  }, []);

  const fetchApprovalHistory = useCallback(
    async (page = 1) => {
      try {
        const response = await approvalService.getApprovalHistory({
          ...historyFilter,
          page,
          limit: 20,
        });
        if (response.success) {
          setApprovalHistory(response.data.approvals || []);
          setHistoryPagination({
            page: response.data.pagination?.page || 1,
            totalPages: response.data.pagination?.totalPages || 1,
          });
        }
      } catch (err) {
        console.error("Failed to fetch approval history:", err);
      }
    },
    [historyFilter]
  );

  const fetchStats = useCallback(async () => {
    try {
      const response = await approvalService.getApprovalStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchPendingApprovals(),
        fetchApprovalHistory(),
        fetchStats(),
      ]);
    } catch (err) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [fetchPendingApprovals, fetchApprovalHistory, fetchStats]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle approve
  const handleApprove = async (approval, comments = "") => {
    setActionLoading(true);
    try {
      await approvalService.approveRequest(approval.id, { comments });
      setApproveModal({ open: false, approval: null });
      await fetchPendingApprovals();
      await fetchStats();
    } catch (err) {
      alert(
        "Failed to approve: " + (err.response?.data?.message || err.message)
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Handle reject
  const handleReject = async (approval, reason) => {
    if (!reason?.trim()) {
      alert("Rejection reason is required");
      return;
    }
    setActionLoading(true);
    try {
      await approvalService.rejectRequest(approval.id, { reason });
      setRejectModal({ open: false, approval: null });
      await fetchPendingApprovals();
      await fetchStats();
    } catch (err) {
      alert(
        "Failed to reject: " + (err.response?.data?.message || err.message)
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Filter pending approvals by search
  const filteredPending = pendingApprovals.filter(
    (approval) =>
      approval.task?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      approval.requester?.full_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  // Priority badge
  const PriorityBadge = ({ priority }) => {
    const colors = {
      urgent: "bg-red-100 text-red-800",
      high: "bg-orange-100 text-orange-800",
      normal: "bg-blue-100 text-blue-800",
      low: "bg-gray-100 text-gray-800",
    };
    return (
      <span
        className={`px-2 py-0.5 text-xs font-medium rounded ${
          colors[priority] || colors.normal
        }`}
      >
        {priority?.toUpperCase()}
      </span>
    );
  };

  // Status badge
  const StatusBadge = ({ status }) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
    };
    const icons = {
      pending: <Clock size={12} className="mr-1" />,
      approved: <CheckCircle size={12} className="mr-1" />,
      rejected: <XCircle size={12} className="mr-1" />,
      cancelled: <XCircle size={12} className="mr-1" />,
    };
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${
          colors[status] || colors.pending
        }`}
      >
        {icons[status]}
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  if (!canApprove) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-yellow-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">
          Access Denied
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          You don't have permission to access the approval dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Approval Dashboard</h1>
        <p className="text-gray-500">Manage task approval requests</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.pending || 0}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.approved || 0}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Rejected</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.rejected || 0}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.total || 0}
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-400" />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab("pending")}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === "pending"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Pending Approvals
              {pendingApprovals.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                  {pendingApprovals.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === "history"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              History
            </button>
          </nav>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {activeTab === "history" && (
            <>
              <select
                value={historyFilter.status}
                onChange={(e) =>
                  setHistoryFilter({ ...historyFilter, status: e.target.value })
                }
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Status</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                value={historyFilter.type}
                onChange={(e) =>
                  setHistoryFilter({ ...historyFilter, type: e.target.value })
                }
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Types</option>
                <option value="task_creation">Task Creation</option>
                <option value="task_update">Task Update</option>
                <option value="qa_approval">QA Approval</option>
                <option value="deployment">Deployment</option>
              </select>
            </>
          )}

          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-indigo-500" />
              <p className="mt-2 text-gray-500">Loading...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-8 w-8 mx-auto text-red-500" />
              <p className="mt-2 text-red-500">{error}</p>
            </div>
          ) : activeTab === "pending" ? (
            filteredPending.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 mx-auto text-green-400" />
                <p className="mt-2 text-gray-500">No pending approvals</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPending.map((approval) => (
                  <div
                    key={approval.id}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <div
                      className="p-4 bg-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-100"
                      onClick={() =>
                        setExpandedId(
                          expandedId === approval.id ? null : approval.id
                        )
                      }
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {approval.task?.title}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {approval.task?.project?.name} •{" "}
                            {approval.approval_type}
                          </p>
                        </div>
                        <PriorityBadge priority={approval.priority} />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right mr-4">
                          <p className="text-sm text-gray-900">
                            {approval.requester?.full_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(
                              approval.requested_at
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        {expandedId === approval.id ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {expandedId === approval.id && (
                      <div className="p-4 border-t border-gray-200">
                        {approval.request_message && (
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-500 mb-1">
                              Request Message
                            </label>
                            <p className="text-gray-900">
                              {approval.request_message}
                            </p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">
                              Requested By
                            </label>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span>{approval.requester?.full_name}</span>
                            </div>
                          </div>
                          {approval.due_date && (
                            <div>
                              <label className="block text-sm font-medium text-gray-500 mb-1">
                                Due Date
                              </label>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span>
                                  {new Date(
                                    approval.due_date
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() =>
                              setRejectModal({ open: true, approval })
                            }
                            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-medium"
                          >
                            <XCircle className="h-4 w-4 inline mr-2" />
                            Reject
                          </button>
                          <button
                            onClick={() =>
                              setApproveModal({ open: true, approval })
                            }
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                          >
                            <CheckCircle className="h-4 w-4 inline mr-2" />
                            Approve
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          ) : /* History Tab */
          approvalHistory.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 mx-auto text-gray-400" />
              <p className="mt-2 text-gray-500">No approval history</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Task
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Requester
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {approvalHistory.map((approval) => (
                      <tr key={approval.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900">
                              {approval.task?.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {approval.task?.project?.name}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {approval.approval_type}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {approval.requester?.full_name}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={approval.status} />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(approval.updated_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {historyPagination.totalPages > 1 && (
                <div className="mt-4 flex justify-center gap-2">
                  <button
                    onClick={() =>
                      fetchApprovalHistory(historyPagination.page - 1)
                    }
                    disabled={historyPagination.page === 1}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1">
                    Page {historyPagination.page} of{" "}
                    {historyPagination.totalPages}
                  </span>
                  <button
                    onClick={() =>
                      fetchApprovalHistory(historyPagination.page + 1)
                    }
                    disabled={
                      historyPagination.page === historyPagination.totalPages
                    }
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Approve Modal */}
      {approveModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Approve Request
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to approve this request for{" "}
              <strong>{approveModal.approval?.task?.title}</strong>?
            </p>
            <textarea
              id="approve-comments"
              placeholder="Optional comments..."
              className="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:ring-2 focus:ring-green-500"
              rows="3"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setApproveModal({ open: false, approval: null })}
                disabled={actionLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const comments =
                    document.getElementById("approve-comments")?.value;
                  handleApprove(approveModal.approval, comments);
                }}
                disabled={actionLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading ? "Approving..." : "Approve"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Reject Request
            </h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting the request for{" "}
              <strong>{rejectModal.approval?.task?.title}</strong>.
            </p>
            <textarea
              id="reject-reason"
              placeholder="Reason for rejection (required)..."
              className="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:ring-2 focus:ring-red-500"
              rows="3"
              required
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setRejectModal({ open: false, approval: null })}
                disabled={actionLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const reason =
                    document.getElementById("reject-reason")?.value;
                  handleReject(rejectModal.approval, reason);
                }}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? "Rejecting..." : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalDashboard;
