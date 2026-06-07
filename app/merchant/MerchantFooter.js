import Link from "next/link";

const quickLinks = [
  { label: "Orders", href: "/merchant/orders" },
  { label: "Products", href: "/merchant/products" },
  { label: "Offers", href: "/merchant/offers" },
  { label: "Banners", href: "/merchant/banners" },
];

const supportLinks = [
  { label: "Settings", href: "/merchant/settings" },
  { label: "Help", href: "/merchant/help" },
];

function SocialIcon({ label, children }) {
  return (
    <span
      aria-label={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#d79a16] bg-white/80 text-[12px] font-bold text-[#157a4f] shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
    >
      {children}
    </span>
  );
}

export default function MerchantFooter() {
  return (
    <footer className="mt-5 border-t border-[#d49b22] bg-gradient-to-br from-[#f3ba3b] via-[#e8ad2f] to-[#d89b21] text-[#1f1b12]">
      <div className="mx-auto grid w-full max-w-[1500px] grid-cols-1 gap-6 px-4 py-6 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr] lg:px-10 lg:py-8">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-[6px] bg-[#157a4f] text-[28px] font-bold leading-none text-white shadow-sm">
              G
            </div>
            <span className="text-[30px] font-semibold leading-none text-[#157a4f]">GOLO</span>
          </div>
          <p className="mt-3 max-w-[280px] text-[12px] leading-5 text-[#4f3d13]">
            Manage your store, promotions, orders, and customer engagement from one merchant dashboard.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <SocialIcon label="Facebook">f</SocialIcon>
            <SocialIcon label="Instagram">ig</SocialIcon>
            <SocialIcon label="LinkedIn">in</SocialIcon>
            <SocialIcon label="YouTube">▶</SocialIcon>
          </div>
        </div>

        <div>
          <p className="text-[15px] font-bold lg:text-[18px]">Quick Links</p>
          <div className="mt-3 grid gap-2 text-[13px] font-medium text-[#59410b]">
            {quickLinks.map((item) => (
              <Link key={item.href} href={item.href} className="transition hover:text-[#157a4f]">
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[15px] font-bold lg:text-[18px]">Support</p>
          <div className="mt-3 grid gap-2 text-[13px] font-medium text-[#59410b]">
            {supportLinks.map((item) => (
              <Link key={item.href} href={item.href} className="transition hover:text-[#157a4f]">
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-[14px] border border-white/35 bg-white/30 p-4">
          <p className="text-[15px] font-bold lg:text-[18px]">Merchant Tools</p>
          <p className="mt-2 text-[12px] leading-5 text-[#59410b]">
            Keep products updated, run offers, promote banners, and handle orders smoothly.
          </p>
        </div>
      </div>

      <div className="border-t border-[#d49b22]/80">
        <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-2 px-4 py-3 text-[10px] text-[#5f4710] sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <p>© 2026 GOLO Merchant Dashboard. All rights reserved.</p>
          <p>Built for smarter local business growth.</p>
        </div>
      </div>
    </footer>
  );
}
