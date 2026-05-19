"use client";

import React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Mail, X } from "lucide-react";

export function CheckoutSuccessModal({
  open,
  orderRef,
  email,
  accountExists,
  magicLinkIncluded,
  whatsappUrl,
  onClose,
}: {
  open: boolean;
  orderRef: string;
  email: string;
  accountExists: boolean;
  magicLinkIncluded: boolean;
  whatsappUrl?: string;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-ink-dark/45 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 16 }}
            className="w-full max-w-md glass rounded-3xl border border-caramel/25 shadow-card overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div className="relative px-6 pt-8 pb-6 text-center" role="dialog" aria-modal="true" aria-labelledby="checkout-success-title">
              <button
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 rounded-xl text-ink-light/50 hover:bg-caramel/10 hover:text-ink transition"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-100 to-caramel/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-9 h-9 text-green-600" />
              </div>

              <h2 id="checkout-success-title" className="font-display text-xl font-semibold text-ink-dark mb-2">
                Your order query has been sent!
              </h2>
              <p className="text-sm text-ink-light/70 font-sans leading-relaxed mb-4">
                Our admin team will review your request soon and update you by email. Thank you for choosing Crochet
                Masterpiece.
              </p>

              <div className="rounded-2xl bg-cream-50 border border-caramel/15 px-4 py-3 text-left mb-4">
                <p className="text-xs text-ink-light/55 font-sans mb-1">Order reference</p>
                <p className="text-sm font-semibold text-caramel font-sans">{orderRef}</p>
              </div>

              <div className="flex items-start gap-2.5 rounded-2xl bg-blush/10 border border-blush/20 px-4 py-3 text-left mb-5">
                <Mail className="w-4 h-4 text-caramel flex-shrink-0 mt-0.5" />
                <p className="text-xs text-ink-light/75 font-sans leading-relaxed">
                  A confirmation email was sent to <strong className="text-ink-dark">{email}</strong>.
                  {accountExists && magicLinkIncluded && (
                    <>
                      {" "}
                      It includes a <strong>magic sign-in link</strong> so you can track this order without a password.
                    </>
                  )}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Link
                  href="/user/orders"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-caramel to-rose text-white text-sm font-semibold shadow-button hover:opacity-95 transition"
                >
                  View My Orders
                </Link>
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 rounded-xl border border-[#25D366]/40 text-[#128C7E] text-sm font-semibold bg-[#25D366]/10 hover:bg-[#25D366]/15 transition"
                  >
                    Also message us on WhatsApp
                  </a>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 text-xs font-semibold text-ink-light/60 hover:text-ink transition"
                >
                  Continue shopping
                </button>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
