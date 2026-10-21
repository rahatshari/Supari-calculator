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
  wrapper.style.position = 'absolute';
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
    await new Promise(r => setTimeout(r, 200));

    const contentHeight = Math.max(wrapper.scrollHeight, wrapper.offsetHeight, 400);
    const contentWidth = Math.max(wrapper.scrollWidth, wrapper.offsetWidth, customWidth);

    let targetScale = 2;
    if (contentHeight > 3600) targetScale = 1.25;
    else if (contentHeight > 2200) targetScale = 1.5;

    const canvas = await html2canvas(wrapper, {
      scale: targetScale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      width: contentWidth,
      height: contentHeight,
      windowWidth: contentWidth,
      windowHeight: contentHeight + 200,
      logging: false,
    });

    document.body.removeChild(wrapper);

    return new Promise((resolve) => {
      if (canvas.toBlob) {
        canvas.toBlob((blob) => {
          if (blob) {
            const blobUrl = URL.createObjectURL(blob);
            // Trigger download automatically
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
            const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
            resolve({ dataUrl, blob: null, fileName });
          }
        }, 'image/jpeg', 0.92);
      } else {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
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
