'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';

export interface Branding {
  platformName: string;
  tagline?: string;
  logoUrl?: string;
  faviconLightUrl?: string;
  faviconDarkUrl?: string;
  squareLogoLightUrl?: string;
  squareLogoDarkUrl?: string;
  horizontalLogoLightUrl?: string;
  horizontalLogoDarkUrl?: string;
  loginBgUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  customCss?: string;
  supportEmail?: string;
  supportUrl?: string;
  footerText?: string;
  termsUrl?: string;
  privacyUrl?: string;
}

const defaultBranding: Branding = {
  platformName: 'MREC Entertainment',
  primaryColor: '#22c55e',
  secondaryColor: '#16a34a',
  accentColor: '#f59e0b',
  backgroundColor: '#0d0d0d',
  textColor: '#eeeeee',
};

const BrandingContext = createContext<Branding>(defaultBranding);

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<Branding>(defaultBranding);

  useEffect(() => {
    api.get('/api/v1/branding/public')
      .then(res => {
        const b: Branding = { ...defaultBranding, ...res.data };
        setBranding(b);
        applyBrandingToDOM(b);
      })
      .catch(() => applyBrandingToDOM(defaultBranding));
  }, []);

  return (
    <BrandingContext.Provider value={branding}>
      {children}
    </BrandingContext.Provider>
  );
}

export const useBrandingContext = () => useContext(BrandingContext);
export const useBranding = useBrandingContext;

function applyBrandingToDOM(b: Partial<Branding>) {
  const root = document.documentElement;

  // Map branding fields → new CSS vars
  if (b.primaryColor)     root.style.setProperty('--primary', b.primaryColor);
  if (b.backgroundColor)  root.style.setProperty('--bg', b.backgroundColor);
  if (b.textColor)        root.style.setProperty('--text', b.textColor);

  // Derived primary dim
  if (b.primaryColor) {
    root.style.setProperty('--primary-dim', `${b.primaryColor}1a`);
  }

  // Custom CSS injection
  if (b.customCss) {
    let el = document.getElementById('tenant-css') as HTMLStyleElement | null;
    if (!el) { el = document.createElement('style'); el.id = 'tenant-css'; document.head.appendChild(el); }
    el.textContent = b.customCss;
  }

  // Favicon (dark theme takes priority)
  const faviconUrl = b.faviconDarkUrl || b.faviconLightUrl;
  if (faviconUrl) {
    const link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (link) link.href = faviconUrl;
  }

  // Page title
  if (b.platformName) document.title = b.platformName;
}
