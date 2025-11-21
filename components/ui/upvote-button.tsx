import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";

interface UpvoteButtonProps {
  votes: number;
  hasUpvoted?: boolean;
  hasDownvoted?: boolean;
  onUpvote: () => void;
  onDownvote: () => void;
  disabled?: boolean;
}

export function UpvoteButton({
  votes,
  hasUpvoted = false,
  hasDownvoted = false,
  onUpvote,
  onDownvote,
  disabled = false,
}: UpvoteButtonProps) {
  return (
    <div className="inline-flex -space-x-px rounded-full shadow-sm shadow-black/5 rtl:space-x-reverse">
      <Button
        className={`rounded-none shadow-none first:rounded-s-full last:rounded-e-full focus-visible:z-10 ${
          hasUpvoted
            ? "bg-clay-500 text-white hover:bg-clay-600"
            : "bg-white hover:bg-clay-50"
        }`}
        size="icon"
        aria-label="Upvote"
        onClick={onUpvote}
        disabled={disabled}
      >
        <ChevronUp
          size={16}
          strokeWidth={2}
          aria-hidden="true"
          className={hasUpvoted ? "text-white" : "text-gray-600"}
        />
      </Button>
      <span className="flex items-center bg-clay-500 px-3 text-sm font-medium text-white min-w-[40px] justify-center">
        {votes}
      </span>
      <Button
        className={`rounded-none shadow-none first:rounded-s-full last:rounded-e-full focus-visible:z-10 ${
          hasDownvoted
            ? "bg-clay-500 text-white hover:bg-clay-600"
            : "bg-white hover:bg-clay-50"
        }`}
        size="icon"
        aria-label="Downvote"
        onClick={onDownvote}
        disabled={disabled}
      >
        <ChevronDown
          size={16}
          strokeWidth={2}
          aria-hidden="true"
          className={hasDownvoted ? "text-white" : "text-gray-600"}
        />
      </Button>
    </div>
  );
}
