export type DeviceType = "pc" | "mobile";

export function getDeviceType(): DeviceType {
  if (typeof navigator === "undefined") return "pc";
  const ua = navigator.userAgent || "";
  const isMobile =
    /Android|iPhone|iPad|iPod|Mobi|Mobile/i.test(ua) ||
    (typeof window !== "undefined" && window.innerWidth < 900);
  return isMobile ? "mobile" : "pc";
}

export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "server";
  const key = "nf:device_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = (crypto as any).randomUUID
      ? (crypto as any).randomUUID()
      : `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(key, id);
  }
  return id;
}
