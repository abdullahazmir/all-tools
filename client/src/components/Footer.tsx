import Link from "next/link";

import { FaFacebookF } from "react-icons/fa";
import { FaLinkedinIn, FaXTwitter } from "react-icons/fa6";
import { FaInstagram } from "react-icons/fa";

const SOCIAL_LINKS = [
  { label: "Facebook", href: "https://facebook.com", icon: <FaFacebookF size={20} /> },
  { label: "Twitter", href: "https://twitter.com", icon: <FaXTwitter size={20} /> },
  { label: "Instagram", href: "https://instagram.com", icon: <FaInstagram size={20} /> },
  { label: "LinkedIn", href: "https://linkedin.com", icon: <FaLinkedinIn size={20} /> },
];

export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-light-gray dark:border-neutral-800 dark:bg-neutral-950">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-lg font-bold text-brand-700 dark:text-brand-100">🔧 ToolBazaar</p>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            A marketplace connecting local hand &amp; machine tool shops with buyers who need them.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Quick Links</p>
          <ul className="mt-2 space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
            <li><Link href="/explore" className="hover:underline">Explore Tools</Link></li>
            <li><Link href="/become-seller" className="hover:underline">Become a Seller</Link></li>
            <li><Link href="/about" className="hover:underline">About Us</Link></li>
            <li><Link href="/contact" className="hover:underline">Contact</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Contact</p>
          <ul className="mt-2 space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
            <li>
              <a href="mailto:support@toolbazaar.dev" className="hover:underline">
                support@toolbazaar.dev
              </a>
            </li>
            <li>+880 1XXX-XXXXXX</li>
            <li>Mirpur, Dhaka, Bangladesh</li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Follow Us</p>
          <div className="mt-2 flex gap-3">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 text-lg transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-neutral-200 px-4 py-4 text-center text-xs text-neutral-500 dark:border-neutral-800">
        © {new Date().getFullYear()} ToolBazaar. All rights reserved.
      </div>
    </footer>
  );
}
