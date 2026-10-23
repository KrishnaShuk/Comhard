"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const NowContext = createContext<number>(Date.now());

export function NowProvider({ children }: { children: ReactNode }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  return <NowContext.Provider value={now}>{children}</NowContext.Provider>;
}

export function useNow(): Date {
  return new Date(useContext(NowContext));
}
