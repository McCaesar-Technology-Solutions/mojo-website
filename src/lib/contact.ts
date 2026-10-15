/** Public guest contact — matches www.mojoapartmentsgh.com */
export const MOJO_ENQUIRY_EMAIL = "enquiry@mojoapartmentsgh.com";

export const MOJO_PHONES = [
  { display: "020 849 1988", tel: "+233208491988", wa: "233208491988" },
  { display: "054 883 1831", tel: "+233548831831", wa: "233548831831" },
  { display: "024 381 3788", tel: "+233243813788", wa: "233243813788" },
] as const;

export const MOJO_WHATSAPP_DEFAULT = MOJO_PHONES[0].wa;
