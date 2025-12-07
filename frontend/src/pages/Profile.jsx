import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import Header from '../components/layout/Header';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import AvatarUpload from '../components/profile/AvatarUpload';
import { Save, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, updateProfile, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || ''
      });
    }
  }, [user]);

  const handleAvatarUpload = async (file) => {
    try {
      setUploading(true);
      const result = await userService.uploadAvatar(user.id, file);
      
      if (result.success) {
        toast.success('Avatar uploaded successfully!');
        // Refresh user data to get new avatar
        await refreshUser();
      } else {
        toast.error(result.message || 'Failed to upload avatar');
      }
    } catch (error) {
      toast.error('Failed to upload avatar');
      console.error('Avatar upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleAvatarRemove = async () => {
    try {
      setUploading(true);
      const result = await userService.deleteAvatar(user.id);
      
      if (result.success) {
        toast.success('Avatar removed successfully!');
        await refreshUser();
      } else {
        toast.error(result.message || 'Failed to remove avatar');
      }
    } catch (error) {
      toast.error('Failed to remove avatar');
      console.error('Avatar remove error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const result = await updateProfile(formData);
      
      if (result.success) {
        toast.success('Profile updated successfully!');
      } else {
        toast.error(result.message || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('Failed to update profile');
      console.error('Profile update error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Profile Settings
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage your account information
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Avatar Section */}
          <div className="md:col-span-1">
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Profile Picture
              </h2>
              <AvatarUpload
                currentAvatar={user.avatar_url}
                onUpload={handleAvatarUpload}
                onRemove={handleAvatarRemove}
                loading={uploading}
              />
            </Card>
          </div>

          {/* Profile Info Section */}
          <div className="md:col-span-2">
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Account Information
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Full Name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                  placeholder="Enter your full name"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Email cannot be changed
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={user.username}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Username cannot be changed
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Role
                  </label>
                  <input
                    type="text"
                    value={user.role?.toUpperCase()}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <Button
                    type="submit"
                    variant="primary"
                    loading={loading}
                    disabled={loading}
                    className="flex items-center space-x-2"
                  >
                    <Save size={16} />
                    <span>Save Changes</span>
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
