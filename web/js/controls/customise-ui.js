/**
 * Customise UI
 * 
 * Handles the Customise sidebar panel — currently includes:
 * - Board Wallpaper upload, crop, and contrast adjustment
 * 
 * The cropped image is stored as a JPEG data URL in localStorage.
 */

import { saveWallpaper, loadWallpaper, clearWallpaper, saveSettings } from '../systems/storage.js';
import { state } from '../state.js';

// Board aspect ratio (must match CSS --board-aspect-ratio)
const BOARD_RATIO = 4 / 5; // width / height

/**
 * Initialize the Customise panel and restore any saved wallpaper.
 */
export function initCustomiseUI() {
  const uploadBtn = document.getElementById('wallpaper-upload-btn');
  const fileInput = document.getElementById('wallpaper-file-input');
  const removeBtn = document.getElementById('wallpaper-remove-btn');
  const thumbnail = document.getElementById('wallpaper-thumbnail');
  const contrastSlider = document.getElementById('board-contrast');
  const contrastValue = document.getElementById('board-contrast-value');
  const boardEl = document.getElementById('game-board');

  if (!uploadBtn || !fileInput || !boardEl) return;

  // ── Restore saved wallpaper on load ──
  const savedWallpaper = loadWallpaper();
  const savedContrast = state.boardContrast !== undefined ? state.boardContrast : 50;

  if (savedWallpaper) {
    applyWallpaper(boardEl, savedWallpaper, savedContrast);
    if (thumbnail) {
      thumbnail.style.backgroundImage = `url('${savedWallpaper}')`;
      thumbnail.classList.add('has-image');
    }
    if (removeBtn) removeBtn.style.display = 'inline-flex';
  }

  if (contrastSlider) {
    contrastSlider.value = savedContrast;
    if (contrastValue) contrastValue.textContent = savedContrast;
  }

  // ── Upload Button ──
  uploadBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      openCropModal(ev.target.result, boardEl, thumbnail, removeBtn, contrastSlider);
    };
    reader.readAsDataURL(file);
    // Reset so same file can be re-selected
    fileInput.value = '';
  });

  // ── Remove Button ──
  if (removeBtn) {
    removeBtn.addEventListener('click', () => {
      boardEl.style.backgroundImage = '';
      boardEl.style.filter = '';
      if (thumbnail) {
        thumbnail.style.backgroundImage = '';
        thumbnail.classList.remove('has-image');
      }
      removeBtn.style.display = 'none';
      clearWallpaper();
      if (contrastSlider) contrastSlider.value = 50;
      if (contrastValue) contrastValue.textContent = '50';
      state.boardContrast = 50;
      saveSettings();
    });
  }

  // ── Contrast Slider (live update) ──
  if (contrastSlider) {
    contrastSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      state.boardContrast = val;
      if (contrastValue) contrastValue.textContent = val;
      // Only apply filter if a wallpaper is set
      if (boardEl.style.backgroundImage) {
        const cssContrast = (val / 50) * 100; // 0→0%, 50→100%, 100→200%
        boardEl.style.filter = `contrast(${cssContrast}%)`;
      }
    });
    contrastSlider.addEventListener('change', () => saveSettings());
  }
}

/**
 * Apply a wallpaper image + contrast to the board element.
 */
function applyWallpaper(boardEl, dataUrl, contrast) {
  boardEl.style.backgroundImage = `url('${dataUrl}')`;
  boardEl.style.backgroundSize = 'cover';
  boardEl.style.backgroundPosition = 'center';
  const cssContrast = (contrast / 50) * 100;
  boardEl.style.filter = `contrast(${cssContrast}%)`;
}

// ─── Crop Modal ──────────────────────────────────────────────

function openCropModal(imageSrc, boardEl, thumbnail, removeBtn, contrastSlider) {
  const modal = document.getElementById('crop-modal');
  const cropCanvas = document.getElementById('crop-canvas');
  const applyBtn = document.getElementById('crop-apply-btn');
  const cancelBtn = document.getElementById('crop-cancel-btn');
  const cropContrastSlider = document.getElementById('crop-contrast');
  const cropContrastValue = document.getElementById('crop-contrast-value');

  if (!modal || !cropCanvas) return;

  const ctx = cropCanvas.getContext('2d');
  const img = new Image();

  img.onload = () => {
    // Size the canvas to fit the modal (max 600px wide)
    const maxW = Math.min(600, window.innerWidth - 60);
    const scale = maxW / img.width;
    const canvasW = Math.floor(img.width * scale);
    const canvasH = Math.floor(img.height * scale);

    cropCanvas.width = canvasW;
    cropCanvas.height = canvasH;

    // Initial crop rect: largest 4:5 rect that fits centered
    let cropW, cropH;
    if (canvasW / canvasH > BOARD_RATIO) {
      // Image is wider — constrain by height
      cropH = canvasH * 0.85;
      cropW = cropH * BOARD_RATIO;
    } else {
      // Image is taller — constrain by width
      cropW = canvasW * 0.85;
      cropH = cropW / BOARD_RATIO;
    }

    let cropX = (canvasW - cropW) / 2;
    let cropY = (canvasH - cropH) / 2;

    let contrast = contrastSlider ? parseInt(contrastSlider.value, 10) : 50;
    if (cropContrastSlider) cropContrastSlider.value = contrast;
    if (cropContrastValue) cropContrastValue.textContent = contrast;

    // Draw function
    function draw() {
      ctx.clearRect(0, 0, canvasW, canvasH);

      // Apply contrast filter to the entire image
      const cssContrast = (contrast / 50) * 100;
      ctx.filter = `contrast(${cssContrast}%)`;
      ctx.drawImage(img, 0, 0, canvasW, canvasH);
      ctx.filter = 'none';

      // Dim outside the crop rect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      // Top
      ctx.fillRect(0, 0, canvasW, cropY);
      // Bottom
      ctx.fillRect(0, cropY + cropH, canvasW, canvasH - cropY - cropH);
      // Left
      ctx.fillRect(0, cropY, cropX, cropH);
      // Right
      ctx.fillRect(cropX + cropW, cropY, canvasW - cropX - cropW, cropH);

      // Crop border
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(cropX, cropY, cropW, cropH);
      ctx.setLineDash([]);

      // Corner handles
      const hs = 8;
      ctx.fillStyle = '#c084fc';
      // Top-left
      ctx.fillRect(cropX - hs / 2, cropY - hs / 2, hs, hs);
      // Top-right
      ctx.fillRect(cropX + cropW - hs / 2, cropY - hs / 2, hs, hs);
      // Bottom-left
      ctx.fillRect(cropX - hs / 2, cropY + cropH - hs / 2, hs, hs);
      // Bottom-right
      ctx.fillRect(cropX + cropW - hs / 2, cropY + cropH - hs / 2, hs, hs);

      // Aspect ratio label
      ctx.fillStyle = 'rgba(192, 132, 252, 0.8)';
      ctx.font = '11px Outfit, sans-serif';
      ctx.fillText('4:5', cropX + cropW / 2 - 8, cropY - 8);
    }

    draw();

    // ── Drag interaction ──
    let dragging = false;
    let resizing = false;
    let resizeCorner = null;
    let dragOffsetX = 0, dragOffsetY = 0;

    function getMousePos(e) {
      const rect = cropCanvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) * (canvasW / rect.width),
        y: (e.clientY - rect.top) * (canvasH / rect.height)
      };
    }

    function isInCorner(mx, my) {
      const hs = 14;
      const corners = [
        { name: 'tl', x: cropX, y: cropY },
        { name: 'tr', x: cropX + cropW, y: cropY },
        { name: 'bl', x: cropX, y: cropY + cropH },
        { name: 'br', x: cropX + cropW, y: cropY + cropH },
      ];
      for (const c of corners) {
        if (Math.abs(mx - c.x) < hs && Math.abs(my - c.y) < hs) return c.name;
      }
      return null;
    }

    function onMouseDown(e) {
      const pos = getMousePos(e);
      const corner = isInCorner(pos.x, pos.y);

      if (corner) {
        resizing = true;
        resizeCorner = corner;
      } else if (pos.x >= cropX && pos.x <= cropX + cropW && pos.y >= cropY && pos.y <= cropY + cropH) {
        dragging = true;
        dragOffsetX = pos.x - cropX;
        dragOffsetY = pos.y - cropY;
      }
    }

    function onMouseMove(e) {
      const pos = getMousePos(e);

      if (dragging) {
        cropX = Math.max(0, Math.min(canvasW - cropW, pos.x - dragOffsetX));
        cropY = Math.max(0, Math.min(canvasH - cropH, pos.y - dragOffsetY));
        draw();
      } else if (resizing) {
        // Resize from the dragged corner while maintaining 4:5 ratio
        let newW, newH;

        if (resizeCorner === 'br') {
          newW = Math.max(40, pos.x - cropX);
          newH = newW / BOARD_RATIO;
          if (cropY + newH > canvasH) { newH = canvasH - cropY; newW = newH * BOARD_RATIO; }
          if (cropX + newW > canvasW) { newW = canvasW - cropX; newH = newW / BOARD_RATIO; }
          cropW = newW;
          cropH = newH;
        } else if (resizeCorner === 'tl') {
          newW = Math.max(40, (cropX + cropW) - pos.x);
          newH = newW / BOARD_RATIO;
          const newX = cropX + cropW - newW;
          const newY = cropY + cropH - newH;
          if (newX >= 0 && newY >= 0) { cropX = newX; cropY = newY; cropW = newW; cropH = newH; }
        } else if (resizeCorner === 'tr') {
          newW = Math.max(40, pos.x - cropX);
          newH = newW / BOARD_RATIO;
          const newY = cropY + cropH - newH;
          if (newY >= 0 && cropX + newW <= canvasW) { cropY = newY; cropW = newW; cropH = newH; }
        } else if (resizeCorner === 'bl') {
          newW = Math.max(40, (cropX + cropW) - pos.x);
          newH = newW / BOARD_RATIO;
          const newX = cropX + cropW - newW;
          if (newX >= 0 && cropY + newH <= canvasH) { cropX = newX; cropW = newW; cropH = newH; }
        }

        draw();
      } else {
        // Cursor style
        const corner = isInCorner(pos.x, pos.y);
        if (corner === 'tl' || corner === 'br') {
          cropCanvas.style.cursor = 'nwse-resize';
        } else if (corner === 'tr' || corner === 'bl') {
          cropCanvas.style.cursor = 'nesw-resize';
        } else if (pos.x >= cropX && pos.x <= cropX + cropW && pos.y >= cropY && pos.y <= cropY + cropH) {
          cropCanvas.style.cursor = 'move';
        } else {
          cropCanvas.style.cursor = 'default';
        }
      }
    }

    function onMouseUp() {
      dragging = false;
      resizing = false;
      resizeCorner = null;
    }

    cropCanvas.addEventListener('mousedown', onMouseDown);
    cropCanvas.addEventListener('mousemove', onMouseMove);
    cropCanvas.addEventListener('mouseup', onMouseUp);
    cropCanvas.addEventListener('mouseleave', onMouseUp);

    // ── Contrast slider in crop modal ──
    if (cropContrastSlider) {
      const onContrastInput = (e) => {
        contrast = parseInt(e.target.value, 10);
        if (cropContrastValue) cropContrastValue.textContent = contrast;
        draw();
      };
      cropContrastSlider.addEventListener('input', onContrastInput);
    }

    // ── Apply ──
    const onApply = () => {
      // Render the cropped region onto an off-screen canvas
      const outputW = 600;
      const outputH = outputW / BOARD_RATIO; // 750

      const offscreen = document.createElement('canvas');
      offscreen.width = outputW;
      offscreen.height = outputH;
      const offCtx = offscreen.getContext('2d');

      // Map crop rect back to original image coordinates
      const scale = img.width / canvasW;
      const srcX = cropX * scale;
      const srcY = cropY * scale;
      const srcW = cropW * scale;
      const srcH = cropH * scale;

      offCtx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, outputW, outputH);

      // Export as compressed JPEG
      const dataUrl = offscreen.toDataURL('image/jpeg', 0.7);

      // Apply to board
      state.boardContrast = contrast;
      applyWallpaper(boardEl, dataUrl, contrast);

      // Update thumbnail
      if (thumbnail) {
        thumbnail.style.backgroundImage = `url('${dataUrl}')`;
        thumbnail.classList.add('has-image');
      }
      if (removeBtn) removeBtn.style.display = 'inline-flex';
      if (contrastSlider) contrastSlider.value = contrast;

      // Save
      saveWallpaper(dataUrl);
      saveSettings();

      cleanup();
    };

    // ── Cancel ──
    const onCancel = () => {
      cleanup();
    };

    function cleanup() {
      cropCanvas.removeEventListener('mousedown', onMouseDown);
      cropCanvas.removeEventListener('mousemove', onMouseMove);
      cropCanvas.removeEventListener('mouseup', onMouseUp);
      cropCanvas.removeEventListener('mouseleave', onMouseUp);
      applyBtn.removeEventListener('click', onApply);
      cancelBtn.removeEventListener('click', onCancel);
      modal.style.display = 'none';
    }

    applyBtn.addEventListener('click', onApply);
    cancelBtn.addEventListener('click', onCancel);

    // Show modal
    modal.style.display = 'flex';
  };

  img.src = imageSrc;
}
