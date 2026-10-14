import assert from "node:assert/strict";
import test from "node:test";
import {
  approvedReviewStats,
  enquiryConversionPercent,
  parseAdminOpsMetrics,
  reviewMutationErrorMessage,
} from "./review-stats.ts";

test("approved review stats ignore an empty set", () => {
  assert.deepEqual(approvedReviewStats([]), { rating: null, reviewCount: 0 });
});

test("approved review stats average visible ratings to two decimals", () => {
  assert.deepEqual(approvedReviewStats([5, 4, 4]), { rating: 4.33, reviewCount: 3 });
  assert.deepEqual(approvedReviewStats([1]), { rating: 1, reviewCount: 1 });
});

test("enquiry conversion matches the existing all-time percentage", () => {
  assert.equal(enquiryConversionPercent(0, 0), 0);
  assert.equal(enquiryConversionPercent(1, 3), 33);
  assert.equal(enquiryConversionPercent(2, 2), 100);
});

test("analytics payload must contain every finite metric", () => {
  const metrics = parseAdminOpsMetrics({
    published_properties: 2,
    new_enquiries: 1,
    enquiries: 4,
    approved_enquiries: 1,
    bookings: 3,
    revenue: 1500,
    nights_booked: 6,
  });
  assert.equal(metrics.bookings, 3);
  assert.equal(metrics.revenue, 1500);
  assert.throws(() => parseAdminOpsMetrics({ bookings: 0 }), /could not be read/);
  assert.throws(() => parseAdminOpsMetrics(null), /could not be read/);
});

test("review and analytics errors stay generic", () => {
  assert.equal(reviewMutationErrorMessage({ message: "REVIEW_NOT_FOUND" }), "Review not found.");
  assert.equal(
    reviewMutationErrorMessage({ message: 'relation "reviews" does not exist' }),
    "Something went wrong. Please try again.",
  );
  assert.equal(
    reviewMutationErrorMessage({ message: "ANALYTICS_NOT_AUTHORIZED" }).includes("relation"),
    false,
  );
});
