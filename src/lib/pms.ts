const PMS_ORIGIN = () => (process.env.PMS_URL ?? "").replace(/\/$/, "");
const PMS_SECRET = () => process.env.PMS_SYNC_SECRET?.trim() ?? "";

export function isPmsConfigured() {
  return Boolean(PMS_ORIGIN() && PMS_SECRET().length >= 16);
}

async function pmsFetch(path: string, body: unknown) {
  if (!isPmsConfigured()) {
    return {
      ok: false as const,
      status: 503,
      code: "UNCONFIGURED",
      error: "PMS sync is not configured.",
    };
  }

  const response = await fetch(`${PMS_ORIGIN()}${path}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${PMS_SECRET()}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = (await response.json().catch(() => ({}))) as {
    ok?: boolean;
    error?: string;
    code?: string;
    reservationId?: string;
    status?: string;
    reused?: boolean;
  };

  if (!response.ok) {
    return {
      ok: false as const,
      status: response.status,
      code: json.code ?? "PMS_ERROR",
      error: json.error ?? `PMS responded ${response.status}`,
    };
  }

  return {
    ok: true as const,
    reservationId: json.reservationId ?? null,
    status: json.status ?? null,
    reused: Boolean(json.reused),
  };
}

export async function syncEnquiryToPms(input: {
  enquiryId: string;
  propertyId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  fullName: string;
  email: string;
  phone: string;
  notes?: string | null;
}) {
  return pmsFetch("/api/website/enquiries", input);
}

export async function confirmEnquiryInPms(enquiryId: string) {
  return pmsFetch("/api/website/enquiries/confirm", { enquiryId });
}

export async function declineEnquiryInPms(enquiryId: string) {
  return pmsFetch("/api/website/enquiries/decline", { enquiryId });
}
