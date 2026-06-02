export default function MerchantLayout({ children }) {
  return (
    <div className="merchant-layout">
      {children}
      <footer className="merchant-shared-mobile-footer mt-4 bg-[#e8ad2f] border-t border-[#d49b22] text-[#2f2a1f] lg:hidden">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-4 grid grid-cols-2 gap-4 text-[12px]">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-[3px] bg-[#0f7d49] text-white text-[20px] font-bold flex items-center justify-center leading-none">G</div>
              <span className="text-[24px] leading-none font-semibold text-[#0f7d49]">GOLO</span>
            </div>
            <p className="mt-2 text-[11px] max-w-[250px]">The all-in-one management platform for modern businesses.</p>
          </div>
          <div>
            <p className="text-[15px] font-bold">Links</p>
            <div className="mt-2 space-y-1 text-[12px]"><p>Overview</p><p>Inventory</p><p>Posts</p><p>Profile</p></div>
          </div>
          <div className="space-y-1 text-[12px]"><p>Analytics</p><p>Contact</p></div>
          <div>
            <p className="text-[15px] font-bold">Support</p>
            <div className="mt-2 space-y-1 text-[12px]"><p>Help Center</p><p>Security</p><p>Terms of Service</p></div>
          </div>
        </div>
        <div className="mx-auto w-full max-w-[1400px] px-4 py-2 border-t border-[#d49b22] flex items-center justify-between gap-3 text-[10px]">
          <p>© 2026 GOLO Dashboard. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
