import * as Progress from "@radix-ui/react-progress";
import { cn } from "../../lib/utils";

interface ProgressBarProps {
  className?: string;
  value?: number;
}

export default function ProgressBar(props: ProgressBarProps) {
  const { className, value } = props

  return (
    <Progress.Root
      className={cn(
        'relative h-4 w-full overflow-hidden rounded-full bg-secondary',
        className
      )}
    >
      <Progress.Indicator
        className="h-full w-full flex-1 bg-primary transition-all"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </Progress.Root>
  );
}