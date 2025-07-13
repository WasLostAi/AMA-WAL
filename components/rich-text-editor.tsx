"use client"
import { useCallback, useEffect } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import TurndownService from "turndown"
import { marked } from "marked"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  BoldIcon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
  Heading2Icon,
  Heading3Icon,
  LinkIcon,
  UnlinkIcon,
  CodeIcon,
  QuoteIcon,
  MinusIcon,
  RedoIcon,
  UndoIcon,
} from "lucide-react"

interface RichTextEditorProps {
  value: string
  onChange: (markdown: string) => void
  disabled?: boolean
  placeholder?: string
}

export function RichTextEditor({ value, onChange, disabled, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
        blockquote: true,
        codeBlock: true,
        hardBreak: false,
      }),
      Link.configure({
        autolink: true,
        openOnClick: false,
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener noreferrer nofollow",
        },
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-invert max-w-none",
          "min-h-[300px] p-4 rounded-lg",
          "bg-neumorphic-base shadow-inner-neumorphic text-white",
          "focus:outline-none focus:ring-2 focus:ring-[#afcd4f]",
          "overflow-y-auto",
          disabled ? "opacity-70 cursor-not-allowed" : "",
        ),
      },
    },
    onUpdate: ({ editor }) => {
      onChange(new TurndownService().turndown(editor.getHTML()))
    },
    editable: !disabled,
  })

  useEffect(() => {
    if (editor && editor.getHTML() !== marked.parse(value)) {
      editor.commands.setContent(marked.parse(value), false, { preserveCursor: true })
    }
  }, [value, editor])

  const setLink = useCallback(() => {
    if (!editor) return

    const previousUrl = editor.getAttributes("link").href
    const url = window.prompt("URL", previousUrl)

    if (url === null) {
      return
    }

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }, [editor])

  if (!editor) {
    return null
  }

  return (
    <div className="border border-border rounded-lg">
      <div className="flex flex-wrap gap-1 p-2 border-b border-border bg-neumorphic-light rounded-t-lg">
        <Button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run() || disabled}
          className={cn(
            "jupiter-button-dark h-8 w-8 p-0",
            editor.isActive("bold") ? "bg-[#2ed3b7] text-black" : "bg-neumorphic-base",
          )}
          aria-label="Bold"
        >
          <BoldIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run() || disabled}
          className={cn(
            "jupiter-button-dark h-8 w-8 p-0",
            editor.isActive("italic") ? "bg-[#2ed3b7] text-black" : "bg-neumorphic-base",
          )}
          aria-label="Italic"
        >
          <ItalicIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          disabled={!editor.can().chain().focus().toggleHeading({ level: 2 }).run() || disabled}
          className={cn(
            "jupiter-button-dark h-8 w-8 p-0",
            editor.isActive("heading", { level: 2 }) ? "bg-[#2ed3b7] text-black" : "bg-neumorphic-base",
          )}
          aria-label="Heading 2"
        >
          <Heading2Icon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          disabled={!editor.can().chain().focus().toggleHeading({ level: 3 }).run() || disabled}
          className={cn(
            "jupiter-button-dark h-8 w-8 p-0",
            editor.isActive("heading", { level: 3 }) ? "bg-[#2ed3b7] text-black" : "bg-neumorphic-base",
          )}
          aria-label="Heading 3"
        >
          <Heading3Icon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          disabled={!editor.can().chain().focus().toggleBulletList().run() || disabled}
          className={cn(
            "jupiter-button-dark h-8 w-8 p-0",
            editor.isActive("bulletList") ? "bg-[#2ed3b7] text-black" : "bg-neumorphic-base",
          )}
          aria-label="Bullet List"
        >
          <ListIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          disabled={!editor.can().chain().focus().toggleOrderedList().run() || disabled}
          className={cn(
            "jupiter-button-dark h-8 w-8 p-0",
            editor.isActive("orderedList") ? "bg-[#2ed3b7] text-black" : "bg-neumorphic-base",
          )}
          aria-label="Ordered List"
        >
          <ListOrderedIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          disabled={!editor.can().chain().focus().toggleCodeBlock().run() || disabled}
          className={cn(
            "jupiter-button-dark h-8 w-8 p-0",
            editor.isActive("codeBlock") ? "bg-[#2ed3b7] text-black" : "bg-neumorphic-base",
          )}
          aria-label="Code Block"
        >
          <CodeIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          disabled={!editor.can().chain().focus().toggleBlockquote().run() || disabled}
          className={cn(
            "jupiter-button-dark h-8 w-8 p-0",
            editor.isActive("blockquote") ? "bg-[#2ed3b7] text-black" : "bg-neumorphic-base",
          )}
          aria-label="Blockquote"
        >
          <QuoteIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          disabled={!editor.can().chain().focus().setHorizontalRule().run() || disabled}
          className="jupiter-button-dark h-8 w-8 p-0 bg-neumorphic-base"
          aria-label="Horizontal Rule"
        >
          <MinusIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          onClick={setLink}
          disabled={disabled}
          className={cn(
            "jupiter-button-dark h-8 w-8 p-0",
            editor.isActive("link") ? "bg-[#2ed3b7] text-black" : "bg-neumorphic-base",
          )}
          aria-label="Set Link"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          onClick={() => editor.chain().focus().unsetLink().run()}
          disabled={!editor.can().chain().focus().unsetLink().run() || disabled}
          className="jupiter-button-dark h-8 w-8 p-0 bg-neumorphic-base"
          aria-label="Unset Link"
        >
          <UnlinkIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo() || disabled}
          className="jupiter-button-dark h-8 w-8 p-0 bg-neumorphic-base"
          aria-label="Undo"
        >
          <UndoIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo() || disabled}
          className="jupiter-button-dark h-8 w-8 p-0 bg-neumorphic-base"
          aria-label="Redo"
        >
          <RedoIcon className="h-4 w-4" />
        </Button>
      </div>
      <EditorContent editor={editor} />
      {placeholder && !editor.isFocused && editor.isEmpty && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          {placeholder}
        </div>
      )}
    </div>
  )
}
