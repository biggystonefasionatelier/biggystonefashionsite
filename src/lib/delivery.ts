export type DeliveryMethod = "pickup" | "delivery";

export type DeliveryZone = {
  id: string;
  group: "Lagos Mainland" | "Lagos Island" | "Outside Lagos";
  label: string;
  areas: string[];
  fee: number;
  eta: string;
};

export const DELIVERY_ZONES: DeliveryZone[] = [
  {
    id: "mainland-1",
    group: "Lagos Mainland",
    label: "Mainland 1",
    areas: ["Surulere", "Yaba", "Ebute-Metta", "Fadeyi", "Ojuelegba", "Oyingbo", "Ilupeju"],
    fee: 2000,
    eta: "1-2 business days",
  },
  {
    id: "mainland-2",
    group: "Lagos Mainland",
    label: "Mainland 2",
    areas: ["Gbagada", "Anthony", "Mushin", "Maryland", "Ogudu"],
    fee: 2500,
    eta: "1-2 business days",
  },
  {
    id: "mainland-3",
    group: "Lagos Mainland",
    label: "Mainland 3",
    areas: ["Ikeja", "Alapere", "Ketu", "Mile 12", "Oshodi", "Ojota"],
    fee: 3000,
    eta: "1-2 business days",
  },
  {
    id: "mainland-4",
    group: "Lagos Mainland",
    label: "Mainland 4",
    areas: [
      "Ogba", "Apapa", "Ajegunle", "Ijora", "Airport Road", "Ago Palace", "Isheri",
      "Magodo", "Ojodu", "Berger", "Ajao Estate", "Isolo", "Omole Phase 1 & 2",
    ],
    fee: 3500,
    eta: "1-2 business days",
  },
  {
    id: "mainland-5",
    group: "Lagos Mainland",
    label: "Mainland 5",
    areas: [
      "Egbeda", "Abule-Egba", "Iyana-Ipaja", "Agege", "Ifako-Ijaiye", "Ikotun",
      "Badagry", "Festac", "Amuwo-Odofin", "Ejigbo",
    ],
    fee: 4000,
    eta: "1-3 business days",
  },
  {
    id: "mainland-6",
    group: "Lagos Mainland",
    label: "Mainland 6",
    areas: ["Lasu", "Igando", "Iju", "Iju-Ishaga", "Ojo", "Trade Fair"],
    fee: 4000,
    eta: "1-3 business days",
  },
  {
    id: "mainland-7",
    group: "Lagos Mainland",
    label: "Mainland 7",
    areas: ["Ikorodu", "Badagry"],
    fee: 4500,
    eta: "1-3 business days",
  },
  {
    id: "island-1",
    group: "Lagos Island",
    label: "Island 1",
    areas: ["Lagos Island", "Ikoyi", "Obalende", "Victoria Island", "Oniru", "Lekki Phase 1"],
    fee: 3000,
    eta: "1-2 business days",
  },
  {
    id: "island-2",
    group: "Lagos Island",
    label: "Island 2",
    areas: ["Ikate", "Jakande", "Agungi", "Osapa London", "Chevron", "Orchid"],
    fee: 3500,
    eta: "1-2 business days",
  },
  {
    id: "island-3",
    group: "Lagos Island",
    label: "Island 3",
    areas: ["Ikota", "VGC", "Ajah", "Abraham Adesanya"],
    fee: 4000,
    eta: "1-2 business days",
  },
  {
    id: "island-4",
    group: "Lagos Island",
    label: "Island 4",
    areas: ["Sangotedo"],
    fee: 4500,
    eta: "1-3 business days",
  },
  {
    id: "island-5",
    group: "Lagos Island",
    label: "Island 5",
    areas: ["Awoyaya", "Abijo", "Ibeju-Lekki", "Epe", "Lakowe"],
    fee: 5000,
    eta: "1-3 business days",
  },
  {
    id: "outside-1",
    group: "Outside Lagos",
    label: "Outside Lagos 1",
    areas: ["Oyo", "Ogun", "Kwara", "Ekiti", "Osun", "Ondo", "Edo", "Delta"],
    fee: 6500,
    eta: "3-5 business days",
  },
  {
    id: "outside-2",
    group: "Outside Lagos",
    label: "Outside Lagos 2",
    areas: ["Bayelsa", "Rivers", "Enugu", "Anambra", "Ebonyi", "Imo", "Abia", "Abuja (FCT)"],
    fee: 7000,
    eta: "3-7 business days",
  },
  {
    id: "outside-3",
    group: "Outside Lagos",
    label: "Outside Lagos 3",
    areas: [
      "Akwa Ibom", "Cross River", "Niger", "Kaduna", "Benue", "Nasarawa", "Plateau",
      "Kogi", "Jigawa", "Kano", "Katsina", "Zamfara", "Sokoto", "Kebbi", "Gombe",
      "Bauchi", "Yobe", "Borno", "Adamawa", "Taraba",
    ],
    fee: 7500,
    eta: "3-7 business days",
  },
];

export function findDeliveryZone(zoneId: string | undefined): DeliveryZone | undefined {
  return DELIVERY_ZONES.find((z) => z.id === zoneId);
}

/**
 * Pickup is always free. Delivery is priced by zone (see DELIVERY_ZONES).
 * No standing Friday promo anymore - the only current free-delivery rule
 * is the September launch promo (orders ≥ PROMO.freeDeliveryThreshold),
 * applied separately in the checkout route since it's time-boxed.
 */
export function calculateDeliveryFee(method: DeliveryMethod, zoneId: string | undefined): number {
  if (method !== "delivery") return 0;
  return findDeliveryZone(zoneId)?.fee ?? 0;
}
