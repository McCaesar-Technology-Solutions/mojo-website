/** Approved reviews are the only rows that count toward a public rating. */

export interface ApprovedReviewStats {
  rating: number | null;
  reviewCount: number;
}

export function approvedReviewStats(ratings: number[]): ApprovedReviewStats {
  if (ratings.length === 0) return { rating: null, reviewCount: 0 };
  const total = ratings.reduce((sum, rating) => sum + rating, 0);
  const average = total / ratings.length;
  const rating = Math.round((average + Number.EPSILON) * 100) / 100;
  return { rating, reviewCount: ratings.length };
}

export function enquiryConversionPercent(approved: number, enquiries: number) {
  if (enquiries === 0) return 0;
  return Math.round((approved / enquiries) * 100);
}

export interface AdminOpsMetrics {
  publishedProperties: number;
  newEnquiries: number;
  enquiries: number;
  approvedEnquiries: number;
  bookings: number;
  revenue: number;
  nightsBooked: number;
}

const METRIC_KEYS = [
  "published_properties",
  "new_enquiries",
  "enquiries",
  "approved_enquiries",
  "bookings",
  "revenue",
  "nights_booked",
] as const;

function finiteMetric(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

export function parseAdminOpsMetrics(value: unknown): AdminOpsMetrics {
  if (!value || typeof value !== "object") {
    throw new Error("Analytics could not be read.");
  }
  const row = value as Record<string, unknown>;
  const metrics = {} as Record<(typeof METRIC_KEYS)[number], number>;
  for (const key of METRIC_KEYS) {
    const metric = finiteMetric(row[key]);
    if (metric === null) throw new Error("Analytics could not be read.");
    metrics[key] = metric;
  }
  return {
    publishedProperties: metrics.published_properties,
    newEnquiries: metrics.new_enquiries,
    enquiries: metrics.enquiries,
    approvedEnquiries: metrics.approved_enquiries,
    bookings: metrics.bookings,
    revenue: metrics.revenue,
    nightsBooked: metrics.nights_booked,
  };
}

export function reviewMutationErrorMessage(error: { message?: string } | null | undefined) {
  const message = error?.message ?? "";
  if (message.includes("REVIEW_NOT_FOUND")) return "Review not found.";
  if (message.includes("REVIEW_NOT_AUTHORIZED")) return "Admin access required.";
  if (message.includes("REVIEW_INVALID_STATUS")) return "That review status is not valid.";
  if (message.includes("ANALYTICS_NOT_AUTHORIZED")) return "Admin access required.";
  return "Something went wrong. Please try again.";
}
