'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full bg-[#1A1A1A] text-white px-8 pt-[40px] pb-[24px] font-sans mt-12">
      <div className="max-w-[1320px] mx-auto">
        {/* Top Section — 5 Columns */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-8 text-sm">
          {/* Column 1: News */}
          <div>
            <h4 className="text-white font-bold text-base mb-4">News</h4>
            <ul className="space-y-2 text-[#9CA3AF] text-[13px]">
              <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link href="/sources" className="hover:text-white transition-colors">Sources</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
              <li><Link href="/?q=Fact%20Check" className="hover:text-white transition-colors">Fact Check</Link></li>
            </ul>
          </div>

          {/* Column 2: By Region */}
          <div>
            <h4 className="text-white font-bold text-base mb-4">By Region</h4>
            <ul className="space-y-2 text-[#9CA3AF] text-[13px]">
              <li><Link href="/?q=National" className="hover:text-white transition-colors">National</Link></li>
              <li><Link href="/?q=North%20India" className="hover:text-white transition-colors">North India</Link></li>
              <li><Link href="/?q=South%20India" className="hover:text-white transition-colors">South India</Link></li>
              <li><Link href="/?q=East%20India" className="hover:text-white transition-colors">East India</Link></li>
              <li><Link href="/?q=West%20India" className="hover:text-white transition-colors">West India</Link></li>
              <li><Link href="/?q=Northeast%20India" className="hover:text-white transition-colors">Northeast India</Link></li>
            </ul>
          </div>

          {/* Column 3: Trending in India */}
          <div>
            <h4 className="text-white font-bold text-base mb-4">Trending in India</h4>
            <ul className="space-y-2 text-[#9CA3AF] text-[13px]">
              <li><Link href="/?q=Artificial%20Intelligence" className="hover:text-white transition-colors">Artificial Intelligence</Link></li>
              <li><Link href="/?q=Supreme%20Court" className="hover:text-white transition-colors">Supreme Court</Link></li>
              <li><Link href="/?q=Election%20Commission" className="hover:text-white transition-colors">Election Commission</Link></li>
              <li><Link href="/?q=Modi%20Government" className="hover:text-white transition-colors">Modi Government</Link></li>
              <li><Link href="/?q=Kashmir" className="hover:text-white transition-colors">Kashmir</Link></li>
            </ul>
          </div>

          {/* Column 4: Help */}
          <div>
            <h4 className="text-white font-bold text-base mb-4">Help</h4>
            <ul className="space-y-2 text-[#9CA3AF] text-[13px]">
              <li><Link href="/about" className="hover:text-white transition-colors">About Panchranga</Link></li>
              <li><Link href="/about#how-it-works" className="hover:text-white transition-colors">How it works</Link></li>
              <li><Link href="/about#contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Open Source</a></li>
            </ul>
          </div>

          {/* Column 5: Tools */}
          <div>
            <h4 className="text-white font-bold text-base mb-4">Tools</h4>
            <ul className="space-y-2 text-[#9CA3AF] text-[13px]">
              <li><span className="text-[#6B7280]">Browser Extension (coming soon)</span></li>
              <li><span className="text-[#6B7280]">Daily Newsletter (coming soon)</span></li>
              <li><span className="text-[#6B7280]">Public API (coming soon)</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#333333] pt-[20px] flex flex-col sm:flex-row items-center justify-between text-[#9CA3AF] text-xs gap-4">
          <div>
            © 2026 Panchranga — Open Source, No Editors, No Paywall
          </div>
          <div className="flex gap-6">
            <Link href="/about" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
