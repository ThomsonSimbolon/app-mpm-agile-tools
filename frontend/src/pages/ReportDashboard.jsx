/**
 * ReportDashboard Page
 *
 * Halaman dashboard untuk melihat laporan dan analytics project
 */

import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import {
  BurndownChart,
  VelocityChart,
  WorkloadChart,
  ProjectSummaryCard,
  ExportReportButton,
} from "../components/charts";
import { projectService } from "../services/projectService";
import { sprintService } from "../services/sprintService";
import { ArrowLeft, RefreshCw, BarChart3 } from "lucide-react";
import toast from "react-hot-toast";

export default function ReportDashboard() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [sprints, setSprints] = useState([]);
  const [activeSprint, setActiveSprint] = useState(null);
  const [selectedSprintId, setSelectedSprintId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      // Load project
      const projectResult = await projectService.getById(projectId);
      if (projectResult.success) {
        setProject(projectResult.data);
      }

      // Load sprints
      const sprintsResult = await sprintService.getAll(projectId);
      if (sprintsResult.success) {
        const sprintList = sprintsResult.data.items || sprintsResult.data || [];
        setSprints(sprintList);

        // Find active sprint
        const active = sprintList.find((s) => s.status === "active");
        if (active) {
          setActiveSprint(active);
          setSelectedSprintId(active.id);
        } else if (sprintList.length > 0) {
          setSelectedSprintId(sprintList[0].id);
        }
      }
    } catch (error) {
      toast.error("Gagal memuat data project");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    loadData();
    toast.success("Data diperbarui");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Project tidak ditemukan
          </h2>
          <Link
            to="/projects"
            className="text-purple-600 hover:text-purple-700"
          >
            Kembali ke daftar project
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="text-purple-600" size={24} />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Report Dashboard
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {project.name} - Analytics & Reports
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Sprint Selector */}
            {sprints.length > 0 && (
              <select
                value={selectedSprintId || ""}
                onChange={(e) => setSelectedSprintId(Number(e.target.value))}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-purple-500"
              >
                {sprints.map((sprint) => (
                  <option key={sprint.id} value={sprint.id}>
                    {sprint.name} {sprint.status === "active" && "(Active)"}
                  </option>
                ))}
              </select>
            )}

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Refresh Data"
            >
              <RefreshCw size={20} />
            </button>

            {/* Export Button */}
            <ExportReportButton
              projectId={Number(projectId)}
              projectName={project.name}
              sprintId={selectedSprintId}
              sprintName={sprints.find((s) => s.id === selectedSprintId)?.name}
            />
          </div>
        </div>

        {/* Project Summary */}
        <div className="mb-6">
          <ProjectSummaryCard
            key={`summary-${refreshKey}`}
            projectId={Number(projectId)}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Burndown Chart */}
          <BurndownChart
            key={`burndown-${refreshKey}-${selectedSprintId}`}
            projectId={Number(projectId)}
            sprintId={selectedSprintId}
          />

          {/* Velocity Chart */}
          <VelocityChart
            key={`velocity-${refreshKey}`}
            projectId={Number(projectId)}
          />
        </div>

        {/* Workload Distribution */}
        <div className="mb-6">
          <WorkloadChart
            key={`workload-${refreshKey}`}
            projectId={Number(projectId)}
          />
        </div>

        {/* Quick Links */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Quick Links
          </h3>
          <div className="flex flex-wrap gap-3">
            <Link
              to={`/projects/${projectId}/kanban`}
              className="px-4 py-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-lg text-sm font-medium transition-colors"
            >
              📋 Kanban Board
            </Link>
            <Link
              to={`/projects/${projectId}/sprints`}
              className="px-4 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium transition-colors"
            >
              🏃 Sprint Management
            </Link>
            <Link
              to="/projects"
              className="px-4 py-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
            >
              📁 All Projects
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
