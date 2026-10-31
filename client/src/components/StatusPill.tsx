const labels: Record<string, string> = {
  new: "New",
  pending: "Pending",
  assigned: "Assigned",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function StatusPill({ status }: { status: string }) {
  return <span className={`status-pill status-${status}`}>{labels[status] ?? status.replaceAll("_", " ")}</span>;
}
