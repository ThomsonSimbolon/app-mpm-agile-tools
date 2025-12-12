import { useState, useEffect } from "react";
import { departmentService, teamService } from "../services/teamService";
import { userService } from "../services/userService";
import { useAuth } from "../contexts/AuthContext";
import { useRbac } from "../contexts/RbacContext";
import Header from "../components/layout/Header";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import {
  Plus,
  Users,
  Building2,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  UserPlus,
  X,
  Lock,
} from "lucide-react";
import toast from "react-hot-toast";

export default function TeamManagement() {
  // Auth & RBAC context for role-based access
  const { user } = useAuth();
  const { hasPermission, hasAnyPermission, isSystemAdmin } = useRbac();

  // Permission helper functions using RBAC
  const canManageTeams = () => {
    return (
      hasAnyPermission([
        "manage_all_teams",
        "manage_team",
        "manage_team_members",
      ]) || isSystemAdmin()
    );
  };
  const canManageDepartments = () => {
    return (
      hasAnyPermission(["manage_departments", "manage_division_teams"]) ||
      isSystemAdmin()
    );
  };
  const isAdmin = () => {
    return isSystemAdmin() || user?.role === "admin";
  };

  const [teams, setTeams] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("teams"); // teams, departments

  // Modal states
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);

  // Form states
  const [teamForm, setTeamForm] = useState({
    name: "",
    description: "",
    department_id: "",
    color: "#3B82F6",
  });
  const [departmentForm, setDepartmentForm] = useState({
    name: "",
    code: "",
    description: "",
    parent_id: "",
  });

  // Member management states
  const [teamMembers, setTeamMembers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [memberSearch, setMemberSearch] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [teamsRes, deptsRes] = await Promise.all([
        teamService.getAll().catch((e) => ({ success: false, data: [] })),
        departmentService.getAll().catch((e) => ({ success: false, data: [] })),
      ]);

      // Extract teams data - handle various response formats
      let teamsData = [];
      if (teamsRes.success && teamsRes.data) {
        teamsData =
          teamsRes.data?.teams || teamsRes.data?.data || teamsRes.data;
        if (!Array.isArray(teamsData)) teamsData = [];
      }
      setTeams(teamsData);

      // Extract departments data - handle various response formats
      let deptsData = [];
      if (deptsRes.success && deptsRes.data) {
        deptsData =
          deptsRes.data?.departments || deptsRes.data?.data || deptsRes.data;
        if (!Array.isArray(deptsData)) deptsData = [];
      }
      setDepartments(deptsData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Gagal memuat data");
      setTeams([]);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  // Team handlers
  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      const result = await teamService.create(teamForm);
      if (result.success) {
        toast.success("Tim berhasil dibuat!");
        setShowTeamModal(false);
        resetTeamForm();
        loadData();
      } else {
        toast.error(result.message || "Gagal membuat tim");
      }
    } catch (error) {
      toast.error("Gagal membuat tim");
    }
  };

  const handleUpdateTeam = async (e) => {
    e.preventDefault();
    try {
      const result = await teamService.update(editingTeam.id, teamForm);
      if (result.success) {
        toast.success("Tim berhasil diperbarui!");
        setShowTeamModal(false);
        setEditingTeam(null);
        resetTeamForm();
        loadData();
      } else {
        toast.error(result.message || "Gagal memperbarui tim");
      }
    } catch (error) {
      toast.error("Gagal memperbarui tim");
    }
  };

  const handleDeleteTeam = async (team) => {
    if (!window.confirm(`Hapus tim "${team.name}"?`)) return;
    try {
      const result = await teamService.delete(team.id);
      if (result.success) {
        toast.success("Tim berhasil dihapus!");
        loadData();
      } else {
        toast.error(result.message || "Gagal menghapus tim");
      }
    } catch (error) {
      toast.error("Gagal menghapus tim");
    }
  };

  const openEditTeam = (team) => {
    setEditingTeam(team);
    setTeamForm({
      name: team.name || "",
      description: team.description || "",
      department_id: team.department_id || "",
      color: team.color || "#3B82F6",
    });
    setShowTeamModal(true);
  };

  const resetTeamForm = () => {
    setTeamForm({
      name: "",
      description: "",
      department_id: "",
      color: "#3B82F6",
    });
  };

  // Department handlers
  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    try {
      const result = await departmentService.create(departmentForm);
      if (result.success) {
        toast.success("Departemen berhasil dibuat!");
        setShowDepartmentModal(false);
        resetDepartmentForm();
        loadData();
      } else {
        toast.error(result.message || "Gagal membuat departemen");
      }
    } catch (error) {
      toast.error("Gagal membuat departemen");
    }
  };

  const handleUpdateDepartment = async (e) => {
    e.preventDefault();
    try {
      const result = await departmentService.update(
        editingDepartment.id,
        departmentForm
      );
      if (result.success) {
        toast.success("Departemen berhasil diperbarui!");
        setShowDepartmentModal(false);
        setEditingDepartment(null);
        resetDepartmentForm();
        loadData();
      } else {
        toast.error(result.message || "Gagal memperbarui departemen");
      }
    } catch (error) {
      toast.error("Gagal memperbarui departemen");
    }
  };

  const handleDeleteDepartment = async (dept) => {
    if (!window.confirm(`Hapus departemen "${dept.name}"?`)) return;
    try {
      const result = await departmentService.delete(dept.id);
      if (result.success) {
        toast.success("Departemen berhasil dihapus!");
        loadData();
      } else {
        toast.error(result.message || "Gagal menghapus departemen");
      }
    } catch (error) {
      toast.error("Gagal menghapus departemen");
    }
  };

  const openEditDepartment = (dept) => {
    setEditingDepartment(dept);
    setDepartmentForm({
      name: dept.name || "",
      code: dept.code || "",
      description: dept.description || "",
      parent_id: dept.parent_id || "",
    });
    setShowDepartmentModal(true);
  };

  const resetDepartmentForm = () => {
    setDepartmentForm({
      name: "",
      code: "",
      description: "",
      parent_id: "",
    });
  };

  // Member management handlers
  const openMemberModal = async (team) => {
    setSelectedTeam(team);
    setShowMemberModal(true);
    try {
      const [membersRes, usersRes] = await Promise.all([
        teamService.getMembers(team.id),
        userService.search(""),
      ]);
      if (membersRes.success) {
        setTeamMembers(membersRes.data?.members || membersRes.data || []);
      }
      if (usersRes.success) {
        setAvailableUsers(usersRes.data?.users || usersRes.data || []);
      }
    } catch (error) {
      console.error("Error loading members:", error);
    }
  };

  const handleAddMember = async (userId) => {
    try {
      const result = await teamService.addMember(selectedTeam.id, {
        user_id: userId,
        role: "member",
      });
      if (result.success) {
        toast.success("Anggota berhasil ditambahkan!");
        openMemberModal(selectedTeam);
        loadData();
      } else {
        toast.error(result.message || "Gagal menambahkan anggota");
      }
    } catch (error) {
      toast.error("Gagal menambahkan anggota");
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm("Hapus anggota ini dari tim?")) return;
    try {
      const result = await teamService.removeMember(selectedTeam.id, userId);
      if (result.success) {
        toast.success("Anggota berhasil dihapus!");
        openMemberModal(selectedTeam);
        loadData();
      } else {
        toast.error(result.message || "Gagal menghapus anggota");
      }
    } catch (error) {
      toast.error("Gagal menghapus anggota");
    }
  };

  const handleUpdateMemberRole = async (userId, role) => {
    try {
      const result = await teamService.updateMember(selectedTeam.id, userId, {
        role,
      });
      if (result.success) {
        toast.success("Role berhasil diperbarui!");
        openMemberModal(selectedTeam);
      } else {
        toast.error(result.message || "Gagal memperbarui role");
      }
    } catch (error) {
      toast.error("Gagal memperbarui role");
    }
  };

  // Filter data - ensure arrays
  const filteredTeams = Array.isArray(teams)
    ? teams.filter(
        (team) =>
          team.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          team.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const filteredDepartments = Array.isArray(departments)
    ? departments.filter(
        (dept) =>
          dept.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          dept.code?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Colors for teams
  const teamColors = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
    "#06B6D4",
    "#F97316",
  ];

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Manajemen Tim
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Kelola tim dan departemen organisasi
            </p>
          </div>
          <div className="flex space-x-3">
            {activeTab === "teams"
              ? canManageTeams() && (
                  <Button
                    variant="primary"
                    onClick={() => {
                      setEditingTeam(null);
                      resetTeamForm();
                      setShowTeamModal(true);
                    }}
                    className="flex items-center space-x-2"
                  >
                    <Plus size={20} />
                    <span>Tim Baru</span>
                  </Button>
                )
              : canManageDepartments() && (
                  <Button
                    variant="primary"
                    onClick={() => {
                      setEditingDepartment(null);
                      resetDepartmentForm();
                      setShowDepartmentModal(true);
                    }}
                    className="flex items-center space-x-2"
                  >
                    <Plus size={20} />
                    <span>Departemen Baru</span>
                  </Button>
                )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("teams")}
            className={`pb-3 px-1 font-medium transition-colors ${
              activeTab === "teams"
                ? "text-primary-600 border-b-2 border-primary-600"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            <Users className="inline-block mr-2" size={18} />
            Tim ({teams.length})
          </button>
          <button
            onClick={() => setActiveTab("departments")}
            className={`pb-3 px-1 font-medium transition-colors ${
              activeTab === "departments"
                ? "text-primary-600 border-b-2 border-primary-600"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            <Building2 className="inline-block mr-2" size={18} />
            Departemen ({departments.length})
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder={
                activeTab === "teams" ? "Cari tim..." : "Cari departemen..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Teams Tab */}
        {activeTab === "teams" && (
          <>
            {filteredTeams.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <Users className="mx-auto text-gray-400" size={64} />
                  <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                    Belum ada tim
                  </h3>
                  <p className="mt-2 text-gray-500 dark:text-gray-400">
                    {searchQuery
                      ? "Tim tidak ditemukan"
                      : "Mulai dengan membuat tim baru"}
                  </p>
                  {!searchQuery && canManageTeams() && (
                    <Button
                      variant="primary"
                      onClick={() => setShowTeamModal(true)}
                      className="mt-4"
                    >
                      Buat Tim
                    </Button>
                  )}
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTeams.map((team) => (
                  <Card
                    key={team.id}
                    className="h-full hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: team.color || "#3B82F6" }}
                        >
                          <Users className="text-white" size={20} />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {team.name}
                          </h3>
                          {team.department && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {team.department.name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="relative group">
                        <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                          <MoreVertical size={18} className="text-gray-400" />
                        </button>
                        <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hidden group-hover:block z-10">
                          {canManageTeams() && (
                            <button
                              onClick={() => openEditTeam(team)}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                            >
                              <Edit size={14} className="mr-2" />
                              Edit
                            </button>
                          )}
                          {canManageTeams() && (
                            <button
                              onClick={() => openMemberModal(team)}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                            >
                              <UserPlus size={14} className="mr-2" />
                              Kelola Anggota
                            </button>
                          )}
                          {isAdmin() && (
                            <button
                              onClick={() => handleDeleteTeam(team)}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center"
                            >
                              <Trash2 size={14} className="mr-2" />
                              Hapus
                            </button>
                          )}
                          {!canManageTeams() && (
                            <div className="px-4 py-2 text-sm text-gray-400 flex items-center">
                              <Lock size={14} className="mr-2" />
                              Lihat saja
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                      {team.description || "Tidak ada deskripsi"}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-2">
                        <Users size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {team.member_count || 0} anggota
                        </span>
                      </div>
                      <button
                        onClick={() => openMemberModal(team)}
                        className="text-sm text-primary-600 hover:text-primary-700"
                      >
                        Lihat Anggota
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Departments Tab */}
        {activeTab === "departments" && (
          <>
            {filteredDepartments.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <Building2 className="mx-auto text-gray-400" size={64} />
                  <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                    Belum ada departemen
                  </h3>
                  <p className="mt-2 text-gray-500 dark:text-gray-400">
                    {searchQuery
                      ? "Departemen tidak ditemukan"
                      : "Mulai dengan membuat departemen baru"}
                  </p>
                  {!searchQuery && canManageDepartments() && (
                    <Button
                      variant="primary"
                      onClick={() => setShowDepartmentModal(true)}
                      className="mt-4"
                    >
                      Buat Departemen
                    </Button>
                  )}
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDepartments.map((dept) => (
                  <Card
                    key={dept.id}
                    className="h-full hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <Building2 className="text-blue-600" size={20} />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {dept.name}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {dept.code}
                          </p>
                        </div>
                      </div>
                      <div className="relative group">
                        <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                          <MoreVertical size={18} className="text-gray-400" />
                        </button>
                        <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hidden group-hover:block z-10">
                          {canManageDepartments() ? (
                            <>
                              <button
                                onClick={() => openEditDepartment(dept)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                              >
                                <Edit size={14} className="mr-2" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteDepartment(dept)}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center"
                              >
                                <Trash2 size={14} className="mr-2" />
                                Hapus
                              </button>
                            </>
                          ) : (
                            <div className="px-4 py-2 text-sm text-gray-400 flex items-center">
                              <Lock size={14} className="mr-2" />
                              Lihat saja
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                      {dept.description || "Tidak ada deskripsi"}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                      {dept.parent && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Induk: {dept.parent.name}
                        </span>
                      )}
                      {dept.head && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Kepala: {dept.head.full_name}
                        </span>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Team Modal */}
        {showTeamModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {editingTeam ? "Edit Tim" : "Buat Tim Baru"}
                </h2>
                <button
                  onClick={() => {
                    setShowTeamModal(false);
                    setEditingTeam(null);
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <X size={20} />
                </button>
              </div>
              <form
                onSubmit={editingTeam ? handleUpdateTeam : handleCreateTeam}
                className="space-y-4"
              >
                <Input
                  label="Nama Tim"
                  value={teamForm.name}
                  onChange={(e) =>
                    setTeamForm({ ...teamForm, name: e.target.value })
                  }
                  required
                  placeholder="Masukkan nama tim"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Deskripsi
                  </label>
                  <textarea
                    value={teamForm.description}
                    onChange={(e) =>
                      setTeamForm({ ...teamForm, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Deskripsi tim (opsional)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Departemen
                  </label>
                  <select
                    value={teamForm.department_id}
                    onChange={(e) =>
                      setTeamForm({
                        ...teamForm,
                        department_id: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">-- Pilih Departemen --</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Warna Tim
                  </label>
                  <div className="flex items-center gap-2">
                    {teamColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setTeamForm({ ...teamForm, color })}
                        className={`w-8 h-8 rounded-full border-2 ${
                          teamForm.color === color
                            ? "border-gray-900 dark:border-white"
                            : "border-transparent"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex space-x-3">
                  <Button type="submit" variant="primary" className="flex-1">
                    {editingTeam ? "Simpan" : "Buat"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowTeamModal(false);
                      setEditingTeam(null);
                    }}
                    className="flex-1"
                  >
                    Batal
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Department Modal */}
        {showDepartmentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {editingDepartment
                    ? "Edit Departemen"
                    : "Buat Departemen Baru"}
                </h2>
                <button
                  onClick={() => {
                    setShowDepartmentModal(false);
                    setEditingDepartment(null);
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <X size={20} />
                </button>
              </div>
              <form
                onSubmit={
                  editingDepartment
                    ? handleUpdateDepartment
                    : handleCreateDepartment
                }
                className="space-y-4"
              >
                <Input
                  label="Nama Departemen"
                  value={departmentForm.name}
                  onChange={(e) =>
                    setDepartmentForm({
                      ...departmentForm,
                      name: e.target.value,
                    })
                  }
                  required
                  placeholder="Masukkan nama departemen"
                />
                <Input
                  label="Kode"
                  value={departmentForm.code}
                  onChange={(e) =>
                    setDepartmentForm({
                      ...departmentForm,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  required
                  placeholder="Contoh: IT, HR, FIN"
                  maxLength={20}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Deskripsi
                  </label>
                  <textarea
                    value={departmentForm.description}
                    onChange={(e) =>
                      setDepartmentForm({
                        ...departmentForm,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Deskripsi departemen (opsional)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Departemen Induk
                  </label>
                  <select
                    value={departmentForm.parent_id}
                    onChange={(e) =>
                      setDepartmentForm({
                        ...departmentForm,
                        parent_id: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">-- Tidak Ada (Root) --</option>
                    {departments
                      .filter((d) => d.id !== editingDepartment?.id)
                      .map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="flex space-x-3">
                  <Button type="submit" variant="primary" className="flex-1">
                    {editingDepartment ? "Simpan" : "Buat"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowDepartmentModal(false);
                      setEditingDepartment(null);
                    }}
                    className="flex-1"
                  >
                    Batal
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Member Modal */}
        {showMemberModal && selectedTeam && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Anggota Tim: {selectedTeam.name}
                </h2>
                <button
                  onClick={() => {
                    setShowMemberModal(false);
                    setSelectedTeam(null);
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Add Member */}
              {canManageTeams() && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tambah Anggota
                  </label>
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                    <input
                      type="text"
                      placeholder="Cari user..."
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  {memberSearch && (
                    <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-lg max-h-40 overflow-y-auto">
                      {availableUsers
                        .filter(
                          (u) =>
                            (u.full_name
                              ?.toLowerCase()
                              .includes(memberSearch.toLowerCase()) ||
                              u.username
                                ?.toLowerCase()
                                .includes(memberSearch.toLowerCase())) &&
                            !teamMembers.find((m) => m.user_id === u.id)
                        )
                        .map((user) => (
                          <button
                            key={user.id}
                            onClick={() => handleAddMember(user.id)}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between"
                          >
                            <span>
                              {user.full_name} (@{user.username})
                            </span>
                            <Plus size={16} className="text-green-500" />
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* Member List */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Anggota Saat Ini ({teamMembers.length})
                </h3>
                {teamMembers.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    Belum ada anggota
                  </p>
                ) : (
                  <div className="space-y-2">
                    {teamMembers.map((member) => (
                      <div
                        key={member.user_id || member.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                            <span className="text-primary-600 font-medium text-sm">
                              {(
                                member.user?.full_name ||
                                member.full_name ||
                                "U"
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {member.user?.full_name || member.full_name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              @{member.user?.username || member.username}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {canManageTeams() ? (
                            <>
                              <select
                                value={member.role || "member"}
                                onChange={(e) =>
                                  handleUpdateMemberRole(
                                    member.user_id || member.id,
                                    e.target.value
                                  )
                                }
                                className="text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                              >
                                {/* Team Level Roles - RBAC compliant */}
                                <option value="member">Member</option>
                                <option value="team_lead">Team Lead</option>
                                <option value="team_admin">Team Admin</option>
                                <option value="scrum_master">
                                  Scrum Master
                                </option>
                                <option value="product_owner">
                                  Product Owner
                                </option>
                                <option value="qa_lead">QA Lead</option>
                              </select>
                              <button
                                onClick={() =>
                                  handleRemoveMember(
                                    member.user_id || member.id
                                  )
                                }
                                className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          ) : (
                            <span className="text-sm px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded capitalize">
                              {member.role?.replace(/_/g, " ") || "member"}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
