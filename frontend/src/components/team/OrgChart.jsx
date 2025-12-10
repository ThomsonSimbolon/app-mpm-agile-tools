import React, { useState, useEffect, useCallback } from "react";
import {
  ChevronDown,
  ChevronRight,
  Building2,
  Users,
  User,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";

const OrgChart = ({
  departments,
  teams,
  onSelectDepartment,
  onSelectTeam,
  onAddDepartment,
  onEditDepartment,
  onDeleteDepartment,
  selectedDepartmentId,
  selectedTeamId,
}) => {
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  // Build department tree structure
  const buildTree = useCallback(
    (depts) => {
      const deptMap = {};
      const roots = [];

      // Create map of all departments
      depts.forEach((dept) => {
        deptMap[dept.id] = { ...dept, children: [], teams: [] };
      });

      // Assign teams to departments
      teams.forEach((team) => {
        if (team.department_id && deptMap[team.department_id]) {
          deptMap[team.department_id].teams.push(team);
        }
      });

      // Build tree structure
      depts.forEach((dept) => {
        if (dept.parent_id && deptMap[dept.parent_id]) {
          deptMap[dept.parent_id].children.push(deptMap[dept.id]);
        } else {
          roots.push(deptMap[dept.id]);
        }
      });

      return roots;
    },
    [teams]
  );

  // Expand root nodes by default
  useEffect(() => {
    const roots = departments.filter((d) => !d.parent_id);
    setExpandedNodes(new Set(roots.map((r) => `dept-${r.id}`)));
  }, [departments]);

  const toggleExpand = (nodeId) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const tree = buildTree(departments);

  // Teams without department
  const orphanTeams = teams.filter((t) => !t.department_id);

  const renderDepartmentNode = (dept, level = 0) => {
    const nodeId = `dept-${dept.id}`;
    const isExpanded = expandedNodes.has(nodeId);
    const hasChildren = dept.children.length > 0 || dept.teams.length > 0;
    const isSelected = selectedDepartmentId === dept.id;

    return (
      <div key={dept.id} className="select-none">
        {/* Department Node */}
        <div
          className={`flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer group transition-colors ${
            isSelected
              ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
              : "hover:bg-gray-100 dark:hover:bg-dark-border"
          }`}
          style={{ marginLeft: level * 24 }}
        >
          {/* Expand/Collapse Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand(nodeId);
            }}
            className={`p-0.5 rounded hover:bg-gray-200 dark:hover:bg-dark-bg ${
              !hasChildren && "invisible"
            }`}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          {/* Department Icon */}
          <Building2 className="w-5 h-5 text-blue-500" />

          {/* Department Info */}
          <div
            className="flex-1 min-w-0"
            onClick={() => onSelectDepartment?.(dept)}
          >
            <div className="font-medium text-sm truncate">{dept.name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {dept.code}
              {dept.teams?.length > 0 && ` • ${dept.teams.length} tim`}
            </div>
          </div>

          {/* Actions */}
          <div className="hidden group-hover:flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddDepartment?.(dept.id);
              }}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-dark-bg"
              title="Tambah Sub-Departemen"
            >
              <Plus className="w-4 h-4 text-green-500" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditDepartment?.(dept);
              }}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-dark-bg"
              title="Edit"
            >
              <Edit className="w-4 h-4 text-blue-500" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteDepartment?.(dept);
              }}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-dark-bg"
              title="Hapus"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          </div>
        </div>

        {/* Children (expanded) */}
        {isExpanded && (
          <div>
            {/* Child Departments */}
            {dept.children.map((child) =>
              renderDepartmentNode(child, level + 1)
            )}

            {/* Teams in Department */}
            {dept.teams.map((team) => renderTeamNode(team, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderTeamNode = (team, level = 0) => {
    const isSelected = selectedTeamId === team.id;

    return (
      <div
        key={team.id}
        className={`flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-colors ${
          isSelected
            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
            : "hover:bg-gray-100 dark:hover:bg-dark-border"
        }`}
        style={{ marginLeft: level * 24 + 28 }}
        onClick={() => onSelectTeam?.(team)}
      >
        {/* Team Icon */}
        <Users className="w-5 h-5 text-green-500" />

        {/* Team Info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate flex items-center gap-2">
            {team.color && (
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: team.color }}
              />
            )}
            {team.name}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {team.member_count || 0} anggota
            {team.lead && ` • Lead: ${team.lead.full_name}`}
          </div>
        </div>
      </div>
    );
  };

  if (departments.length === 0 && teams.length === 0) {
    return (
      <div className="text-center py-8">
        <Building2 className="w-12 h-12 mx-auto text-gray-400 mb-2" />
        <p className="text-gray-500 dark:text-gray-400">
          Belum ada departemen atau tim
        </p>
        <button
          onClick={() => onAddDepartment?.()}
          className="mt-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
        >
          + Tambah Departemen
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Department Tree */}
      {tree.map((dept) => renderDepartmentNode(dept))}

      {/* Teams without Department */}
      {orphanTeams.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-border">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2 px-3">
            Tim Tanpa Departemen
          </div>
          {orphanTeams.map((team) => renderTeamNode(team))}
        </div>
      )}
    </div>
  );
};

export default OrgChart;
