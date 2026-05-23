"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

type AdminLeftPanelProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  widthClass?: string;
};

/** Edit / detail panel that slides in from the left (admin list pages). */
export function AdminLeftPanel({
  open,
  title,
  onClose,
  children,
  widthClass = "w-full max-w-md lg:max-w-lg",
}: AdminLeftPanelProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          key="admin-left-panel"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "auto", opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 34 }}
          className={`flex-shrink-0 border-r border-caramel/15 bg-cream-50/98 backdrop-blur-sm overflow-hidden ${widthClass}`}
        >
          <div className="flex flex-col h-full min-w-[min(100vw-2rem,28rem)] lg:min-w-[32rem] max-h-[calc(100vh-57px)]">
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-caramel/12 flex-shrink-0">
              <h2 className="font-display text-lg font-semibold text-ink-dark truncate">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-caramel/10 text-ink-light transition-colors btn-bubble"
                aria-label="Close panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
