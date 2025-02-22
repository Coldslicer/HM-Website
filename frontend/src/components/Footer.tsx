/* ================ [ IMPORTS ] ================ */

// React components
import React from "react";

// Icons
import { Instagram, Twitter, Linkedin } from "lucide-react";

/* ================ [ COMPONENT ] ================ */

// Footer component
function Footer() {
  return (
    <footer className="bg-gray-50 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="pl-8">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WARM%20Transparent-7Qk6aLp8aveeijQInp4caIaejfpZqP.png"
              alt="Warm Logo"
              width={60}
              height={60}
              className="mb-4"
              loading="lazy"
            />
          </div>
          <div>
            <h3 className="font-bold mb-6">Legal</h3>
            <ul className="space-y-4">
              <li>
                <a href="/privacy" className="text-gray-600 hover:text-gray-900 font-medium">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" className="text-gray-600 hover:text-gray-900 font-medium">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-6">Quick Links</h3>
            <ul className="space-y-4">
              <li>
                <a href="/" className="text-gray-600 hover:text-gray-900 font-medium">
                  Home
                </a>
              </li>
              <li>
                <a href="/beta" className="text-gray-600 hover:text-gray-900 font-medium">
                  Beta Tester
                </a>
              </li>
              <li>
                <a href="#waitlist" className="text-gray-600 hover:text-gray-900 font-medium">
                  Join Waitlist
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-6">Connect</h3>
            <div className="flex gap-6 mb-6">
              <a
                href="https://www.instagram.com/hotslicer.media/"
                className="text-gray-600 hover:text-[#FF6100]"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram className="w-6 h-6" />
              </a>
              <a
                href="https://x.com/HotslicerMedia"
                className="text-gray-600 hover:text-[#FF6100]"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Twitter className="w-6 h-6" />
              </a>
              <a
                href="https://www.linkedin.com/company/hotslicer-media/"
                className="text-gray-600 hover:text-[#FF6100]"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Linkedin className="w-6 h-6" />
              </a>
            </div>
            <div className="text-sm text-gray-600 font-medium">contact@hotslicer.com</div>
          </div>
        </div>
        <div className="border-t pt-8">
          <div className="text-sm text-gray-600 text-center font-medium">
            Warm is a product of Hotslicer Media. © 2025 Hotslicer Media. All Rights Reserved
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ================ [ EXPORTS ] ================ */

export { Footer };
