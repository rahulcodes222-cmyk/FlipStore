"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useHydration } from "@/hooks/useHydration";

export const HELP_PAGES: Record<
  string,
  { title: string; description: string; defaultContent: string }
> = {
  payments: {
    title: "Payments",
    description: "Secure and convenient payment options for every order.",
    defaultContent: `
      <h2>Payment Options</h2>
      <p>We support a wide range of secure payment methods to make your shopping experience smooth.</p>
      <h3>Supported Methods</h3>
      <ul>
        <li><strong>Credit / Debit Cards</strong> â€” Visa, Mastercard, RuPay, and American Express</li>
        <li><strong>UPI</strong> â€” Google Pay, PhonePe, Paytm, BHIM, and all UPI apps</li>
        <li><strong>Net Banking</strong> â€” All major Indian banks supported</li>
        <li><strong>Wallets</strong> â€” Paytm Wallet, Amazon Pay, Mobikwik, and Freecharge</li>
        <li><strong>Cash on Delivery (COD)</strong> â€” Available on eligible products and pincodes</li>
        <li><strong>No Cost EMI</strong> â€” Available on select products with major banks</li>
      </ul>
      <h3>Payment Security</h3>
      <p>All transactions are processed over 256-bit SSL encrypted connections. We are PCI-DSS compliant and never store your full card details on our servers.</p>
      <h3>Refund Timelines</h3>
      <p>Refunds are initiated immediately after your return is picked up or your order is cancelled. Depending on your bank, refunds reflect in your account within 3-7 business days.</p>
      <h3>Failed Payments</h3>
      <p>If your payment fails but money is deducted, it is usually auto-refunded by your bank within 5-7 business days. If not, contact our support team with your order ID and payment reference number.</p>
    `,
  },
  shipping: {
    title: "Shipping",
    description: "Everything about delivery timelines, charges, and tracking.",
    defaultContent: `
      <h2>Shipping &amp; Delivery</h2>
      <p>We deliver to more than 19,000 pincodes across India through our logistics partners.</p>
      <h3>Delivery Timelines</h3>
      <ul>
        <li><strong>Same-day delivery</strong> â€” Available in select metro cities for orders placed before 12 PM</li>
        <li><strong>Next-day delivery</strong> â€” Available on eligible products in major cities</li>
        <li><strong>Standard delivery</strong> â€” 2-7 business days depending on your location</li>
        <li><strong>Heavy / large items</strong> â€” 5-10 business days</li>
      </ul>
      <h3>Shipping Charges</h3>
      <p>A standard delivery charge applies to most orders. Orders above the free-delivery threshold qualify for <strong>free shipping</strong> â€” the threshold is shown on the product page and in your cart.</p>
      <h3>Order Tracking</h3>
      <p>Once your order is shipped, you'll receive tracking details via SMS and email. You can also track your order live under <a href="/orders">My Orders</a>.</p>
      <h3>Delivery Attempts</h3>
      <p>Our courier partners attempt delivery up to 3 times before the order is returned to the seller. Please make sure your address and phone number are accurate at checkout.</p>
    `,
  },
  returns: {
    title: "Cancellation & Returns",
    description: "Easy cancellations and hassle-free returns.",
    defaultContent: `
      <h2>Cancellation &amp; Returns</h2>
      <p>We want you to be completely satisfied with your purchase. If you're not, our returns policy makes it easy to make it right.</p>
      <h3>Order Cancellation</h3>
      <ul>
        <li>You can cancel your order <strong>before it is shipped</strong> from My Orders, at no charge.</li>
        <li>Once shipped, cancellation requests are passed to the courier â€” refunds are processed after confirmation.</li>
        <li>Prepaid orders are refunded to the original payment method within 3-7 business days.</li>
      </ul>
      <h3>Return Window</h3>
      <ul>
        <li>Most categories have a <strong>7-day</strong> easy return window from the date of delivery.</li>
        <li>Electronics and mobiles: 7 days. Clothing and footwear: 7 days. Furniture and large appliances: 7 days (installation excluded).</li>
        <li>Some products like innerwear, cosmetics (once opened), and perishables are non-returnable due to hygiene reasons.</li>
      </ul>
      <h3>How to Return</h3>
      <ol>
        <li>Go to <a href="/orders">My Orders</a> and select the item you want to return.</li>
        <li>Choose a return reason and pickup address.</li>
        <li>Our courier partner will pick up the item, usually within 2-4 days.</li>
        <li>After quality check, your refund or replacement is initiated.</li>
      </ol>
      <h3>Refunds</h3>
      <p>Refunds are credited to the original payment method. COD orders are refunded to your bank account (via NEFT) or wallet. Typical refund time is 3-7 business days after pickup.</p>
      <h3>Replacement</h3>
      <p>For damaged, defective, or wrong items, a free replacement is shipped as soon as your return is picked up, subject to stock availability.</p>
    `,
  },
  faq: {
    title: "FAQ",
    description: "Frequently asked questions about shopping with us.",
    defaultContent: `
      <h2>Frequently Asked Questions</h2>
      <h3>Orders</h3>
      <p><strong>Q. How do I place an order?</strong><br/>Add products to your cart, then proceed to checkout and complete your payment. It's that simple!</p>
      <p><strong>Q. Can I modify my order after placing it?</strong><br/>You can change the delivery address before the order is shipped. Contact support for other modifications.</p>
      <p><strong>Q. How do I track my order?</strong><br/>Go to <a href="/orders">My Orders</a> and click "Track" on your order for live status.</p>
      <h3>Payments</h3>
      <p><strong>Q. Is Cash on Delivery available?</strong><br/>Yes, on eligible products and pincodes. COD availability is shown on the product page and at checkout.</p>
      <p><strong>Q. My payment failed but money was deducted â€” what now?</strong><br/>Banks usually auto-refund within 5-7 business days. If not, contact support with your payment reference.</p>
      <h3>Returns &amp; Refunds</h3>
      <p><strong>Q. How long do refunds take?</strong><br/>3-7 business days after the returned item is picked up and passes the quality check.</p>
      <p><strong>Q. Can I return part of my order?</strong><br/>Yes â€” select only the items you want to return when creating the return request.</p>
      <h3>Account</h3>
      <p><strong>Q. How do I reset my password?</strong><br/>Use "Forgot password" on the login page. A reset link is sent to your registered email.</p>
    `,
  },
  report: {
    title: "Report Infringement",
    description: "Report copyright or trademark infringement.",
    defaultContent: `
      <h2>Report Infringement</h2>
      <p>We respect intellectual property rights and take infringement claims seriously. If you believe a product or listing on our platform infringes your copyright or trademark, you can report it to us.</p>
      <h3>How to File a Complaint</h3>
      <p>Send a written notice to <strong>legal@flipstore.in</strong> with the following information:</p>
      <ul>
        <li>Your full name, contact details, and company (if applicable)</li>
        <li>A clear description of the copyrighted or trademarked work</li>
        <li>The exact URL(s) of the infringing listing(s) on our platform</li>
        <li>Proof of ownership (registration certificate, licence, or other evidence)</li>
        <li>A statement of good-faith belief that the use is unauthorised</li>
        <li>A statement, under penalty of perjury, that the information in your notice is accurate and you are the owner or authorised to act on the owner's behalf</li>
        <li>Your physical or digital signature</li>
      </ul>
      <h3>What Happens Next</h3>
      <ol>
        <li>We acknowledge your complaint within 48 hours.</li>
        <li>The concerned seller is notified and given a chance to respond.</li>
        <li>If the claim is valid, the listing is removed and the seller may face penalties including account suspension.</li>
      </ol>
      <h3>Counter-Notification</h3>
      <p>Sellers who believe a takedown was mistaken may file a counter-notification with the same supporting evidence. We review both sides before making a final decision.</p>
      <p>Please note: knowingly filing a false infringement claim may expose you to legal liability for damages.</p>
    `,
  },
  terms: {
    title: "Terms of Use",
    description: "FlipStore Terms of Use.",
    defaultContent: `
      <h2>Terms of Use</h2>
      <p>Welcome to FlipStore. By accessing or using our website and services, you agree to be bound by these Terms of Use.</p>
      <h3>Account Responsibilities</h3>
      <p>You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account.</p>
      <h3>Orders and Payments</h3>
      <p>All orders are subject to availability and confirmation. Prices, offers, and product information may change without prior notice.</p>
      <h3>Prohibited Use</h3>
      <p>You may not misuse the platform, attempt unauthorized access, or engage in fraudulent activity.</p>
      <h3>Changes to Terms</h3>
      <p>We may update these terms from time to time. Continued use of the platform means you accept the updated terms.</p>
    `,
  },
  security: {
    title: "Security",
    description: "How FlipStore protects your account and payments.",
    defaultContent: `
      <h2>Security</h2>
      <p>Your security is our priority. FlipStore uses industry-standard safeguards to protect your personal and payment information.</p>
      <h3>Secure Transactions</h3>
      <p>Transactions are processed through secure payment channels. We do not store your full card details on our servers.</p>
      <h3>Account Safety</h3>
      <p>Keep your password private, use a strong password, and report suspicious activity to our support team immediately.</p>
      <h3>Reporting Issues</h3>
      <p>If you suspect unauthorized access or a security issue, contact support so we can investigate promptly.</p>
    `,
  },
  privacy: {
    title: "Privacy Policy",
    description: "How FlipStore collects and uses your information.",
    defaultContent: `
      <h2>Privacy Policy</h2>
      <p>FlipStore respects your privacy. We collect personal information only to process orders, provide support, and improve your shopping experience.</p>
      <h3>Information We Collect</h3>
      <p>We may collect account details, order information, delivery addresses, and payment-related metadata required to complete transactions.</p>
      <h3>How We Use Information</h3>
      <p>Your data is used for order fulfillment, customer support, fraud prevention, and service improvements.</p>
      <h3>Sharing</h3>
      <p>We do not sell your personal data. Information is shared only with trusted partners such as payment providers and logistics partners when needed to deliver services.</p>
    `,
  },
  sitemap: {
    title: "Sitemap",
    description: "Quick links to important pages on FlipStore.",
    defaultContent: `
      <h2>Sitemap</h2>
      <p>Use these links to quickly navigate important areas of FlipStore.</p>
      <h3>Shop</h3>
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/products">Products</a></li>
        <li><a href="/cart">Cart</a></li>
        <li><a href="/orders">My Orders</a></li>
      </ul>
      <h3>Help &amp; Policy</h3>
      <ul>
        <li><a href="/payments">Payments</a></li>
        <li><a href="/shipping">Shipping</a></li>
        <li><a href="/returns">Cancellation &amp; Returns</a></li>
        <li><a href="/terms">Terms of Use</a></li>
        <li><a href="/security">Security</a></li>
        <li><a href="/privacy">Privacy</a></li>
      </ul>
      <h3>Company</h3>
      <ul>
        <li><a href="/about">About Us</a></li>
        <li><a href="/careers">Careers</a></li>
        <li><a href="/contact">Contact Us</a></li>
      </ul>
    `,
  },
  contact: {
    title: "Contact Us",
    description: "Get in touch with FlipStore support.",
    defaultContent: `
      <h2>Contact Us</h2>
      <p>Have a question or need help with your order? Reach out to us and we’ll get back to you as soon as possible.</p>
      <h3>Support Channels</h3>
      <ul>
        <li><strong>Email:</strong> support@flipstore.in</li>
        <li><strong>Help Center:</strong> Visit our <a href="/faq">FAQ</a> for quick answers.</li>
      </ul>
      <p>For order-specific issues, include your order ID so we can assist you faster.</p>
    `,
  },
  affiliate: {
    title: "Become an Affiliate",
    description: "Join the FlipStore affiliate program.",
    defaultContent: `
      <h2>Become an Affiliate</h2>
      <p>Earn commission by promoting FlipStore products. Join our affiliate program and start earning with trusted brands.</p>
      <h3>How It Works</h3>
      <ul>
        <li>Sign up for the affiliate program.</li>
        <li>Share product links with your audience.</li>
        <li>Earn commission on qualifying purchases.</li>
      </ul>
      <p>Contact us for partnership details and onboarding.</p>
    `,
  },
  advertise: {
    title: "Advertise with Us",
    description: "Advertise your brand on FlipStore.",
    defaultContent: `
      <h2>Advertise with Us</h2>
      <p>Reach millions of shoppers on FlipStore. Advertise your brand and grow your business with our platform.</p>
      <h3>Advertising Options</h3>
      <ul>
        <li>Sponsored product placements</li>
        <li>Category and campaign promotions</li>
        <li>Brand visibility opportunities</li>
      </ul>
      <p>Get in touch with our team to discuss campaigns and pricing.</p>
    `,
  },
};

export default function HelpPageClient({
  slug,
  showRelatedTabs = true,
}: {
  slug: string;
  showRelatedTabs?: boolean;
}) {
  const isHydrated = useHydration();
  const meta = HELP_PAGES[slug] ?? {
    title: "Help",
    description: "Help and support.",
    defaultContent: "<p>Page not found.</p>",
  };

  const [content, setContent] = useState<string>("");
  const [dbTitle, setDbTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isHydrated) return;
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/static-pages/${slug}`,
          { credentials: "include" }
        );
        if (res.ok) {
          const json = await res.json().catch(() => ({}));
          if (json?.success && json?.data) {
            setContent(json.data.content || "");
            setDbTitle(json.data.title || "");
          }
        }
      } catch {
        // fall back to default content
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [isHydrated, slug]);

  const policySlugs = new Set(["returns", "terms", "security", "privacy", "sitemap"]);
  const isPolicy = policySlugs.has(slug);
  const policyLinks = [
    { slug: "returns", label: "Return Policy", href: "/returns" },
    { slug: "terms", label: "Terms of Use", href: "/terms" },
    { slug: "security", label: "Security", href: "/security" },
    { slug: "privacy", label: "Privacy", href: "/privacy" },
    { slug: "sitemap", label: "Sitemap", href: "/sitemap" },
  ];

  if (isPolicy) {
    return (
      <div className="min-h-[calc(100vh-200px)] bg-[#F1F3F6]">
        <div className="bg-white border-b border-[#E0E0E0]">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <nav className="text-xs text-gray-500 mb-4">
              <Link href="/" className="hover:text-[#2874F0]">Home</Link>
              <span className="mx-1.5">›</span>
              <span className="text-gray-700 font-medium">{dbTitle || meta.title}</span>
            </nav>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#212121] tracking-tight">{dbTitle || meta.title}</h1>
            <p className="text-sm text-gray-600 mt-2 max-w-3xl">{meta.description}</p>
          </div>
        </div>

        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
            <aside className="bg-white border border-[#E0E0E0] rounded-sm h-fit">
              <div className="px-4 py-3 border-b border-[#E0E0E0] text-xs font-bold text-[#878787] uppercase tracking-wider">Policy</div>
              <nav className="p-2">
                {policyLinks.map((item) => {
                  const active = item.slug === slug;
                  return (
                    <Link key={item.slug} href={item.href} className={`block px-3 py-2.5 text-sm rounded-sm transition-colors ${active ? "bg-[#F0F5FF] text-[#2874F0] font-semibold" : "text-[#212121] hover:bg-[#F5F5F5]"}`}>
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </aside>

            <main className="bg-white border border-[#E0E0E0] rounded-sm p-5 sm:p-8">
              {loading ? (
                <div className="text-center text-xs text-gray-400 py-16">Loading content…</div>
              ) : (
                <div
                  className="prose prose-sm sm:prose-base max-w-none text-gray-700
                             [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-[#212121] [&_h2]:mt-0 [&_h2]:mb-3
                             [&_h3]:text-sm [&_h3]:sm:text-base [&_h3]:font-bold [&_h3]:text-[#212121] [&_h3]:mt-6 [&_h3]:mb-2
                             [&_p]:mb-3 [&_p]:leading-7 [&_p]:text-[#333]
                             [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_ul]:space-y-1
                             [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4 [&_ol]:space-y-1
                             [&_li]:text-[#333]
                             [&_a]:text-[#2874F0] [&_a]:no-underline hover:[&_a]:underline
                             [&_strong]:font-semibold [&_strong]:text-[#212121]"
                  dangerouslySetInnerHTML={{ __html: content || meta.defaultContent }}
                />
              )}
            </main>
          </div>
        </div>
      </div>
    );
  }

  if (slug === "faq") {
    const helpLinks = [
      { slug: "payments", label: "Payments", href: "/payments" },
      { slug: "shipping", label: "Shipping", href: "/shipping" },
      { slug: "returns", label: "Cancellation & Returns", href: "/returns" },
      { slug: "faq", label: "FAQ", href: "/faq" },
    ];
    return (
      <div className="min-h-[calc(100vh-200px)] bg-[#F1F3F6]">
        <div className="bg-white border-b border-[#E0E0E0]">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <nav className="text-xs text-gray-500 mb-4">
              <Link href="/" className="hover:text-[#2874F0]">Home</Link>
              <span className="mx-1.5">›</span>
              <span className="text-gray-700 font-medium">Help Centre</span>
            </nav>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#212121] tracking-tight">{dbTitle || meta.title}</h1>
            <p className="text-sm text-gray-600 mt-2 max-w-3xl">{meta.description}</p>
          </div>
        </div>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
            <aside className="bg-white border border-[#E0E0E0] rounded-sm h-fit">
              <div className="px-4 py-3 border-b border-[#E0E0E0] text-xs font-bold text-[#878787] uppercase tracking-wider">Help Topics</div>
              <nav className="p-2">
                {helpLinks.map((item) => {
                  const active = item.slug === slug;
                  return (
                    <Link key={item.slug} href={item.href} className={`block px-3 py-2.5 text-sm rounded-sm transition-colors ${active ? "bg-[#F0F5FF] text-[#2874F0] font-semibold" : "text-[#212121] hover:bg-[#F5F5F5]"}`}>
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </aside>
            <main className="bg-white border border-[#E0E0E0] rounded-sm p-5 sm:p-8">
              {loading ? (
                <div className="text-center text-xs text-gray-400 py-16">Loading content…</div>
              ) : (
                <div
                  className="prose prose-sm sm:prose-base max-w-none text-gray-700
                             [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-[#212121] [&_h2]:mt-0 [&_h2]:mb-4 [&_h2]:pb-2 [&_h2]:border-b [&_h2]:border-[#E0E0E0]
                             [&_h3]:text-sm [&_h3]:sm:text-base [&_h3]:font-bold [&_h3]:text-[#2874F0] [&_h3]:mt-6 [&_h3]:mb-3
                             [&_p]:mb-3 [&_p]:leading-7 [&_p]:text-[#333] [&_p]:pl-0
                             [&_ul]:list-none [&_ul]:pl-0 [&_ul]:mb-4 [&_ul]:space-y-0
                             [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4 [&_ol]:space-y-2
                             [&_li]:text-[#333]
                             [&_a]:text-[#2874F0] [&_a]:no-underline hover:[&_a]:underline
                             [&_strong]:font-semibold [&_strong]:text-[#212121]"
                  dangerouslySetInnerHTML={{ __html: content || meta.defaultContent }}
                />
              )}
            </main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-200px)] py-8 sm:py-12">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-500 mb-6">
          <Link href="/" className="hover:text-[#2874F0]">Home</Link>
          <span className="mx-1.5">›</span>
          {showRelatedTabs ? (
            <>
              <Link href="/help/payments" className="hover:text-[#2874F0]">Help</Link>
              <span className="mx-1.5">›</span>
            </>
          ) : null}
          <span className="text-gray-700 font-medium">{meta.title}</span>
        </nav>

        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-black text-[#212121] tracking-tight mb-3">
            {dbTitle || meta.title}
          </h1>
          <p className="text-gray-600 text-lg">{meta.description}</p>
        </div>

        {/* Quick help nav */}
        {showRelatedTabs ? (
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {Object.entries(HELP_PAGES).map(([s, m]) => (
              <Link
                key={s}
                href={`/help/${s}`}
                className={`px-4 py-2 text-xs font-semibold rounded-full border transition-colors
                  ${slug === s
                    ? "bg-[#2874F0] text-white border-[#2874F0]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-[#2874F0] hover:text-[#2874F0]"}`}
              >
                {m.title}
              </Link>
            ))}
          </div>
        ) : null}

        {/* Content */}
        <div className="max-w-3xl mx-auto">
          {loading ? (
            <div className="text-center text-xs text-gray-400 py-16">
              Loading content…
            </div>
          ) : (
            <div
              className="prose prose-sm sm:prose-base max-w-none text-gray-700
                         [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[#212121] [&_h2]:mt-6 [&_h2]:mb-3
                         [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-[#212121] [&_h3]:mt-5 [&_h3]:mb-2
                         [&_p]:mb-3 [&_p]:leading-relaxed
                         [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ul]:space-y-1
                         [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_ol]:space-y-1
                         [&_a]:text-[#2874F0] [&_a]:underline
                         [&_strong]:font-semibold [&_strong]:text-[#212121]"
              dangerouslySetInnerHTML={{ __html: content || meta.defaultContent }}
            />
          )}
        </div>

        {/* Support CTA */}
        <div className="max-w-3xl mx-auto mt-14 p-6 rounded-lg bg-[#F1F3F6] border border-[#E0E0E0] text-center">
          <h3 className="text-sm font-bold text-[#212121] mb-2">Still need help?</h3>
          <p className="text-xs text-gray-600 mb-4">
            Our support team is available 24/7 to assist you with any question.
          </p>
          <Link
            href="/contact"
            className="inline-block px-6 py-2.5 text-xs font-bold bg-[#2874F0] hover:bg-[#1259c7] text-white rounded transition-colors"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}






