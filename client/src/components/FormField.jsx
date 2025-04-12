import React from 'react';

const FormField = ({
  labelName,
  type,
  name,
  placeholder,
  value,
  handleChange,
  isSurpriseMe,
  handleSurpriseMe,
}) => (
  <div>
    <div className="flex items-center gap-2 mb-2">
      <label
        htmlFor={name}
        className="block text-sm font-medium text-text-primary dark:text-text-primary-dark transition-colors duration-200"
      >
        {labelName}
      </label>
      {isSurpriseMe && (
        <button
          type="button"
          onClick={handleSurpriseMe}
          className="font-semibold text-xs bg-[#ECECF1] dark:bg-gray-700 py-1 px-2 rounded-[5px] text-black dark:text-white transition-colors duration-200 hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Surprise me
        </button>
      )}
    </div>
    <input
      type={type}
      id={name}
      name={name}
      className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-text-primary dark:text-text-primary-dark text-sm rounded-lg focus:ring-primary focus:border-primary outline-none block w-full p-3 transition-colors duration-200"
      placeholder={placeholder}
      value={value}
      onChange={handleChange}
      required
    />
  </div>
);

export default FormField;