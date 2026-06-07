import MerchantFooter from "./MerchantFooter";

export default function MerchantLayout({ children }) {
  return (
    <div className="merchant-layout">
      <style>{`
        .merchant-layout > div > footer {
          display: none;
        }
      `}</style>
      {children}
      <MerchantFooter />
    </div>
  );
}
