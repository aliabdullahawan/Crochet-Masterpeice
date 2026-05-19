export type ReturnStatus = "none" | "pending" | "confirmed";

export const RETURN_STATUS_LABEL: Record<ReturnStatus, string> = {
  none: "No return",
  pending: "Return pending",
  confirmed: "Return confirmed",
};

export function normalizeReturnStatus(value: string | null | undefined): ReturnStatus {
  const raw = String(value ?? "none").toLowerCase();
  if (raw === "pending" || raw === "confirmed") return raw;
  return "none";
}

/** Revenue counted in analytics after returns. */
export function netOrderRevenue(totalAmount: number, returnStatus: string | null | undefined) {
  const status = normalizeReturnStatus(returnStatus);
  if (status === "confirmed") return 0;
  return Math.max(0, Number(totalAmount) || 0);
}

export function returnStatusBadgeClass(status: ReturnStatus) {
  if (status === "pending") return "bg-amber-50 text-amber-700 border-amber-200";
  if (status === "confirmed") return "bg-orange-50 text-orange-700 border-orange-200";
  return "";
}
