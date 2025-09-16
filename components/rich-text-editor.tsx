"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  LinkIcon,
  ImageIcon,
  Code,
  Quote,
  Heading1,
  Heading2,
  Heading3,
} from "lucide-react"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [isEditing, setIsEditing] = useState(false)

  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const insertLink = () => {
    const url = prompt("Enter URL:")
    if (url) {
      executeCommand("createLink", url)
    }
  }

  const insertImage = () => {
    const url = prompt("Enter image URL:")
    if (url) {
      executeCommand("insertImage", url)
    }
  }

  return (
    <Card className={`p-4 ${className}`}>
      <div className="border-b pb-2 mb-4">
        <div className="flex flex-wrap gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={() => executeCommand("formatBlock", "h1")}>
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => executeCommand("formatBlock", "h2")}>
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => executeCommand("formatBlock", "h3")}>
            <Heading3 className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button type="button" variant="ghost" size="sm" onClick={() => executeCommand("bold")}>
            <Bold className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => executeCommand("italic")}>
            <Italic className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => executeCommand("underline")}>
            <Underline className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button type="button" variant="ghost" size="sm" onClick={() => executeCommand("insertUnorderedList")}>
            <List className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => executeCommand("insertOrderedList")}>
            <ListOrdered className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button type="button" variant="ghost" size="sm" onClick={insertLink}>
            <LinkIcon className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={insertImage}>
            <ImageIcon className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => executeCommand("formatBlock", "blockquote")}>
            <Quote className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => executeCommand("formatBlock", "pre")}>
            <Code className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div
        ref={editorRef}
        contentEditable
        className="min-h-[200px] p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        dangerouslySetInnerHTML={{ __html: value }}
        onInput={handleInput}
        onFocus={() => setIsEditing(true)}
        onBlur={() => setIsEditing(false)}
        style={{ whiteSpace: "pre-wrap" }}
      />
      {!value && !isEditing && (
        <div className="absolute top-16 left-7 text-muted-foreground pointer-events-none">
          {placeholder || "Start writing..."}
        </div>
      )}
    </Card>
  )
}

export default RichTextEditor
