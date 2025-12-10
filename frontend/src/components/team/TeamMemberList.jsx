import React, { useState, useEffect } from "react";
import {
  X,
  Search,
  UserPlus,
  Crown,
  Shield,
  User,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { teamService } from "../../services/teamService";
import Button from "../common/Button";
import Input from "../common/Input";
import toast from "react-hot-toast";

const TeamMemberList = ({ team, onUpdate, editable = true }) => {
  const [members, setMembers] = useState(team?.teamMembers || []);
  const [showAddModal, setShowAddModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  useEffect(() => {
    if (team?.teamMembers) {
      setMembers(team.teamMembers);
    }
  }, [team]);

  // Search available users
  const searchUsers = async (query) => {
    if (!team?.id) return;
    try {
      const result = await teamService.getAvailableUsers(team.id, query);
      if (result.success) {
        setAvailableUsers(result.data.users);
      }
    } catch (error) {
      console.error("Error searching users:", error);
    }
  };

  useEffect(() => {
    if (showAddModal) {
      searchUsers(searchQuery);
    }
  }, [showAddModal, searchQuery]);

  // Add member
  const handleAddMember = async (userId) => {
    try {
      setLoading(true);
      const result = await teamService.addMember(team.id, { user_id: userId });
      if (result.success) {
        toast.success("Anggota berhasil ditambahkan");
        setMembers([...members, result.data.member]);
        setAvailableUsers(availableUsers.filter((u) => u.id !== userId));
        onUpdate?.();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal menambahkan anggota");
    } finally {
      setLoading(false);
    }
  };

  // Update member role
  const handleUpdateRole = async (userId, role) => {
    try {
      const result = await teamService.updateMember(team.id, userId, { role });
      if (result.success) {
        toast.success("Role berhasil diperbarui");
        setMembers(
          members.map((m) => (m.user_id === userId ? { ...m, role } : m))
        );
        setEditingMember(null);
        onUpdate?.();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal memperbarui role");
    }
  };

  // Remove member
  const handleRemoveMember = async (userId) => {
    if (!confirm("Apakah Anda yakin ingin menghapus anggota ini dari tim?"))
      return;

    try {
      const result = await teamService.removeMember(team.id, userId);
      if (result.success) {
        toast.success("Anggota berhasil dihapus");
        setMembers(members.filter((m) => m.user_id !== userId));
        onUpdate?.();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal menghapus anggota");
    }
  };

  // Role icon
  const getRoleIcon = (role) => {
    switch (role) {
      case "lead":
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case "admin":
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <User className="w-4 h-4 text-gray-400" />;
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case "lead":
        return "Team Lead";
      case "admin":
        return "Admin";
      default:
        return "Member";
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Anggota Tim ({members.length})
        </h3>
        {editable && (
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <UserPlus className="w-4 h-4 mr-1" />
            Tambah Anggota
          </Button>
        )}
      </div>

      {/* Members List */}
      <div className="divide-y divide-gray-100 dark:divide-dark-border">
        {members.length === 0 ? (
          <p className="text-center py-8 text-gray-500 dark:text-gray-400">
            Belum ada anggota dalam tim ini
          </p>
        ) : (
          members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between py-3"
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
                  {member.user?.avatar_url ? (
                    <img
                      src={`${
                        import.meta.env.VITE_API_URL?.replace("/api", "") ||
                        "http://localhost:5000"
                      }/${member.user.avatar_url}`}
                      alt={member.user.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 dark:text-gray-300 font-medium">
                      {member.user?.full_name?.charAt(0) || "?"}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {member.user?.full_name}
                    </span>
                    {getRoleIcon(member.role)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>@{member.user?.username}</span>
                    {member.position && (
                      <>
                        <span>•</span>
                        <span>{member.position}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              {editable && (
                <div className="flex items-center gap-2">
                  {/* Role Selector */}
                  <div className="relative">
                    <button
                      onClick={() =>
                        setEditingMember(
                          editingMember === member.id ? null : member.id
                        )
                      }
                      className="flex items-center gap-1 px-2 py-1 text-sm bg-gray-100 dark:bg-dark-border rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                      {getRoleLabel(member.role)}
                      <ChevronDown className="w-3 h-3" />
                    </button>

                    {editingMember === member.id && (
                      <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-dark-card rounded-lg shadow-lg border border-gray-200 dark:border-dark-border py-1 z-10">
                        {["member", "admin", "lead"].map((role) => (
                          <button
                            key={role}
                            onClick={() =>
                              handleUpdateRole(member.user_id, role)
                            }
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-dark-border flex items-center gap-2 ${
                              member.role === role
                                ? "bg-gray-50 dark:bg-dark-border"
                                : ""
                            }`}
                          >
                            {getRoleIcon(role)}
                            {getRoleLabel(role)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveMember(member.user_id)}
                    className="p-1 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Hapus dari tim"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl w-full max-w-md mx-4">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-border">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Tambah Anggota
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSearchQuery("");
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-dark-border rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari user..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* User List */}
            <div className="max-h-64 overflow-y-auto px-4 pb-4">
              {availableUsers.length === 0 ? (
                <p className="text-center py-4 text-gray-500 dark:text-gray-400">
                  {searchQuery
                    ? "Tidak ada user ditemukan"
                    : "Semua user sudah menjadi anggota"}
                </p>
              ) : (
                <div className="space-y-2">
                  {availableUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-dark-border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
                          {user.avatar_url ? (
                            <img
                              src={`${
                                import.meta.env.VITE_API_URL?.replace(
                                  "/api",
                                  ""
                                ) || "http://localhost:5000"
                              }/${user.avatar_url}`}
                              alt={user.full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm">
                              {user.full_name?.charAt(0) || "?"}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">
                            {user.full_name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            @{user.username}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleAddMember(user.id)}
                        disabled={loading}
                      >
                        <UserPlus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamMemberList;
