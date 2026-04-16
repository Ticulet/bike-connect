import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import type { JSONContent } from '@tiptap/react';
import { EditorToolbar } from './EditorToolbar.js';
import './editor.css';

interface PostEditorProps {
  content?: JSONContent;
  onChange: (content: JSONContent) => void;
  placeholder?: string;
}

export function PostEditor({ content, onChange, placeholder = 'Write your post...' }: PostEditorProps): React.JSX.Element {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: false,
      }),
      Link.configure({
        openOnClick: false,
      }),
      Image,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate({ editor: updatedEditor }) {
      onChange(updatedEditor.getJSON());
    },
  });

  if (!editor) {
    return <div className="post-editor">Loading editor...</div>;
  }

  return (
    <div className="post-editor">
      <EditorToolbar editor={editor} />
      <div className="editor-content">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
