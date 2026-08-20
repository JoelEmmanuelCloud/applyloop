const STATUS_STYLES: Record<string, string> = {
  submitted: "bg-accent-soft text-accent-soft-foreground",
  reviewing: "bg-warning-soft text-warning-foreground",
  interviewing: "bg-warning-soft text-warning-foreground",
  accepted: "bg-success-soft text-success-foreground",
  hired: "bg-success-soft text-success-foreground",
  rejected: "bg-destructive-soft text-destructive-foreground",
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status.toLowerCase()] ?? "bg-muted text-muted-foreground";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium tracking-wide uppercase ${style}`}
    >
      {status}
    </span>
  );
}
