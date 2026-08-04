export const ghs = (n: number) => `GHS ${Math.round(n).toLocaleString()}`;

export const fmtDate = (v: string) =>
  v
    ? new Date(v + "T00:00:00").toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Select date";

export function nightsBetween(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return 0;
  const ms = new Date(checkOut + "T00:00:00").getTime() - new Date(checkIn + "T00:00:00").getTime();
  return Math.max(0, Math.round(ms / 86400000));
}

export function calcStayTotal(
  nightly: number,
  nights: number,
  cleaning: number,
  serviceRate: number,
) {
  const subtotal = nightly * nights;
  const serviceFee = Math.round(subtotal * serviceRate);
  const total = nights > 0 ? subtotal + cleaning + serviceFee : 0;
  return { subtotal, serviceFee, total, nights };
}

export function locationLabel(city: string, area?: string | null) {
  return area ? `${area}, ${city}` : city;
}

export function whatsappEnquiryLink(
  phone: string,
  propertyTitle: string,
  checkIn: string,
  checkOut: string,
  guests: number,
) {
  const text = encodeURIComponent(
    `Hi MOJO, I'd like to enquire about ${propertyTitle} from ${checkIn} to ${checkOut} for ${guests} guest(s).`,
  );
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${text}`;
}
