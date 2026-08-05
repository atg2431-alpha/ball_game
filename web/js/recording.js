/**
 * Screen Recording Logic
 * Creates a hidden "recording canvas" that composites the full game-wrapper UI:
 *   Title, Player Labels, Game Board (from game canvas), HP Bars.
 * Records via captureStream() — zero lag, zero browser prompts.
 */
import { CONFIG } from './config.js';
import { state } from './state.js';

let mediaRecorder = null;
let recordedChunks = [];
let stream = null;
let isRecording = false;
let recCanvas = null;
let recCtx = null;
let animFrameId = null;

export async function startRecording(wrapperEl) {
  try {
    const gameCanvas = document.getElementById('game-canvas');
    if (!gameCanvas) {
      console.error('Game canvas not found for recording!');
      return false;
    }

    // 1. Measure the game-wrapper to size our recording canvas
    const wrapperRect = wrapperEl.getBoundingClientRect();
    const W = Math.round(wrapperRect.width);
    const H = Math.round(wrapperRect.height);

    // 2. Create hidden recording canvas
    recCanvas = document.createElement('canvas');
    recCanvas.width = W * 2;  // 2x for sharpness
    recCanvas.height = H * 2;
    recCtx = recCanvas.getContext('2d');
    recCtx.scale(2, 2);

    isRecording = true;

    // 3. Composite loop
    function drawFrame() {
      if (!isRecording) return;
      animFrameId = requestAnimationFrame(drawFrame);

      const wr = wrapperEl.getBoundingClientRect();
      const cw = wr.width;
      const ch = wr.height;

      // Background
      recCtx.fillStyle = '#0f0a1a';
      recCtx.fillRect(0, 0, cw, ch);

      // ── Title ──
      const titleY = 28;
      const gradient = recCtx.createLinearGradient(cw * 0.3, 0, cw * 0.7, 0);
      gradient.addColorStop(0, '#3b82f6');
      gradient.addColorStop(0.5, '#a855f7');
      gradient.addColorStop(1, '#ef4444');
      recCtx.fillStyle = gradient;
      recCtx.font = 'bold 22px "Inter", sans-serif';
      recCtx.textAlign = 'center';
      recCtx.textBaseline = 'middle';
      recCtx.fillText('BALL BATTLE SIMULATOR', cw / 2, titleY);

      // ── Player Labels ──
      const labelY = 62;
      const labelH = 38;
      const labelGap = 12;
      const vsWidth = 30;
      const labelWidth = (cw - vsWidth - labelGap * 4 - 40) / 2; // 40px total padding
      const labelStartX = 20;

      // Player 1 label (blue)
      drawRoundedRect(recCtx, labelStartX, labelY, labelWidth, labelH, 8);
      recCtx.fillStyle = 'rgba(59, 130, 246, 0.15)';
      recCtx.fill();
      recCtx.strokeStyle = '#3b82f6';
      recCtx.lineWidth = 1.5;
      recCtx.stroke();
      recCtx.fillStyle = '#60a5fa';
      recCtx.font = 'bold 14px "Inter", sans-serif';
      recCtx.textAlign = 'center';
      recCtx.fillText(CONFIG.ball1.name, labelStartX + labelWidth / 2, labelY + labelH / 2);

      // VS badge
      const vsX = labelStartX + labelWidth + labelGap;
      recCtx.fillStyle = 'rgba(255,255,255,0.5)';
      recCtx.font = 'bold 12px "Inter", sans-serif';
      recCtx.fillText('VS', vsX + vsWidth / 2, labelY + labelH / 2);

      // Player 2 label (red)
      const p2X = vsX + vsWidth + labelGap;
      drawRoundedRect(recCtx, p2X, labelY, labelWidth, labelH, 8);
      recCtx.fillStyle = 'rgba(239, 68, 68, 0.15)';
      recCtx.fill();
      recCtx.strokeStyle = '#ef4444';
      recCtx.lineWidth = 1.5;
      recCtx.stroke();
      recCtx.fillStyle = '#f87171';
      recCtx.font = 'bold 14px "Inter", sans-serif';
      recCtx.fillText(CONFIG.ball2.name, p2X + labelWidth / 2, labelY + labelH / 2);

      // ── Game Board ──
      const boardEl = document.getElementById('game-board');
      const boardRect = boardEl.getBoundingClientRect();
      const bx = boardRect.left - wr.left;
      const by = boardRect.top - wr.top;
      const bw = boardRect.width;
      const bh = boardRect.height;

      // Board background
      drawRoundedRect(recCtx, bx, by, bw, bh, 16);
      recCtx.fillStyle = 'rgba(15, 10, 30, 0.8)';
      recCtx.fill();
      recCtx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
      recCtx.lineWidth = 2;
      recCtx.stroke();

      // Copy the live game canvas into the board area
      const gcRect = gameCanvas.getBoundingClientRect();
      const gx = gcRect.left - wr.left;
      const gy = gcRect.top - wr.top;
      recCtx.drawImage(gameCanvas, gx, gy, gcRect.width, gcRect.height);

      // ── HP Bars ──
      const hpY = ch - 55;
      const hpH = 42;
      const hpWidth = (cw - 60) / 2;

      // Player 1 HP
      const hp1 = state.balls.length > 0 ? Math.max(0, Math.round(state.balls[0].hp)) : CONFIG.ball1.hp;
      drawRoundedRect(recCtx, 20, hpY, hpWidth, hpH, 12);
      recCtx.fillStyle = 'rgba(30, 25, 50, 0.9)';
      recCtx.fill();
      recCtx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
      recCtx.lineWidth = 1;
      recCtx.stroke();
      recCtx.fillStyle = 'rgba(255,255,255,0.4)';
      recCtx.font = '12px "Inter", sans-serif';
      recCtx.textAlign = 'left';
      recCtx.fillText('HP', 36, hpY + hpH / 2);
      recCtx.fillStyle = '#60a5fa';
      recCtx.font = 'bold 22px "Inter", sans-serif';
      recCtx.textAlign = 'center';
      recCtx.fillText(hp1, 20 + hpWidth / 2 + 10, hpY + hpH / 2 + 1);

      // Player 2 HP
      const hp2 = state.balls.length > 1 ? Math.max(0, Math.round(state.balls[1].hp)) : CONFIG.ball2.hp;
      const hp2X = cw - 20 - hpWidth;
      drawRoundedRect(recCtx, hp2X, hpY, hpWidth, hpH, 12);
      recCtx.fillStyle = 'rgba(30, 25, 50, 0.9)';
      recCtx.fill();
      recCtx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
      recCtx.lineWidth = 1;
      recCtx.stroke();
      recCtx.fillStyle = 'rgba(255,255,255,0.4)';
      recCtx.font = '12px "Inter", sans-serif';
      recCtx.textAlign = 'left';
      recCtx.fillText('HP', hp2X + 16, hpY + hpH / 2);
      recCtx.fillStyle = '#f87171';
      recCtx.font = 'bold 22px "Inter", sans-serif';
      recCtx.textAlign = 'center';
      recCtx.fillText(hp2, hp2X + hpWidth / 2 + 10, hpY + hpH / 2 + 1);
    }

    animFrameId = requestAnimationFrame(drawFrame);

    // 4. Start MediaRecorder on the recording canvas stream
    stream = recCanvas.captureStream(CONFIG.recording.fps);
    mediaRecorder = new MediaRecorder(stream, { 
      mimeType: CONFIG.recording.mimeType,
      videoBitsPerSecond: CONFIG.recording.videoBitsPerSecond
    });
    
    recordedChunks = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };

    mediaRecorder.start();
    return true;
  } catch (err) {
    console.error('Error starting recording:', err);
    return false;
  }
}

export function stopRecording(player1Name, player2Name) {
  if (!isRecording || !mediaRecorder) return;
  
  isRecording = false;
  if (animFrameId) cancelAnimationFrame(animFrameId);

  mediaRecorder.onstop = async () => {
    const blob = new Blob(recordedChunks, { type: CONFIG.recording.mimeType });
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    stream = null;
    mediaRecorder = null;
    recCanvas = null;
    recCtx = null;

    const now = new Date();
    const timeStr = `${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}`;
    const filename = `${player1Name}vs${player2Name}_${timeStr}.webm`;
    
    try {
      console.log('Uploading recording...');
      const response = await fetch(`/api/upload-recording?filename=${encodeURIComponent(filename)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'video/webm' },
        body: blob
      });
      
      if (response.ok) {
        console.log('Recording uploaded successfully!');
      } else {
        console.error('Failed to upload recording');
      }
    } catch (err) {
      console.error('Error during upload:', err);
    }
  };

  mediaRecorder.stop();
}

// ── Helper: draw rounded rectangle path ──
function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
