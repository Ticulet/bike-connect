import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import type { JSONContent } from '@tiptap/react';
import './editor.css';

interface PostContentProps {
  content: JSONContent;
}

export function PostContent({ content }: PostContentProps): React.JSX.Element {
  const editor = useEditor({
    editable: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer' },
      }),
      Image,
    ],
    content,
  });

  if (!editor) {
    return <div className="post-content" aria-busy="true" />;
  }

  return (
    <div className="post-content">
      <EditorContent editor={editor} />
    </div>
  );
}
