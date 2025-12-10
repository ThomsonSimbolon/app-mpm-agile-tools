/**
 * AiChatPanelStream Component
 *
 * Panel chat untuk berbicara dengan AI dengan fitur streaming response
 * Menggunakan react-markdown untuk rendering output seperti ChatGPT
 * Opsi A: Tanpa simulasi typing - chunk langsung ditampilkan untuk responsiveness
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { chatWithAiStream } from "../../services/aiService";

// Import highlight.js CSS untuk code syntax highlighting
import "highlight.js/styles/github-dark.css";

const AiChatPanelStream = ({ taskId, taskTitle, taskDescription, onClose }) => {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: taskTitle
        ? `Halo! Saya AI Assistant. Saya siap membantu Anda dengan task "${taskTitle}". Apa yang ingin Anda tanyakan?`
        : "Halo! Saya AI Assistant. Ada yang bisa saya bantu?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortStreamRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortStreamRef.current) {
        abortStreamRef.current();
      }
    };
  }, []);

  const handleSend = async () => {
    if (!input.trim() || loading || isStreaming) return;

    const userMessage = input.trim();
    setInput("");
    setError(null);

    // Add user message
    const newMessages = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setLoading(true);
    setIsStreaming(true);
    setStreamingContent("");

    try {
      // Build history from messages (excluding the initial greeting)
      const history = messages.slice(1).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Start streaming
      abortStreamRef.current = chatWithAiStream({
        taskId,
        message: userMessage,
        history,
        onChunk: (chunk) => {
          setLoading(false);
          // Langsung tampilkan chunk tanpa simulasi
          setStreamingContent((prev) => prev + chunk);
        },
        onComplete: (result) => {
          setIsStreaming(false);
          setStreamingContent((prevContent) => {
            // Add the complete message to messages
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: prevContent,
                tokensUsed: result?.tokensUsed,
                responseTime: result?.responseTime,
              },
            ]);
            return "";
          });
        },
        onError: (errorMessage) => {
          setLoading(false);
          setIsStreaming(false);
          setError(errorMessage);
          setStreamingContent("");
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content:
                "Maaf, saya mengalami kesulitan memproses permintaan Anda. Silakan coba lagi.",
              isError: true,
            },
          ]);
        },
      });
    } catch (err) {
      setLoading(false);
      setIsStreaming(false);
      setError(err.message || "Terjadi error");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Maaf, saya mengalami kesulitan memproses permintaan Anda. Silakan coba lagi.",
          isError: true,
        },
      ]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStopStreaming = () => {
    if (abortStreamRef.current) {
      abortStreamRef.current();
      setIsStreaming(false);
      setLoading(false);
      if (streamingContent) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: streamingContent + " [Dihentikan]",
          },
        ]);
        setStreamingContent("");
      }
    }
  };

  const suggestedQuestions = taskId
    ? [
        "Bagaimana cara menyelesaikan task ini?",
        "Apa langkah-langkah implementasinya?",
        "Berapa estimasi waktu yang diperlukan?",
        "Apa potensi risiko dari task ini?",
      ]
    : [
        "Apa itu Agile methodology?",
        "Bagaimana cara membuat user story yang baik?",
        "Tips untuk sprint planning yang efektif?",
        "Cara mengestimasi story points?",
      ];

  // Custom components untuk ReactMarkdown dengan styling ChatGPT-like
  const MarkdownComponents = {
    // Headings
    h1: ({ children }) => (
      <h1 className="text-xl font-bold mt-4 mb-2 text-gray-900 dark:text-white">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-lg font-bold mt-3 mb-2 text-gray-900 dark:text-white">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-base font-bold mt-3 mb-1 text-gray-900 dark:text-white">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-sm font-bold mt-2 mb-1 text-gray-900 dark:text-white">
        {children}
      </h4>
    ),

    // Paragraphs
    p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,

    // Lists
    ul: ({ children }) => (
      <ul className="list-disc list-outside ml-4 mb-2 space-y-1">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-outside ml-4 mb-2 space-y-1">
        {children}
      </ol>
    ),
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,

    // Code blocks
    code: ({ inline, className, children, ...props }) => {
      if (inline) {
        return (
          <code
            className="bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded text-sm font-mono text-purple-600 dark:text-purple-300"
            {...props}
          >
            {children}
          </code>
        );
      }
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
    pre: ({ children }) => (
      <pre className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 my-3 overflow-x-auto text-sm">
        {children}
      </pre>
    ),

    // Blockquote
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-purple-500 pl-4 py-1 my-2 italic bg-purple-50 dark:bg-purple-900/20 rounded-r">
        {children}
      </blockquote>
    ),

    // Links
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-purple-600 dark:text-purple-400 hover:underline"
      >
        {children}
      </a>
    ),

    // Tables
    table: ({ children }) => (
      <div className="overflow-x-auto my-3">
        <table className="min-w-full border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="bg-gray-100 dark:bg-gray-700">{children}</thead>
    ),
    tbody: ({ children }) => <tbody>{children}</tbody>,
    tr: ({ children }) => (
      <tr className="border-b border-gray-200 dark:border-gray-600">
        {children}
      </tr>
    ),
    th: ({ children }) => (
      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-white">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
        {children}
      </td>
    ),

    // Horizontal rule
    hr: () => <hr className="my-4 border-gray-300 dark:border-gray-600" />,

    // Strong and emphasis
    strong: ({ children }) => (
      <strong className="font-semibold text-gray-900 dark:text-white">
        {children}
      </strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
  };

  // Render markdown content
  const renderMarkdown = (content) => {
    if (!content) return null;
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={MarkdownComponents}
      >
        {content}
      </ReactMarkdown>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2L13.09 8.26L19 9L13.91 11.74L15 18L12 13.5L9 18L10.09 11.74L5 9L10.91 8.26L12 2Z"
              fill="currentColor"
            />
          </svg>
          <span className="font-semibold">AI Assistant</span>
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
            Streaming
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-4 py-3 ${
                message.role === "user"
                  ? "bg-purple-600 text-white"
                  : message.isError
                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                  : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
              }`}
            >
              <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                {message.role === "user" ? (
                  <p className="mb-0 whitespace-pre-wrap">{message.content}</p>
                ) : (
                  renderMarkdown(message.content)
                )}
              </div>
              {message.responseTime && (
                <div className="text-xs opacity-60 mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                  ⚡ {(message.responseTime / 1000).toFixed(1)}s
                  {message.tokensUsed && (
                    <span className="ml-2">
                      • {message.tokensUsed.total} tokens
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Streaming content - langsung tampilkan chunk */}
        {streamingContent && (
          <div className="flex justify-start">
            <div className="max-w-[85%] bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-lg px-4 py-3">
              <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                {renderMarkdown(streamingContent)}
              </div>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {loading && !streamingContent && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length <= 2 && !isStreaming && (
        <div className="px-4 pb-2">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Pertanyaan yang disarankan:
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => setInput(question)}
                className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="px-4 pb-2">
          <div className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded p-2">
            Error: {error}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ketik pesan Anda..."
            disabled={loading || isStreaming}
            className="flex-1 resize-none border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white text-sm max-h-32"
            rows={1}
          />
          {isStreaming ? (
            <button
              onClick={handleStopStreaming}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
              Stop
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
              Kirim
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Tekan Enter untuk mengirim, Shift+Enter untuk baris baru
        </p>
      </div>
    </div>
  );
};

export default AiChatPanelStream;
