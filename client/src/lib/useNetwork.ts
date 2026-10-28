import { useEffect, useState } from "react";

export interface NetworkTelemetry {
  online: boolean;
  type: "wifi" | "ethernet" | "cellular" | "bluetooth" | "wimax" | "other" | "unknown" | "offline";
  effectiveType: "4g" | "3g" | "2g" | "slow-2g" | "unknown";
  downlink?: number; // Mb/s
  rtt?: number; // ms
  saveData?: boolean;
  label: string;
  sublabel: string;
  signalBars: number; // 0 - 4
  statusTone: "moss" | "amber" | "brick";
}

interface NetworkInformation extends EventTarget {
  readonly type?: string;
  readonly effectiveType?: "4g" | "3g" | "2g" | "slow-2g";
  readonly downlink?: number;
  readonly rtt?: number;
  readonly saveData?: boolean;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
}

function getNetworkInfo(): NetworkTelemetry {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {
      online: true,
      type: "unknown",
      effectiveType: "4g",
      label: "Online",
      sublabel: "Active Link",
      signalBars: 4,
      statusTone: "moss",
    };
  }

  const isOnline = navigator.onLine;
  if (!isOnline) {
    return {
      online: false,
      type: "offline",
      effectiveType: "unknown",
      label: "Offline",
      sublabel: "Link Severed",
      signalBars: 0,
      statusTone: "brick",
    };
  }

  const conn: NetworkInformation | undefined =
    // @ts-expect-error Chromium NetworkInformation
    navigator.connection || navigator.mozConnection || navigator.webkitConnection;

  const rawType = (conn?.type || "").toLowerCase();
  const effectiveType = conn?.effectiveType || "4g";
  const downlink = conn?.downlink;
  const rtt = conn?.rtt;
  const saveData = conn?.saveData;

  let type: NetworkTelemetry["type"] = "unknown";
  // Every branch below assigns these before use; no defaults needed.
  let label: string;
  let sublabel: string;
  let signalBars: number;
  let statusTone: NetworkTelemetry["statusTone"] = "moss";

  if (rawType.includes("wifi")) {
    type = "wifi";
    label = "Wi-Fi";
    sublabel = effectiveType ? `${effectiveType.toUpperCase()} Link` : "Wireless 802.11";
    signalBars = 4;
  } else if (rawType.includes("ethernet")) {
    type = "ethernet";
    label = "Ethernet";
    sublabel = "Wired Gigabit";
    signalBars = 4;
  } else if (rawType.includes("cell") || rawType.includes("mobile") || rawType.includes("wimax")) {
    type = "cellular";
    label = effectiveType ? `Cellular · ${effectiveType.toUpperCase()}` : "Cellular";
    sublabel = "Mobile Radio";
    signalBars = effectiveType === "4g" ? 4 : effectiveType === "3g" ? 3 : 2;
  } else if (rawType.includes("bluetooth")) {
    type = "bluetooth";
    label = "Bluetooth";
    sublabel = "PAN Tether";
    signalBars = 2;
  } else {
    // Chromium on Desktop or Safari / Firefox fallback
    if (effectiveType === "4g") {
      // If downlink is high or desktop, display high-speed network
      if (downlink && downlink >= 10) {
        label = "High-Speed";
        sublabel = `${downlink} Mb/s · ${rtt ? `${rtt}ms` : "Fast"}`;
      } else {
        label = "Ethernet / Wi-Fi";
        sublabel = "High-Speed Link";
      }
      type = "ethernet";
      signalBars = 4;
    } else if (effectiveType === "3g") {
      label = "3G Network";
      sublabel = "Moderate Latency";
      signalBars = 2;
      statusTone = "amber";
    } else if (effectiveType === "2g" || effectiveType === "slow-2g") {
      label = "2G Low-Band";
      sublabel = "High Latency";
      signalBars = 1;
      statusTone = "amber";
    } else {
      label = "Connected";
      sublabel = "Active Link";
      signalBars = 4;
    }
  }

  // Adjust status tone if RTT is very high or degraded
  if (rtt && rtt > 500) {
    statusTone = "amber";
  }

  return {
    online: true,
    type,
    effectiveType,
    downlink,
    rtt,
    saveData,
    label,
    sublabel,
    signalBars,
    statusTone,
  };
}

export function useNetwork() {
  const [telemetry, setTelemetry] = useState<NetworkTelemetry>(getNetworkInfo);

  useEffect(() => {
    const update = () => {
      setTelemetry(getNetworkInfo());
    };

    window.addEventListener("online", update);
    window.addEventListener("offline", update);

    const conn: NetworkInformation | undefined =
      // @ts-expect-error Chromium NetworkInformation
      navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    if (conn && typeof conn.addEventListener === "function") {
      conn.addEventListener("change", update);
    }

    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      if (conn && typeof conn.removeEventListener === "function") {
        conn.removeEventListener("change", update);
      }
    };
  }, []);

  return telemetry;
}
