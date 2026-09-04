import { CartProvider } from "@/components/CartContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import SignupPopup from "@/components/SignupPopup";
import SalePopup from "@/components/SalePopup";
import ReferralCapture from "@/components/ReferralCapture";
import { isPromoActive } from "@/lib/promo";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <ReferralCapture />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppButton />
      {isPromoActive() ? <SalePopup /> : <SignupPopup />}
    </CartProvider>
  );
}
