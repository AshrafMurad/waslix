import { cn } from "cn";
import { Loader2Icon } from "lucide-react";

function Spinner({
  "aria-label": ariaLabel,
  className,
  ...props
}: React.ComponentProps<"svg">) {
  return (
    <Loader2Icon
      data-slot="spinner"
      aria-hidden={ariaLabel ? undefined : true}
      role={ariaLabel ? "status" : undefined}
      aria-label={ariaLabel}
      className={cn("text-brand-accent size-4 animate-spin", className)}
      {...props}
    />
  );
}

export { Spinner };
