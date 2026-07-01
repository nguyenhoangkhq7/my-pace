import { useEffect, useState } from "react";

export function useMediaQuery(query: string) {
  const [value, setValue] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    function onChange(event: MediaQueryListEvent) {
      setValue(event.matches);
    }

    const result = window.matchMedia(query);
    result.addEventListener("change", onChange);
    
    // Safety check in case it changed between initial render and effect execution
    if (result.matches !== value) {
      setValue(result.matches);
    }

    return () => result.removeEventListener("change", onChange);
  }, [query, value]);

  return value;
}
