import * as vega from 'vega';
import {t} from './i18n';

let latestSpecifiedView: vega.View | null = null;

function isThumbnailDataUri(value: any): value is string {
  return typeof value === 'string' && value.indexOf('data:image/') === 0;
}

export function rememberSpecifiedView(view: vega.View | null) {
  latestSpecifiedView = view || null;
}

export function forgetSpecifiedView(view: vega.View | null) {
  if (latestSpecifiedView === view) {
    latestSpecifiedView = null;
  }
}

function findSpecifiedViewRoot(): Element | null {
  const headers = document.getElementsByTagName('h2');
  const len = headers.length;
  for (let i = 0; i < len; i++) {
    const header = headers.item(i);
    if (header && (header.textContent || '').trim() === t('viewPane.specifiedView')) {
      return header.parentElement;
    }
  }
  return null;
}

function getCanvasArea(canvas: HTMLCanvasElement): number {
  const rect = canvas.getBoundingClientRect();
  const width = canvas.width || rect.width;
  const height = canvas.height || rect.height;
  return width > 0 && height > 0 ? width * height : 0;
}

function findLargestCanvas(root: Element | Document): HTMLCanvasElement | null {
  const canvases = root.querySelectorAll('.chart canvas') as NodeListOf<HTMLCanvasElement>;
  let bestCanvas: HTMLCanvasElement | null = null;
  let bestArea = 0;

  for (let i = 0; i < canvases.length; i++) {
    const area = getCanvasArea(canvases[i]);
    if (area > bestArea) {
      bestCanvas = canvases[i];
      bestArea = area;
    }
  }

  return bestCanvas;
}

function canvasToThumbnailDataUri(canvas: HTMLCanvasElement): string | null {
  const width = canvas.width;
  const height = canvas.height;
  if (width <= 0 || height <= 0) {
    return null;
  }

  const maxWidth = 480;
  const maxHeight = 360;
  const scale = Math.min(1, maxWidth / width, maxHeight / height);
  const thumbnailCanvas = document.createElement('canvas');
  thumbnailCanvas.width = Math.max(1, Math.round(width * scale));
  thumbnailCanvas.height = Math.max(1, Math.round(height * scale));

  const context = thumbnailCanvas.getContext('2d');
  if (!context) {
    return null;
  }

  context.fillStyle = '#fff';
  context.fillRect(0, 0, thumbnailCanvas.width, thumbnailCanvas.height);
  context.drawImage(canvas, 0, 0, width, height, 0, 0, thumbnailCanvas.width, thumbnailCanvas.height);

  return thumbnailCanvas.toDataURL('image/png');
}

function findLargestSvg(root: Element | Document): SVGSVGElement | null {
  const svgs = root.querySelectorAll('.chart svg') as NodeListOf<SVGSVGElement>;
  let bestSvg: SVGSVGElement | null = null;
  let bestArea = 0;

  for (let i = 0; i < svgs.length; i++) {
    const rect = svgs[i].getBoundingClientRect();
    const width = Number(svgs[i].getAttribute('width')) || rect.width;
    const height = Number(svgs[i].getAttribute('height')) || rect.height;
    const area = width > 0 && height > 0 ? width * height : 0;
    if (area > bestArea) {
      bestSvg = svgs[i];
      bestArea = area;
    }
  }

  return bestSvg;
}

function svgToDataUri(svg: SVGSVGElement): string | null {
  try {
    const text = typeof XMLSerializer !== 'undefined' ?
      new XMLSerializer().serializeToString(svg) :
      (svg as any).outerHTML;
    if (!text) {
      return null;
    }
    const encodedText = unescape(encodeURIComponent(text));
    const base64 = typeof btoa === 'function' ?
      btoa(encodedText) :
      Buffer.from(encodedText, 'binary').toString('base64');
    return 'data:image/svg+xml;base64,' + base64;
  } catch (_err) {
    return null;
  }
}

async function getViewThumbnailDataUri(): Promise<string | null> {
  const view = latestSpecifiedView;
  if (!view) {
    return null;
  }

  if (typeof (view as any).toCanvas === 'function') {
    try {
      const canvas = await (view as any).toCanvas();
      const dataUri = canvasToThumbnailDataUri(canvas);
      if (isThumbnailDataUri(dataUri)) {
        return dataUri;
      }
    } catch (_err) {
      // Fall back to toImageURL / DOM capture below.
    }
  }

  if (typeof (view as any).toImageURL === 'function') {
    try {
      const dataUri = await (view as any).toImageURL('png');
      if (isThumbnailDataUri(dataUri)) {
        return dataUri;
      }
    } catch (_err) {
      return null;
    }
  }

  return null;
}

function getDomThumbnailDataUri(): string | null {
  try {
    const roots: Array<Element | Document> = [];
    const specifiedViewRoot = findSpecifiedViewRoot();
    if (specifiedViewRoot) {
      roots.push(specifiedViewRoot);
    }

    const voyagerRoot = document.querySelector('.voyager');
    if (voyagerRoot && voyagerRoot !== specifiedViewRoot) {
      roots.push(voyagerRoot);
    }
    roots.push(document);

    for (const root of roots) {
      const canvas = findLargestCanvas(root);
      if (canvas) {
        const dataUri = canvasToThumbnailDataUri(canvas);
        if (dataUri) {
          return dataUri;
        }
      }
    }

    for (const root of roots) {
      const svg = findLargestSvg(root);
      if (svg) {
        const dataUri = svgToDataUri(svg);
        if (dataUri) {
          return dataUri;
        }
      }
    }
  } catch (_err) {
    return null;
  }
  return null;
}

export async function getThumbnailDataUri(): Promise<string | null> {
  return (await getViewThumbnailDataUri()) || getDomThumbnailDataUri();
}
