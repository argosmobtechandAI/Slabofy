"use client";

import React from 'react';
import NextLink from 'next/link';
import { useRouter as useNextRouter, useParams as useNextParams } from 'next/navigation';

export function Link({ to, href, ...props }) {
  // Map react-router's "to" to Next.js's "href"
  return <NextLink href={to || href || '#'} {...props} />;
}

export function useNavigate() {
  const router = useNextRouter();
  return (path, options) => {
    if (options?.state) {
      try {
        sessionStorage.setItem('router_state', JSON.stringify(options.state));
      } catch (e) {
        console.error('Failed to set router state', e);
      }
    } else {
      try {
        sessionStorage.removeItem('router_state');
      } catch (e) {}
    }

    if (options?.replace) {
      router.replace(path);
    } else {
      router.push(path);
    }
  };
}

export function useParams() {
  return useNextParams();
}

export function useLocation() {
  if (typeof window === 'undefined') {
    return { state: {} };
  }
  try {
    const stored = sessionStorage.getItem('router_state');
    return { state: stored ? JSON.parse(stored) : {} };
  } catch (e) {
    return { state: {} };
  }
}
