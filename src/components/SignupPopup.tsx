"use client";

import { useEffect, useState } from "react";
import SignupForm from "./SignupForm";

const DISMISSED_KEY = "biggystone_signup_popup_dismissed";
const SHOW_DELAY_MS = 4000;

export default function SignupPopup() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return;

    const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, "1");
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={dismiss}
    >
      <div
        className="relative w-full max-w-sm rounded-xl bg-white p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={dismiss}
          aria-label="Close"
          className="absolute right-3 top-3 text-lg text-neutral-400 hover:text-neutral-700"
        >
          ✕
        </button>

        <h2 className="pr-6 text-lg font-bold">Get first access — and a birthday gift</h2>
        <p className="mt-2 text-sm text-neutral-600">
          Drop your details below for first look at new drops and something extra the week of
          your birthday.
        </p>

        <div className="mt-5">
          <SignupForm compact onSuccess={() => localStorage.setItem(DISMISSED_KEY, "1")} />
        </div>
      </div>
    </div>
  );
}
