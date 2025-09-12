import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined
  );

  React.useEffect(() => {
    // iOS Safari compatibility check
    if (typeof window === "undefined") return;

    try {
      const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
      const onChange = () => {
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
      };

      // Check if addEventListener is supported (iOS Safari compatibility)
      if (mql.addEventListener) {
        mql.addEventListener("change", onChange);
      } else if (mql.addListener) {
        // Fallback for older iOS Safari versions
        mql.addListener(onChange);
      }

      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);

      return () => {
        if (mql.removeEventListener) {
          mql.removeEventListener("change", onChange);
        } else if (mql.removeListener) {
          mql.removeListener(onChange);
        }
      };
    } catch (error) {
      console.warn("matchMedia not supported, falling back to window resize");
      // Fallback for very old browsers
      const onChange = () => {
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
      };

      window.addEventListener("resize", onChange);
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);

      return () => window.removeEventListener("resize", onChange);
    }
  }, []);

  return !!isMobile;
}
