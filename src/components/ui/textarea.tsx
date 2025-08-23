import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    const innerRef = React.useRef<HTMLTextAreaElement | null>(null);

    // Combine both forwarded ref and local ref
    React.useImperativeHandle(ref, () => innerRef.current!);

    React.useEffect(() => {
      const el = innerRef.current;
      if (!el) return;

      const handleResize = () => {
        el.style.height = "auto";
        el.style.height = el.scrollHeight + "px";
      };

      // Initial resize
      handleResize();

      el.addEventListener("input", handleResize);
      return () => el.removeEventListener("input", handleResize);
    }, []);

    return (
      <textarea
        ref={innerRef}
        className={cn(
          `flex w-full resize-none overflow-hidden break-words whitespace-pre-wrap
           rounded-md border border-input bg-background px-3 py-2 text-sm 
           ring-offset-background placeholder:text-muted-foreground 
           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring 
           focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`,
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
