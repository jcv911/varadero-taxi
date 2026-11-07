import { config } from "@/lib/config";

export function buildWhatsAppLink(message: string): string {
  const phone = config.booking.whatsappNumber.replace(/\D/g, "");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}