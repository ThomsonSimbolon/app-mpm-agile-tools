import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import Button from "../common/Button";
import Input from "../common/Input";
import { departmentService } from "../../services/teamService";
import { userService } from "../../services/userService";

const TeamForm = ({ team, onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    department_id: "",
    lead_user_id: "",
    color: "#3B82F6",
    max_members: "",
  });
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    loadOptions();
  }, []);

  useEffect(() => {
    if (team) {
      setFormData({
        name: team.name || "",
        description: team.description || "",
        department_id: team.department_id || "",
        lead_user_id: team.lead_user_id || "",
        color: team.color || "#3B82F6",
        max_members: team.max_members || "",
      });
    }
  }, [team]);

  const loadOptions = async () => {
    try {
      // Load departments
      const deptResult = await departmentService.getList({ limit: 100 });
      if (deptResult.success) {
        setDepartments(deptResult.data.data);
      }

      // Load users
      const userResult = await userService.getAll({ limit: 100 });
      if (userResult.success) {
        setUsers(userResult.data.data || userResult.data.users || []);
      }
    } catch (error) {
      console.error("Error loading options:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const submitData = {
      ...formData,
      department_id: formData.department_id || null,
      lead_user_id: formData.lead_user_id || null,
      max_members: formData.max_members ? parseInt(formData.max_members) : null,
    };

    onSubmit(submitData);
  };

  // Predefined colors
  const colors = [
    "#3B82F6", // Blue
    "#10B981", // Green
    "#F59E0B", // Yellow
    "#EF4444", // Red
    "#8B5CF6", // Purple
    "#EC4899", // Pink
    "#06B6D4", // Cyan
    "#F97316", // Orange
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-border sticky top-0 bg-white dark:bg-dark-card">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {team ? "Edit Tim" : "Buat Tim Baru"}
          </h3>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 dark:hover:bg-dark-border rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nama Tim *
            </label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Masukkan nama tim"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Deskripsi
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Deskripsi tim..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Departemen
            </label>
            <select
              name="department_id"
              value={formData.department_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">-- Pilih Departemen --</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.code} - {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Team Lead */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Team Lead
            </label>
            <select
              name="lead_user_id"
              value={formData.lead_user_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">-- Pilih Team Lead --</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name} (@{user.username})
                </option>
              ))}
            </select>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Warna Tim
            </label>
            <div className="flex items-center gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, color }))}
                  className={`w-8 h-8 rounded-full border-2 ${
                    formData.color === color
                      ? "border-gray-900 dark:border-white"
                      : "border-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
              <input
                type="color"
                value={formData.color}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, color: e.target.value }))
                }
                className="w-8 h-8 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Max Members */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Maks. Anggota
            </label>
            <Input
              type="number"
              name="max_members"
              value={formData.max_members}
              onChange={handleChange}
              placeholder="Kosongkan jika tidak terbatas"
              min="1"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={onCancel}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : team ? "Simpan" : "Buat Tim"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeamForm;
