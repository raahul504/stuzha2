export default function ErrorMessage({ message, onClose }) {
  return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
      <span className="block sm:inline">{message}</span>
      {onClose && (
        <button onClick={onClose} className="absolute top-0 bottom-0 right-0 px-4 py-3">
          <span className="text-red-700">×</span>
        </button>
      )}
    </div>
  );
}