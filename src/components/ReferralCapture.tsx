"use client";

import { useEffect } from "react";

export const REFERRAL_STORAGE_KEY = "biggystone_referral_code";

/**
 * Saves ?ref=CODE to localStorage the moment it's seen on any page, so it
 * survives someone browsing to another page (or the popup's few-second
 * delay) before actually signing up. Without this, SignupForm only ever
 * saw the code if the URL still had it at the exact moment of submit -
 * gone the instant they clicked through to /shop first, which is the
 * normal way people actually browse before signing up. Mounted once in
 * the site layout so it runs on every page, not just the landing page.
 */
export default function ReferralCapture() {
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) {
      try {
        localStorage.setItem(REFERRAL_STORAGE_KEY, ref);
      } catch {
        // Corrupt/blocked storage - the referral just won't be tracked, not fatal.
      }
    }
  }, []);

  return null;
}
