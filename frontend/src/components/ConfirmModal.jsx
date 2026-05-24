export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-dcs-dark-gray rounded-lg p-6 sm:p-8 border border-dcs-purple/20 shadow-2xl w-full max-w-md sm:max-w-lg">
        <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-white">{title}</h3>
        <p className="text-dcs-gray-600 mb-6 sm:mb-8 text-sm sm:text-base">{message}</p>
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:shadow-lg transition-all"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}