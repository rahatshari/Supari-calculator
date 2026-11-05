import html2canvas from 'html2canvas';

export async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return fallbackCopy(text);
    }
  } else {
    return fallbackCopy(text);
  }
}

function fallbackCopy(text: string): boolean {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const success = document.execCommand('copy');
    document.body.removeChild(ta);
    return success;
  } catch {
    return false;
  }
}

export interface RenderMemoResult {
  dataUrl: string;
  blob: Blob | null;
  fileName: string;
}

export async function renderMemoHtmlToImage(
  memoHtml: string,
  fileName: string,
  customWidth = 780
): Promise<RenderMemoResult> {
  const wrapper = document.createElement('div');
  wrapper.id = 'offscreen-memo-renderer';
  wrapper.style.position = 'fixed';
  wrapper.style.left = '-9999px';
  wrapper.style.top = '0';
  wrapper.style.width = customWidth + 'px';
  wrapper.style.minWidth = customWidth + 'px';
  wrapper.style.maxWidth = customWidth + 'px';
  wrapper.style.backgroundColor = '#ffffff';
  wrapper.style.boxSizing = 'border-box';
  wrapper.innerHTML = memoHtml;
  document.body.appendChild(wrapper);

  try {
    // Brief layout settle tick
    await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 40)));

    const contentHeight = Math.max(wrapper.scrollHeight, wrapper.offsetHeight, 350);
    const contentWidth = Math.max(wrapper.scrollWidth, wrapper.offsetWidth, customWidth);

    // Dynamic scale optimization for rapid mobile rendering
    // High scale (2.0+) on mobile WebView causes 6+ million pixel memory allocations and 8-10s lag
    // 1.25 - 1.4 provides razor-sharp Bengali text with 4x-5x faster rendering speed
    const isMobile =
      typeof window !== 'undefined' &&
      (window.innerWidth <= 768 ||
        /android|iphone|ipad|ipod|wv/i.test(navigator.userAgent));

    let targetScale = isMobile ? 1.25 : 1.5;
    if (contentHeight > 2400) targetScale = 1.15;
    if (contentHeight > 3800) targetScale = 1.0;

    const canvas = await html2canvas(wrapper, {
      scale: targetScale,
      useCORS: false,
      allowTaint: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      width: contentWidth,
      height: contentHeight,
      windowWidth: contentWidth,
      windowHeight: contentHeight + 100,
      logging: false,
      imageTimeout: 0,
    });

    document.body.removeChild(wrapper);

    return new Promise((resolve) => {
      const finishWithBlob = (blob: Blob | null) => {
        if (blob) {
          const blobUrl = URL.createObjectURL(blob);
          try {
            const link = document.createElement('a');
            link.download = fileName;
            link.href = blobUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          } catch {}
          resolve({ dataUrl: blobUrl, blob, fileName });
        } else {
          const dataUrl = canvas.toDataURL('image/jpeg', 0.86);
          resolve({ dataUrl, blob: null, fileName });
        }
      };

      if (canvas.toBlob) {
        canvas.toBlob(finishWithBlob, 'image/jpeg', 0.86);
      } else {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.86);
        resolve({ dataUrl, blob: null, fileName });
      }
    });
  } catch (err) {
    if (document.body.contains(wrapper)) {
      document.body.removeChild(wrapper);
    }
    throw err;
  }
}
