import html2canvas from 'html2canvas';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

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
  base64: string;
  blob: Blob | null;
  fileName: string;
}

/**
 * Renders HTML memo content to a sharp JPEG image.
 */
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

    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;

    return new Promise((resolve) => {
      if (canvas.toBlob) {
        canvas.toBlob(
          (blob) => {
            resolve({ dataUrl, base64, blob, fileName });
          },
          'image/jpeg',
          0.88
        );
      } else {
        resolve({ dataUrl, base64, blob: null, fileName });
      }
    });
  } catch (err) {
    if (document.body.contains(wrapper)) {
      document.body.removeChild(wrapper);
    }
    throw err;
  }
}

/**
 * Reliable cross-platform image save & download:
 * - Native Android APK: Writes directly to device storage via Filesystem & invokes Share/Save sheet
 * - Web Browser: Standard <a> tag download
 */
export async function saveOrDownloadImage(result: RenderMemoResult): Promise<{
  success: boolean;
  message: string;
}> {
  const { dataUrl, fileName, blob, base64 } = result;

  // 1. Native Android APK handling (Capacitor)
  if (Capacitor.isNativePlatform()) {
    try {
      const pureBase64 = base64 || (dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl);

      // Write image to device Cache directory first so it's shareable and saveable
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: pureBase64,
        directory: Directory.Cache,
        recursive: true,
      });

      // Also attempt saving directly to Documents folder
      try {
        await Filesystem.writeFile({
          path: fileName,
          data: pureBase64,
          directory: Directory.Documents,
          recursive: true,
        });
      } catch {
        // Documents fallback non-blocking
      }

      // Open Android native Share & Save Sheet (Gallery, WhatsApp, File Manager, Save to Device)
      if (savedFile?.uri) {
        await Share.share({
          title: 'সুপারি হিসাব মেমো রসিদ',
          text: `সুপারি মেমো: ${fileName}`,
          url: savedFile.uri,
          dialogTitle: 'মেমো রসিদ সেভ বা শেয়ার করুন',
        });
      }

      return {
        success: true,
        message: '✅ মেমো রসিদ সফলভাবে সেভ ও শেয়ার অপশনে পাঠানো হয়েছে!',
      };
    } catch (nativeErr: any) {
      console.warn('Native Filesystem save failed, trying Web Share API...', nativeErr);

      // Fallback to Web Share API
      if (blob && navigator.share) {
        try {
          const file = new File([blob], fileName, { type: 'image/jpeg' });
          await navigator.share({
            title: 'সুপারি হিসাব মেমো রসিদ',
            files: [file],
          });
          return { success: true, message: '✅ মেমো রসিদ সফলভাবে শেয়ার হয়েছে!' };
        } catch {
          // cancelled
        }
      }
    }
  }

  // 2. Standard Web Browser download fallback
  try {
    const link = document.createElement('a');
    link.download = fileName;
    link.href = dataUrl;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
    }, 200);

    return {
      success: true,
      message: `📥 '${fileName}' ডাউনলোড সম্পন্ন হয়েছে!`,
    };
  } catch {
    return {
      success: false,
      message: '⚠️ সরাসরি ডাউনলোড করা যায়নি। ছবিতে চাপ দিয়ে ধরে Save Image দিন।',
    };
  }
}
