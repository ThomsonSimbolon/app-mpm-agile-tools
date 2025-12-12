/**
 * =============================================================================
 * LEAVE MANAGEMENT PAGE
 * =============================================================================
 * Halaman untuk mengelola cuti dan delegasi tugas
 * - Submit leave requests
 * - View leave history
 * - Manage task delegations
 * - Approve/reject leave requests (for managers)
 * =============================================================================
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Clock,
  User,
  Users,
  ArrowRight,
  CheckCircle,
  XCircle,
  RefreshCw,
  Plus,
  Search,
  AlertTriangle,
  Briefcase,
  Home,
  BookOpen,
  Coffee,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useRbac } from "../contexts/RbacContext";
import { useAuth } from "../contexts/AuthContext";
import leaveService from "../services/leaveService";
import { userService } from "../services/userService";

const LeaveManagement = () => {
  const { hasPermission } = useRbac();
  const { user: currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState("my-leaves");
  const [myLeaves, setMyLeaves] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [allLeaves, setAllLeaves] = useState([]);
  const [myDelegations, setMyDelegations] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [createModal, setCreateModal] = useState(false);
  const [rejectModal, setRejectModal] = useState({ open: false, leave: null });
  const [actionLoading, setActionLoading] = useState(false);

  // Create form
  const [createForm, setCreateForm] = useState({
    leave_type: "annual",
    start_date: "",
    end_date: "",
    delegate_id: "",
    reason: "",
    auto_delegate_tasks: true,
    return_tasks_after: true,
    contact_info: "",
    notes: "",
  });

  // Permissions
  const canManageLeaves = hasPermission("manage_leave_delegation");

  // Fetch data
  const fetchMyLeaves = useCallback(async () => {
    try {
      const response = await leaveService.getMyLeaves();
      if (response.success) {
        setMyLeaves(response.data.leaves || []);
      }
    } catch (err) {
      console.error("Failed to fetch my leaves:", err);
    }
  }, []);

  const fetchPendingLeaves = useCallback(async () => {
    if (!canManageLeaves) return;
    try {
      const response = await leaveService.getPendingLeaves();
      if (response.success) {
        setPendingLeaves(response.data.leaves || []);
      }
    } catch (err) {
      console.error("Failed to fetch pending leaves:", err);
    }
  }, [canManageLeaves]);

  const fetchAllLeaves = useCallback(async () => {
    if (!canManageLeaves) return;
    try {
      const response = await leaveService.getAllLeaves({ limit: 50 });
      if (response.success) {
        setAllLeaves(response.data.leaves || []);
      }
    } catch (err) {
      console.error("Failed to fetch all leaves:", err);
    }
  }, [canManageLeaves]);

  const fetchMyDelegations = useCallback(async () => {
    try {
      const response = await leaveService.getMyDelegations();
      if (response.success) {
        setMyDelegations(response.data.delegations || []);
      }
    } catch (err) {
      console.error("Failed to fetch delegations:", err);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await userService.getAll();
      if (response.success) {
        setUsers(response.data.users || []);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchMyLeaves(),
        fetchPendingLeaves(),
        fetchAllLeaves(),
        fetchMyDelegations(),
        fetchUsers(),
      ]);
    } catch (err) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [
    fetchMyLeaves,
    fetchPendingLeaves,
    fetchAllLeaves,
    fetchMyDelegations,
    fetchUsers,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle create leave
  const handleCreateLeave = async (e) => {
    e.preventDefault();
    if (!createForm.start_date || !createForm.end_date) {
      alert("Start date and end date are required");
      return;
    }

    setActionLoading(true);
    try {
      const data = {
        ...createForm,
        delegate_id: createForm.delegate_id || null,
      };
      await leaveService.createLeave(data);
      setCreateModal(false);
      setCreateForm({
        leave_type: "annual",
        start_date: "",
        end_date: "",
        delegate_id: "",
        reason: "",
        auto_delegate_tasks: true,
        return_tasks_after: true,
        contact_info: "",
        notes: "",
      });
      await fetchMyLeaves();
    } catch (err) {
      alert(
        "Failed to create leave request: " +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Handle cancel leave
  const handleCancelLeave = async (leave) => {
    if (!confirm("Are you sure you want to cancel this leave request?")) return;

    try {
      await leaveService.cancelLeave(leave.id);
      await fetchMyLeaves();
    } catch (err) {
      alert(
        "Failed to cancel leave: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  // Handle approve leave
  const handleApproveLeave = async (leave) => {
    if (!confirm("Are you sure you want to approve this leave request?"))
      return;

    try {
      await leaveService.approveLeave(leave.id);
      await Promise.all([fetchPendingLeaves(), fetchAllLeaves()]);
    } catch (err) {
      alert(
        "Failed to approve leave: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  // Handle reject leave
  const handleRejectLeave = async (leave, reason) => {
    if (!reason?.trim()) {
      alert("Rejection reason is required");
      return;
    }

    setActionLoading(true);
    try {
      await leaveService.rejectLeave(leave.id, { reason });
      setRejectModal({ open: false, leave: null });
      await Promise.all([fetchPendingLeaves(), fetchAllLeaves()]);
    } catch (err) {
      alert(
        "Failed to reject leave: " +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Leave type icon
  const LeaveTypeIcon = ({ type }) => {
    const icons = {
      annual: <Calendar className="h-4 w-4" />,
      sick: <AlertTriangle className="h-4 w-4" />,
      personal: <User className="h-4 w-4" />,
      wfh: <Home className="h-4 w-4" />,
      training: <BookOpen className="h-4 w-4" />,
      other: <Coffee className="h-4 w-4" />,
    };
    return icons[type] || icons.other;
  };

  // Status badge
  const StatusBadge = ({ status }) => {
    const info = leaveService.getLeaveStatusInfo(status);
    const colorClasses = {
      yellow: "bg-yellow-100 text-yellow-800",
      green: "bg-green-100 text-green-800",
      red: "bg-red-100 text-red-800",
      blue: "bg-blue-100 text-blue-800",
      gray: "bg-gray-100 text-gray-800",
    };
    return (
      <span
        className={`px-2 py-0.5 text-xs font-medium rounded ${
          colorClasses[info.color]
        }`}
      >
        {info.label}
      </span>
    );
  };

  // Leave card component
  const LeaveCard = ({
    leave,
    showUser = false,
    showActions = false,
    isOwner = false,
  }) => (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <LeaveTypeIcon type={leave.leave_type} />
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {leaveService.getLeaveTypeLabel(leave.leave_type)}
            </p>
            {showUser && leave.user && (
              <p className="text-sm text-gray-500">{leave.user.full_name}</p>
            )}
            <p className="text-sm text-gray-500">
              {new Date(leave.start_date).toLocaleDateString()} -{" "}
              {new Date(leave.end_date).toLocaleDateString()}
            </p>
          </div>
        </div>
        <StatusBadge status={leave.status} />
      </div>

      {leave.reason && (
        <p className="mt-3 text-sm text-gray-600">{leave.reason}</p>
      )}

      {leave.delegate && (
        <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
          <Users className="h-4 w-4" />
          <span>Delegate: {leave.delegate.full_name}</span>
        </div>
      )}

      {/* Actions */}
      {(showActions || isOwner) && leave.status === "pending" && (
        <div className="mt-4 flex justify-end gap-2">
          {isOwner && (
            <button
              onClick={() => handleCancelLeave(leave)}
              className="px-3 py-1.5 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
          {showActions && canManageLeaves && (
            <>
              <button
                onClick={() => setRejectModal({ open: true, leave })}
                className="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
              >
                Reject
              </button>
              <button
                onClick={() => handleApproveLeave(leave)}
                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Approve
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Leave & Delegation
          </h1>
          <p className="text-gray-500">
            Manage your leave requests and task delegations
          </p>
        </div>
        <button
          onClick={() => setCreateModal(true)}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Request Leave
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px overflow-x-auto">
            <button
              onClick={() => setActiveTab("my-leaves")}
              className={`py-4 px-6 text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === "my-leaves"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              My Leaves
            </button>
            <button
              onClick={() => setActiveTab("delegations")}
              className={`py-4 px-6 text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === "delegations"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Delegations
              {myDelegations.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {myDelegations.length}
                </span>
              )}
            </button>
            {canManageLeaves && (
              <>
                <button
                  onClick={() => setActiveTab("pending")}
                  className={`py-4 px-6 text-sm font-medium border-b-2 whitespace-nowrap ${
                    activeTab === "pending"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Pending Approval
                  {pendingLeaves.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                      {pendingLeaves.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("all")}
                  className={`py-4 px-6 text-sm font-medium border-b-2 whitespace-nowrap ${
                    activeTab === "all"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  All Leaves
                </button>
              </>
            )}
          </nav>
        </div>

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
          ) : (
            <>
              {/* My Leaves Tab */}
              {activeTab === "my-leaves" &&
                (myLeaves.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 mx-auto text-gray-400" />
                    <p className="mt-2 text-gray-500">No leave requests yet</p>
                    <button
                      onClick={() => setCreateModal(true)}
                      className="mt-4 text-indigo-600 hover:text-indigo-700"
                    >
                      Request your first leave
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {myLeaves.map((leave) => (
                      <LeaveCard key={leave.id} leave={leave} isOwner={true} />
                    ))}
                  </div>
                ))}

              {/* Delegations Tab */}
              {activeTab === "delegations" &&
                (myDelegations.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-gray-400" />
                    <p className="mt-2 text-gray-500">No active delegations</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myDelegations.map((delegation) => (
                      <div
                        key={delegation.id}
                        className="border border-gray-200 rounded-lg p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Briefcase className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {delegation.task?.title}
                            </p>
                            <p className="text-sm text-gray-500">
                              {delegation.originalAssignee?.full_name}
                              <ArrowRight className="inline h-3 w-3 mx-2" />
                              {delegation.delegate?.full_name}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className={`px-2 py-1 text-xs rounded ${
                              delegation.status === "active"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {delegation.status}
                          </span>
                          {delegation.leave && (
                            <p className="text-xs text-gray-500 mt-1">
                              Until{" "}
                              {new Date(
                                delegation.leave.end_date
                              ).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}

              {/* Pending Approval Tab */}
              {activeTab === "pending" &&
                canManageLeaves &&
                (pendingLeaves.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 mx-auto text-green-400" />
                    <p className="mt-2 text-gray-500">
                      No pending leave requests
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingLeaves.map((leave) => (
                      <LeaveCard
                        key={leave.id}
                        leave={leave}
                        showUser={true}
                        showActions={true}
                      />
                    ))}
                  </div>
                ))}

              {/* All Leaves Tab */}
              {activeTab === "all" &&
                canManageLeaves &&
                (allLeaves.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 mx-auto text-gray-400" />
                    <p className="mt-2 text-gray-500">No leave records</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Employee
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Type
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Duration
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Delegate
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {allLeaves.map((leave) => (
                          <tr key={leave.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <p className="font-medium text-gray-900">
                                {leave.user?.full_name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {leave.user?.email}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <LeaveTypeIcon type={leave.leave_type} />
                                {leaveService.getLeaveTypeLabel(
                                  leave.leave_type
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {new Date(leave.start_date).toLocaleDateString()}{" "}
                              - {new Date(leave.end_date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={leave.status} />
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {leave.delegate?.full_name || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
            </>
          )}
        </div>
      </div>

      {/* Create Leave Modal */}
      {createModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Request Leave
              </h3>
              <form onSubmit={handleCreateLeave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Leave Type
                  </label>
                  <select
                    value={createForm.leave_type}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        leave_type: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="annual">Annual Leave</option>
                    <option value="sick">Sick Leave</option>
                    <option value="personal">Personal Leave</option>
                    <option value="wfh">Work From Home</option>
                    <option value="training">Training</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={createForm.start_date}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          start_date: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date *
                    </label>
                    <input
                      type="date"
                      value={createForm.end_date}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          end_date: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delegate To
                  </label>
                  <select
                    value={createForm.delegate_id}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        delegate_id: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select delegate (optional)</option>
                    {users
                      .filter(
                        (u) => u.id !== currentUser?.id && u.status === "active"
                      )
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.full_name} ({u.email})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason
                  </label>
                  <textarea
                    value={createForm.reason}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, reason: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                    rows="2"
                    placeholder="Brief reason for leave..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={createForm.auto_delegate_tasks}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          auto_delegate_tasks: e.target.checked,
                        })
                      }
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">
                      Automatically delegate my tasks to the selected person
                    </span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={createForm.return_tasks_after}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          return_tasks_after: e.target.checked,
                        })
                      }
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">
                      Return tasks to me after leave ends
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Info (Optional)
                  </label>
                  <input
                    type="text"
                    value={createForm.contact_info}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        contact_info: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                    placeholder="Emergency contact during leave..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setCreateModal(false)}
                    disabled={actionLoading}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {actionLoading ? "Submitting..." : "Submit Request"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Reject Leave Request
            </h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting the leave request from{" "}
              <strong>{rejectModal.leave?.user?.full_name}</strong>.
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
                onClick={() => setRejectModal({ open: false, leave: null })}
                disabled={actionLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const reason =
                    document.getElementById("reject-reason")?.value;
                  handleRejectLeave(rejectModal.leave, reason);
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

export default LeaveManagement;
