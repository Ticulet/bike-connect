import type { Editor } from '@tiptap/react';

interface EditorToolbarProps {
  editor: Editor;
}

function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function EditorToolbar({ editor }: EditorToolbarProps): React.JSX.Element {
  function addLink(): void {
    const url = window.prompt('Enter URL');
    if (url === '') {
      editor.chain().focus().unsetLink().run();
    } else if (url && isSafeUrl(url)) {
      editor.chain().focus().setLink({ href: url, rel: 'noopener noreferrer' }).run();
    }
  }

  function addImage(): void {
    const url = window.prompt('Enter image URL');
    if (url && isSafeUrl(url)) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }

  return (
    <div className="editor-toolbar" role="toolbar" aria-label="Text formatting">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? 'is-active' : ''}
        aria-label="Bold"
        aria-pressed={editor.isActive('bold')}
      >
        B
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive('italic') ? 'is-active' : ''}
        aria-label="Italic"
        aria-pressed={editor.isActive('italic')}
      >
        I
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={editor.isActive('strike') ? 'is-active' : ''}
        aria-label="Strikethrough"
        aria-pressed={editor.isActive('strike')}
      >
        S
      </button>

      <div className="separator" aria-hidden="true" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
        aria-label="Heading 1"
        aria-pressed={editor.isActive('heading', { level: 1 })}
      >
        H1
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
        aria-label="Heading 2"
        aria-pressed={editor.isActive('heading', { level: 2 })}
      >
        H2
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
        aria-label="Heading 3"
        aria-pressed={editor.isActive('heading', { level: 3 })}
      >
        H3
      </button>

      <div className="separator" aria-hidden="true" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive('bulletList') ? 'is-active' : ''}
        aria-label="Bullet list"
        aria-pressed={editor.isActive('bulletList')}
      >
        •—
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive('orderedList') ? 'is-active' : ''}
        aria-label="Ordered list"
        aria-pressed={editor.isActive('orderedList')}
      >
        1—
      </button>

      <div className="separator" aria-hidden="true" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={editor.isActive('blockquote') ? 'is-active' : ''}
        aria-label="Blockquote"
        aria-pressed={editor.isActive('blockquote')}
      >
        ❝
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={editor.isActive('codeBlock') ? 'is-active' : ''}
        aria-label="Code block"
        aria-pressed={editor.isActive('codeBlock')}
      >
        {'</>'}
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        aria-label="Horizontal rule"
      >
        —
      </button>

      <div className="separator" aria-hidden="true" />

      <button
        type="button"
        onClick={addLink}
        className={editor.isActive('link') ? 'is-active' : ''}
        aria-label="Add or remove link"
        aria-pressed={editor.isActive('link')}
      >
        Link
      </button>
      <button
        type="button"
        onClick={addImage}
        aria-label="Add image"
      >
        Img
      </button>
    </div>
  );
}
