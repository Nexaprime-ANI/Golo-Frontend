export default function Footer() {
  return (
    <footer className="bg-[#efb02e] py-6 sm:py-14">
      <div className="max-w-7xl mx-auto grid grid-cols-2 gap-5 px-4 text-[12px] text-[#5a4514] sm:grid-cols-5 sm:gap-8 sm:px-6 sm:text-base">

        <div>
          <div className="flex items-center gap-2 font-semibold text-[#5a4514]">
            <div className="w-6 h-6 bg-white rounded-md"></div>
            Golo
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2 text-[#5a4514] sm:mb-4">Explore Golo</h4>
          <p className="text-[#5a4514]">Home</p>
          <p className="text-[#5a4514]">Categories</p>
          <p className="text-[#5a4514]">Deals</p>
          <p className="text-[#5a4514]">Trending</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2 text-[#5a4514] sm:mb-4">Language & Location</h4>
          <p className="text-[#5a4514]">English (US)</p>
          <p className="text-[#5a4514]">India</p>
          <p className="text-[#5a4514]">Change Location</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2 text-[#5a4514] sm:mb-4">Help & Support</h4>
          <p className="text-[#5a4514]">About Us</p>
          <p className="text-[#5a4514]">Contact Us</p>
          <p className="text-[#5a4514]">Support Center</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2 text-[#5a4514] sm:mb-4">Legal</h4>
          <p className="text-[#5a4514]">Privacy Policy</p>
          <p className="text-[#5a4514]">Terms of Service</p>
          <p className="text-[#5a4514]">Cookie Policy</p>
        </div>

      </div>
    </footer>
  );
}
