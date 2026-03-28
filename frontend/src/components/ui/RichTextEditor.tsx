"use client";

import React, { useState, useRef } from "react";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Eye,
  Edit3,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  error?: boolean;
  label?: string;
  helpText?: string;
}

type ToolbarAction = "bold" | "italic" | "h2" | "h3" | "bullet" | "numbered";

const TOOLBAR_BUTTONS: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  action: ToolbarAction;
}[] = [
  { icon: Bold, label: "Bold", action: "bold" },
  { icon: Italic, label: "Italic", action: "italic" },
  { icon: Heading2, label: "Heading", action: "h2" },
  { icon: Heading3, label: "Subheading", action: "h3" },
  { icon: List, label: "Bullet List", action: "bullet" },
  { icon: ListOrdered, label: "Numbered List", action: "numbered" },
];

// Markdown preview component
function MarkdownPreview({ content }: { content: string }) {
  if (!content) {
    return <p className="text-gray-400 italic">Nothing to preview</p>;
  }

  const renderContent = () => {
    const paragraphs = content.split(/\n\n+/);

    return paragraphs.map((paragraph, pIdx) => {
      const lines = paragraph.split("\n");

      return (
        <div key={pIdx} className={pIdx > 0 ? "mt-3" : ""}>
          {lines.map((line, lIdx) => {
            // Headers - must have space after #
            if (line.startsWith("### ")) {
              return (
                <h4 key={lIdx} className="font-semibold text-gray-800 mt-2">
                  {processInline(line.slice(4))}
                </h4>
              );
            }
            if (line.startsWith("## ")) {
              return (
                <h3
                  key={lIdx}
                  className="font-bold text-gray-900 mt-2 text-base"
                >
                  {processInline(line.slice(3))}
                </h3>
              );
            }
            if (line.startsWith("# ")) {
              return (
                <h2 key={lIdx} className="font-bold text-gray-900 mt-2 text-lg">
                  {processInline(line.slice(2))}
                </h2>
              );
            }

            // Bullet points
            if (line.match(/^[-*•]\s/)) {
              return (
                <div key={lIdx} className="flex gap-2 ml-2">
                  <span className="text-teal-500">•</span>
                  <span>{processInline(line.slice(2))}</span>
                </div>
              );
            }

            // Numbered lists
            const numberedMatch = line.match(/^(\d+)\.\s/);
            if (numberedMatch) {
              return (
                <div key={lIdx} className="flex gap-2 ml-2">
                  <span className="text-teal-500 font-medium">
                    {numberedMatch[1]}.
                  </span>
                  <span>
                    {processInline(line.slice(numberedMatch[0].length))}
                  </span>
                </div>
              );
            }

            // Regular text
            if (line.trim()) {
              return <p key={lIdx}>{processInline(line)}</p>;
            }
            return null;
          })}
        </div>
      );
    });
  };

  const processInline = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      const italicMatch = remaining.match(/(?<!\*)\*([^*]+)\*(?!\*)|_([^_]+)_/);

      if (
        boldMatch &&
        (!italicMatch || boldMatch.index! <= italicMatch.index!)
      ) {
        if (boldMatch.index! > 0) {
          parts.push(remaining.slice(0, boldMatch.index));
        }
        parts.push(
          <strong key={key++} className="font-semibold">
            {boldMatch[1]}
          </strong>,
        );
        remaining = remaining.slice(boldMatch.index! + boldMatch[0].length);
      } else if (italicMatch) {
        if (italicMatch.index! > 0) {
          parts.push(remaining.slice(0, italicMatch.index));
        }
        parts.push(
          <em key={key++} className="italic">
            {italicMatch[1] || italicMatch[2]}
          </em>,
        );
        remaining = remaining.slice(italicMatch.index! + italicMatch[0].length);
      } else {
        parts.push(remaining);
        break;
      }
    }

    return parts.length > 0 ? parts : text;
  };

  return (
    <div className="space-y-1 text-sm text-gray-700">{renderContent()}</div>
  );
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Write your content...",
  rows = 4,
  error = false,
  label,
  helpText,
}: RichTextEditorProps) {
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertMarkdown = (before: string, after: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText =
      value.substring(0, start) +
      before +
      selectedText +
      after +
      value.substring(end);

    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length,
      );
    }, 0);
  };

  const insertAtLineStart = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const newText =
      value.substring(0, lineStart) + prefix + value.substring(lineStart);

    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 0);
  };

  const handleToolbarAction = (action: ToolbarAction) => {
    switch (action) {
      case "bold":
        insertMarkdown("**", "**");
        break;
      case "italic":
        insertMarkdown("*", "*");
        break;
      case "h2":
        insertAtLineStart("## ");
        break;
      case "h3":
        insertAtLineStart("### ");
        break;
      case "bullet":
        insertAtLineStart("- ");
        break;
      case "numbered":
        insertAtLineStart("1. ");
        break;
      default:
        break;
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <div
        className={`rounded-xl border-2 overflow-hidden transition-all ${
          error
            ? "border-red-300"
            : "border-gray-200 focus-within:border-teal-400"
        }`}
      >
        {/* Toolbar */}
        <div className="flex items-center justify-between px-2 py-1.5 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-1">
            {TOOLBAR_BUTTONS.map((btn) => (
              <button
                key={btn.action}
                type="button"
                onClick={() => handleToolbarAction(btn.action)}
                disabled={showPreview}
                title={btn.label}
                className="p-2 rounded-lg hover:bg-gray-200 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <btn.icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              showPreview
                ? "bg-teal-100 text-teal-700"
                : "bg-gray-200 text-gray-600 hover:bg-gray-300"
            }`}
          >
            {showPreview ? (
              <>
                <Edit3 className="w-3.5 h-3.5" />
                Edit
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                Preview
              </>
            )}
          </button>
        </div>

        {/* Content area */}
        {showPreview ? (
          <div
            className="px-4 py-3 bg-white min-h-30 overflow-y-auto"
            style={{ minHeight: `${rows * 1.75}rem` }}
          >
            <MarkdownPreview content={value} />
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className="w-full px-4 py-3 bg-white text-gray-800 outline-none resize-none text-sm"
          />
        )}
      </div>

      {helpText && (
        <p className="text-xs text-gray-500">
          {helpText} Use **bold**, *italic*, ## heading, - bullets
        </p>
      )}
    </div>
  );
}
