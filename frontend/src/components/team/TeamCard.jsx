import React from "react";
import { Users, Settings, MoreVertical, User } from "lucide-react";

const TeamCard = ({ team, onClick, onEdit, onDelete, showActions = true }) => {
  const [showMenu, setShowMenu] = React.useState(false);
  const menuRef = React.useRef(null);

  // Close menu on outside click
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className="bg-white dark:bg-dark-card rounded-lg border border-gray-200 dark:border-dark-border p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onClick?.(team)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Team Avatar/Color */}
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: team.color || "#3B82F6" }}
          >
            <Users className="w-5 h-5 text-white" />
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {team.name}
            </h3>
            {team.department && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {team.department.name}
              </p>
            )}
          </div>
        </div>

        {/* Actions Menu */}
        {showActions && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-border"
            >
              <MoreVertical className="w-4 h-4 text-gray-500" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-dark-card rounded-lg shadow-lg border border-gray-200 dark:border-dark-border py-1 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(team);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-dark-border flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Edit Tim
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(team);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Hapus Tim
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Description */}
      {team.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {team.description}
        </p>
      )}

      {/* Team Lead */}
      {team.lead && (
        <div className="flex items-center gap-2 mb-3 text-sm">
          <span className="text-gray-500 dark:text-gray-400">Lead:</span>
          <div className="flex items-center gap-1">
            {team.lead.avatar_url ? (
              <img
                src={`${
                  import.meta.env.VITE_API_URL?.replace("/api", "") ||
                  "http://localhost:5000"
                }/${team.lead.avatar_url}`}
                alt={team.lead.full_name}
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">
                  {team.lead.full_name?.charAt(0) || "?"}
                </span>
              </div>
            )}
            <span className="text-gray-700 dark:text-gray-300">
              {team.lead.full_name}
            </span>
          </div>
        </div>
      )}

      {/* Footer - Member Count */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-dark-border">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <User className="w-4 h-4" />
          <span>
            {team.memberCount || team.teamMembers?.length || 0} anggota
          </span>
        </div>

        {/* Member Avatars */}
        {team.teamMembers && team.teamMembers.length > 0 && (
          <div className="flex -space-x-2">
            {team.teamMembers.slice(0, 4).map((member, idx) => (
              <div
                key={member.user?.id || idx}
                className="w-6 h-6 rounded-full border-2 border-white dark:border-dark-card bg-gray-200 dark:bg-gray-600 overflow-hidden"
                title={member.user?.full_name}
              >
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
                  <div className="w-full h-full flex items-center justify-center text-xs text-gray-600 dark:text-gray-300">
                    {member.user?.full_name?.charAt(0) || "?"}
                  </div>
                )}
              </div>
            ))}
            {team.teamMembers.length > 4 && (
              <div className="w-6 h-6 rounded-full border-2 border-white dark:border-dark-card bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                <span className="text-xs text-gray-600 dark:text-gray-300">
                  +{team.teamMembers.length - 4}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamCard;
