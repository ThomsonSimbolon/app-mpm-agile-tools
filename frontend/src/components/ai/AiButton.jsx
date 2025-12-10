/**
 * AiButton Component
 *
 * Tombol AI dengan loading state dan sparkle icon
 */

import React from "react";

const AiButton = ({
  onClick,
  loading = false,
  disabled = false,
  children,
  variant = "primary", // primary, secondary, ghost
  size = "md", // sm, md, lg
  className = "",
  title = "",
}) => {
  const baseClasses =
    "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses = {
    primary:
      "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white focus:ring-purple-500 shadow-md hover:shadow-lg",
    secondary:
      "bg-purple-100 hover:bg-purple-200 text-purple-700 focus:ring-purple-400 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 dark:text-purple-300",
    ghost:
      "hover:bg-purple-100 text-purple-600 focus:ring-purple-400 dark:hover:bg-purple-900/30 dark:text-purple-400",
  };

  const sizeClasses = {
    sm: "px-2.5 py-1.5 text-xs",
    md: "px-3 py-2 text-sm",
    lg: "px-4 py-2.5 text-base",
  };

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {loading ? (
        <svg
          className={`animate-spin ${iconSizes[size]}`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      ) : (
        <svg
          className={iconSizes[size]}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2L13.09 8.26L19 9L13.91 11.74L15 18L12 13.5L9 18L10.09 11.74L5 9L10.91 8.26L12 2Z"
            fill="currentColor"
          />
          <path
            d="M5 2L5.54 4.46L8 5L5.54 5.54L5 8L4.46 5.54L2 5L4.46 4.46L5 2Z"
            fill="currentColor"
            opacity="0.6"
          />
          <path
            d="M19 14L19.54 16.46L22 17L19.54 17.54L19 20L18.46 17.54L16 17L18.46 16.46L19 14Z"
            fill="currentColor"
            opacity="0.6"
          />
        </svg>
      )}
      {children}
    </button>
  );
};

export default AiButton;
