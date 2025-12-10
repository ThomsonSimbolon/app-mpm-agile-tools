import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import Button from "../common/Button";
import Input from "../common/Input";
import { userService } from "../../services/userService";

const DepartmentForm = ({
  department,
  departments,
  onSubmit,
  onCancel,
  loading,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    parent_id: "",
    head_user_id: "",
  });
  const [users, setUsers] = useState([]);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (department) {
      setFormData({
        name: department.name || "",
        code: department.code || "",
        description: department.description || "",
        parent_id: department.parent_id || "",
        head_user_id: department.head_user_id || "",
      });
    }
  }, [department]);

  const loadUsers = async () => {
    try {
      const result = await userService.getAll({ limit: 100 });
      if (result.success) {
        setUsers(result.data.data || result.data.users || []);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Auto-generate code from name
  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name,
      // Auto-generate code if empty or user hasn't manually changed it
      code:
        prev.code === "" || prev.code === generateCode(prev.name)
          ? generateCode(name)
          : prev.code,
    }));
  };

  const generateCode = (name) => {
    return name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .substring(0, 10);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const submitData = {
      ...formData,
      parent_id: formData.parent_id || null,
      head_user_id: formData.head_user_id || null,
    };

    onSubmit(submitData);
  };

  // Filter out current department and its children from parent options
  const availableParents =
    departments?.filter((d) => d.id !== department?.id) || [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-border sticky top-0 bg-white dark:bg-dark-card">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {department ? "Edit Departemen" : "Buat Departemen Baru"}
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
              Nama Departemen *
            </label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleNameChange}
              placeholder="Masukkan nama departemen"
              required
            />
          </div>

          {/* Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Kode Departemen *
            </label>
            <Input
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="Contoh: IT, HR, FIN"
              required
              maxLength={20}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Kode unik untuk departemen (maks. 20 karakter)
            </p>
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
              placeholder="Deskripsi departemen..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Parent Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Departemen Induk
            </label>
            <select
              name="parent_id"
              value={formData.parent_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">-- Tidak Ada (Root) --</option>
              {availableParents.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.code} - {dept.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Pilih departemen induk untuk membuat struktur hierarki
            </p>
          </div>

          {/* Department Head */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Kepala Departemen
            </label>
            <select
              name="head_user_id"
              value={formData.head_user_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">-- Pilih Kepala Departemen --</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name} (@{user.username})
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={onCancel}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : department ? "Simpan" : "Buat"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DepartmentForm;
