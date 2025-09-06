import React from "react";
import { EditorContent } from "@tiptap/react";

export default function EditorView({ editor }) {
  if (!editor)
    return <div className="p-4 text-gray-500">Loading editor...</div>;

  return (
    <div className="h-full flex flex-col bg-gray-100 p-4">
      {/* Editor container */}
      <div className="flex-1 bg-white shadow-md rounded-2xl border p-6 overflow-y-auto">
        <EditorContent
          editor={editor}
          className="prose max-w-none focus:outline-none"
        />
      </div>
    </div>
  );
}
