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
  shop: "Store",
  land: "Trees"
} as const;

export const LAND_USE_OPTIONS = [
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
  { value: "agricultural", label: "Agricultural" },
  { value: "industrial", label: "Industrial" },
  { value: "mixed", label: "Mixed Use" },
] as const;

export const LAND_SIZE_UNITS = [
  { value: "lots", label: "Lots" },
  { value: "acres", label: "Acres" },
  { value: "sqm", label: "Sq Meters" },
  { value: "hectares", label: "Hectares" },
] as const;

export const TITLE_DEED_STATUSES = [
  { value: "deeded", label: "Deeded (Title Deed)" },
  { value: "tribal", label: "Tribal Land" },
  { value: "public", label: "Public Land" },
  { value: "disputed", label: "Disputed" },
  { value: "unknown", label: "Unknown" },
] as const;

export const TOPOGRAPHY_OPTIONS = [
  { value: "flat", label: "Flat" },
  { value: "sloped", label: "Sloped" },
  { value: "hilly", label: "Hilly" },
  { value: "swampy", label: "Swampy" },
  { value: "mixed", label: "Mixed" },
] as const;

export const UTILITIES_OPTIONS = [
  { value: "water", label: "Water" },
  { value: "electricity", label: "Electricity" },
  { value: "internet", label: "Internet" },
  { value: "sewage", label: "Sewage" },
  { value: "road", label: "Paved Road" },
] as const;

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
