export type UserRole = "guest" | "admin";

export type PropertyStatus = "draft" | "published" | "archived";
export type PropertyType = "Apartment" | "Hotel" | "Suite" | "Serviced";
export type BookingMode = "request" | "instant";

export type EnquiryStatus = "new" | "in_review" | "approved" | "declined" | "expired";

export type BookingStatus =
  "pending_payment" | "confirmed" | "checked_in" | "completed" | "cancelled" | "refunded";

export type BlockReason = "booked" | "manual" | "hold";

export type ReviewStatus = "pending" | "approved" | "rejected";

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface PropertyPricing {
  id: string;
  property_id: string;
  nightly_rate: number;
  original_nightly_rate: number | null;
  cleaning_fee: number;
  service_fee_rate: number;
  currency: "GHS";
  discount_label: string | null;
}

export interface PropertyMedia {
  id: string;
  property_id: string;
  url: string;
  storage_path: string | null;
  sort_order: number;
  is_cover: boolean;
  alt: string | null;
}

export interface Amenity {
  id: string;
  label: string;
  icon: string;
  sort_order: number;
}

export interface Property {
  id: string;
  slug: string;
  title: string;
  type: PropertyType;
  status: PropertyStatus;
  booking_mode: BookingMode;
  city: string;
  area: string | null;
  country: string;
  description: string | null;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  size_sqm: number | null;
  rating: number | null;
  review_count: number;
  is_featured: boolean;
  check_in_time: string;
  check_out_time: string;
  house_rules: string[];
  policies: { title: string; detail: string; icon: string }[];
  created_at: string;
  updated_at: string;
  pricing?: PropertyPricing | null;
  media?: PropertyMedia[];
  amenities?: Amenity[];
}

export interface AvailabilityBlock {
  id: string;
  property_id: string;
  start_date: string;
  end_date: string;
  reason: BlockReason;
  booking_id: string | null;
  notes: string | null;
}

export interface Enquiry {
  id: string;
  property_id: string;
  user_id: string | null;
  check_in: string;
  check_out: string;
  guests: number;
  full_name: string;
  email: string;
  phone: string;
  notes: string | null;
  status: EnquiryStatus;
  admin_notes: string | null;
  decline_reason: string | null;
  nightly_rate: number;
  cleaning_fee: number;
  service_fee: number;
  total: number;
  currency: "GHS";
  created_at: string;
  updated_at: string;
  property?: Property | null;
}

export interface Booking {
  id: string;
  property_id: string;
  enquiry_id: string | null;
  user_id: string | null;
  check_in: string;
  check_out: string;
  guests: number;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  status: BookingStatus;
  nightly_rate: number;
  nights: number;
  cleaning_fee: number;
  service_fee: number;
  total: number;
  currency: "GHS";
  paystack_reference: string | null;
  paystack_access_code: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  property?: Property | null;
}

export interface Review {
  id: string;
  property_id: string;
  booking_id: string;
  user_id: string;
  rating: number;
  body: string;
  status: ReviewStatus;
  created_at: string;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  property_id: string;
  created_at: string;
  property?: Property | null;
}

export interface Message {
  id: string;
  thread_id: string;
  sender_id: string | null;
  body: string;
  created_at: string;
}

export interface MessageThread {
  id: string;
  enquiry_id: string | null;
  booking_id: string | null;
  guest_id: string | null;
  created_at: string;
  messages?: Message[];
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  meta: Record<string, unknown>;
  created_at: string;
}

export interface EnquiryInput {
  property_id: string;
  check_in: string;
  check_out: string;
  guests: number;
  full_name: string;
  email: string;
  phone: string;
  notes?: string;
  website?: string; // honeypot
}
