export const LIBERIA_COUNTIES = [
  "Bomi",
  "Bong",
  "Gbarpolu",
  "Grand Bassa",
  "Grand Cape Mount",
  "Grand Gedeh",
  "Grand Kru",
  "Lofa",
  "Margibi",
  "Maryland",
  "Montserrado",
  "Nimba",
  "River Cess",
  "River Gee",
  "Sinoe"
] as const;

export const PROPERTY_TYPE_ICONS = {
  house: "Home",
  apartment: "Building2",
  shop: "Store"
} as const;

export const LISTING_TYPE_LABELS = {
  for_sale: "For Sale",
  for_rent: "For Rent",
  for_lease: "For Lease"
} as const;

export const STATUS_LABELS = {
  active: "Active",
  inactive: "Inactive",
  sold: "Sold",
  rented: "Rented",
  negotiating: "Negotiating",
  taken: "Taken"
} as const;

export const STATUS_COLORS = {
  active: "bg-green-500",
  negotiating: "bg-yellow-500",
  taken: "bg-gray-500"
} as const;

// Liberian Dollar exchange rate (approximate)
export const USD_TO_LRD_RATE = 192;

export const formatLRD = (usd: number) => {
  const lrd = usd * USD_TO_LRD_RATE;
  return `L$${lrd.toLocaleString()}`;
};

export const formatWhatsAppLink = (phone: string, message: string) => {
  const cleanPhone = phone.replace(/\D/g, '');
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
};

export const VERIFICATION_STATUS_LABELS = {
  none: "Not Requested",
  pending: "Pending",
  approved: "Verified",
  rejected: "Rejected",
  expired: "Expired"
} as const;
