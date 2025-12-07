export default function Input({ 
  label, 
  error, 
  type = 'text',
  required = false,
  ...props 
}) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 
          text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 
          ${error 
            ? 'border-red-500 focus:ring-red-500' 
            : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'
          }`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
