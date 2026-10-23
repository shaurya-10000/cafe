import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownMessageProps {
  text: string;
}

/** Assistant/user message body: GFM markdown with themed tables and safe links. */
export function MarkdownMessage({ text }: MarkdownMessageProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        table: ({ node: _node, ...props }) => (
          <div className="my-2 overflow-x-auto rounded-lg border border-cafe-border">
            <table
              className="w-full border-collapse text-left text-[11px]"
              {...props}
            />
          </div>
        ),
        th: ({ node: _node, ...props }) => (
          <th
            className="border-b border-cafe-border bg-cafe-fg/5 p-2 font-black uppercase text-cafe-fg"
            {...props}
          />
        ),
        td: ({ node: _node, ...props }) => (
          <td
            className="border-b border-cafe-border p-2 text-cafe-fg/80"
            {...props}
          />
        ),
        a: ({ node: _node, ...props }) => (
          <a
            {...props}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-cafe-accent hover:text-cafe-accent/80"
          />
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
}