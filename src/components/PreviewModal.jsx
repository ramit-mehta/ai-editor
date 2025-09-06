import React from "react";
import Modal from "react-modal";

Modal.setAppElement("#root");

export default function PreviewModal({
  isOpen,
  original,
  suggestion,
  onConfirm,
  onCancel,
}) {
  const isLoading = !suggestion;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onCancel}
      className="w-full max-w-4xl mx-auto mt-10 md:mt-20 bg-gradient-to-b from-white/90 to-indigo-50/90 rounded-2xl shadow-xl outline-none overflow-hidden backdrop-blur-lg"
      overlayClassName="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="border-b px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <h3 className="text-xl font-semibold">✨ Preview Changes</h3>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="p-6 text-center text-gray-600 animate-pulse">
              Loading suggestion...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Original</h4>
                <div className="p-3 border rounded-lg bg-gray-50 whitespace-pre-wrap text-sm max-h-72 overflow-y-auto shadow-inner">
                  {original}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">
                  AI Suggestion
                </h4>
                <div className="p-3 border rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 whitespace-pre-wrap text-sm max-h-72 overflow-y-auto shadow-inner">
                  {suggestion}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex justify-end gap-3 bg-gray-50">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-gray-700 border hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 transition"
          >
            Confirm
          </button>
        </div>
      </div>
    </Modal>
  );
}
