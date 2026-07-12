import { useEffect, useState } from "react";

function getInitialValue(query: string): boolean {
  // Đọc giá trị thực ngay lập tức để tránh render sai ở lần đầu
  if (typeof window !== "undefined") {
    return window.matchMedia(query).matches;
  }
  return false;
}

export function useMediaQuery(query: string) {
  const [value, setValue] = useState(() => getInitialValue(query));

  useEffect(() => {
    function onChange(event: MediaQueryListEvent) {
      setValue(event.matches);
    }

    const result = window.matchMedia(query);
    result.addEventListener("change", onChange);
    // Sync lại phòng trường hợp query thay đổi giữa chừng
    setValue(result.matches);

    return () => result.removeEventListener("change", onChange);
  }, [query]);

  return value;
}
