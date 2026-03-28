"use client";

import React from "react";

interface RichTextProps {
  content: string;
  className?: string;
}

export default function RichText({ content, className = "" }: RichTextProps) {
  // Convert markdown-like syntax to HTML
  const renderContent = () => {
    if (!content) return null;

    // Split by paragraphs (double newlines)
    const paragraphs = content.split(/\n\n+/);

    return paragraphs.map((paragraph, pIdx) => {
      // Process each line in the paragraph
      const lines = paragraph.split("\n");

      return (
        <div key={pIdx} className={pIdx > 0 ? "mt-3" : ""}>
          {lines.map((line, lIdx) => {
            // Check for headers
            if (line.startsWith("### ")) {
              return (
                <h4 key={lIdx} className="font-semibold text-gray-800 mt-2">
                  {processInlineStyles(line.slice(4))}
                </h4>
              );
            }
            if (line.startsWith("## ")) {
              return (
                <h3 key={lIdx} className="font-bold text-gray-900 mt-2">
                  {processInlineStyles(line.slice(3))}
                </h3>
              );
            }
            if (line.startsWith("# ")) {
              return (
                <h2 key={lIdx} className="text-lg font-bold text-gray-900 mt-2">
                  {processInlineStyles(line.slice(2))}
                </h2>
              );
            }

            // Check for bullet points
            if (line.match(/^[-*•]\s/)) {
              return (
                <div key={lIdx} className="flex gap-2 ml-2">
                  <span className="text-teal-500">•</span>
                  <span>{processInlineStyles(line.slice(2))}</span>
                </div>
              );
            }

            // Check for numbered lists
            const numberedMatch = line.match(/^(\d+)\.\s/);
            if (numberedMatch) {
              return (
                <div key={lIdx} className="flex gap-2 ml-2">
                  <span className="text-teal-500 font-medium">
                    {numberedMatch[1]}.
                  </span>
                  <span>
                    {processInlineStyles(line.slice(numberedMatch[0].length))}
                  </span>
                </div>
              );
            }

            // Regular text
            if (line.trim()) {
              return <p key={lIdx}>{processInlineStyles(line)}</p>;
            }
            return null;
          })}
        </div>
      );
    });
  };

  // Process bold, italic, and other inline styles
  const processInlineStyles = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      // Bold **text**
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      // Italic *text* or _text_
      const italicMatch = remaining.match(/(?<!\*)\*([^*]+)\*(?!\*)|_([^_]+)_/);

      if (boldMatch && (!italicMatch || boldMatch.index! <= italicMatch.index!)) {
        if (boldMatch.index! > 0) {
          parts.push(remaining.slice(0, boldMatch.index));
        }
        parts.push(
          <strong key={key++} className="font-semibold">
            {boldMatch[1]}
          </strong>
        );
        remaining = remaining.slice(boldMatch.index! + boldMatch[0].length);
      } else if (italicMatch) {
        if (italicMatch.index! > 0) {
          parts.push(remaining.slice(0, italicMatch.index));
        }
        parts.push(
          <em key={key++} className="italic">
            {italicMatch[1] || italicMatch[2]}
          </em>
        );
        remaining = remaining.slice(italicMatch.index! + italicMatch[0].length);
      } else {
        parts.push(remaining);
        break;
      }
    }

    return parts.length > 0 ? parts : text;
  };

  return <div className={`space-y-1 ${className}`}>{renderContent()}</div>;
}
