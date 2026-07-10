import { useEffect, useState } from "react";

export function useMediaQuery(query: string) {
  const [value, setValue] = useState(false);

  useEffect(() => {
    function onChange(event: MediaQueryListEvent) {
      setValue(event.matches);
    }

    const result = window.matchMedia(query);
    result.addEventListener("change", onChange);
    
    // Đảm bảo sync giá trị ngay sau khi mount, bọc trong Promise để tránh lỗi set-state-in-effect
    Promise.resolve().then(() => {
      setValue(result.matches);
    });

    return () => result.removeEventListener("change", onChange);
  }, [query]);

  return value;
}
