import { cn } from "@/lib/utils";

export function InputGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      className={cn("relative flex w-full items-center", className)}
      {...props}
    />
  );
}

export function InputGroupAddon({
  className,
  align = "block-end",
  ...props
}: React.ComponentProps<"div"> & { align?: "block-start" | "block-end" }) {
  return (
    <div
      data-slot="input-group-addon"
      data-align={align}
      className={cn(
        "absolute right-3 flex items-center justify-center",
        align === "block-start" ? "top-3" : "top-1/2 -translate-y-1/2",
        className
      )}
      {...props}
    />
  );
}

export function InputGroupText({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="input-group-text"
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    />
  );
}
