import type { Map } from "maplibre-gl";

export const PUBLIC_PIN_COLOR = "#137818";

const PIN_PATH =
  "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0";

const PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="42" height="52" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path fill="${PUBLIC_PIN_COLOR}" stroke="white" stroke-width="1" d="${PIN_PATH}"/></svg>`;

export function createPinMarkerElement(count?: number) {
  const el = document.createElement("div");
  el.className = "sonder-pin-marker";
  el.innerHTML = PIN_SVG;
  el.style.width = "42px";
  el.style.height = "52px";
  el.style.cursor = "pointer";
  el.style.position = "relative";
  if (count && count > 1) {
    const label = document.createElement("span");
    label.textContent = String(count);
    label.style.cssText =
      "position:absolute;left:50%;top:35%;transform:translate(-50%,-50%);color:white;font:700 11px/1 sans-serif;pointer-events:none;";
    el.append(label);
  }
  return el;
}

export function addPinMarkerImage(map: Map) {
  if (map.hasImage("sonder-map-pin")) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const image = new Image(42, 52);
    image.onload = () => {
      map.addImage("sonder-map-pin", image);
      resolve();
    };
    image.onerror = reject;
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(PIN_SVG)}`;
  });
}
