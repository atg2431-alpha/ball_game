/**
 * Screen Recording Logic — Instagram Reels Optimized (9:16 Portrait)
 *
 * Creates a hidden "recording canvas" at a fixed 1080×1920 resolution
 * and composites the full game UI with Instagram-safe padding zones:
 *   - Top ~120px reserved for IG header (username, follow)
 *   - Bottom ~160px reserved for IG footer (likes, comments, share)
 *   - All key content drawn within the safe zone
 *
 * Records via captureStream() — zero lag, zero browser prompts.
 */
import { CONFIG } from './config.js';
import { state } from './state.js';
import { getFormattedTime } from './ui/match-timer.js';

let mediaRecorder = null;
let recordedChunks = [];
let stream = null;
let isRecording = false;
let recCanvas = null;
let recCtx = null;
let animFrameId = null;
let gameOverWinner = null;    // Set when game ends, so the recording can draw the winner overlay
let gameOverTime = 0;         // Timestamp when game over was triggered
const GAME_OVER_DELAY = 3000; // ms to keep recording after game over to show winner

export async function startRecording(wrapperEl) {
  try {
    const gameCanvas = document.getElementById('game-canvas');
    if (!gameCanvas) {
      console.error('Game canvas not found for recording!');
      return false;
    }

    // 1. Fixed 9:16 recording canvas (Instagram Reels)
    const W = CONFIG.recording.canvasWidth;   // 1080
    const H = CONFIG.recording.canvasHeight;  // 1920

    recCanvas = document.createElement('canvas');
    recCanvas.width = W;
    recCanvas.height = H;
    recCtx = recCanvas.getContext('2d');

    isRecording = true;

    // ──────────────────────────────────────────────
    // Layout constants (all in pixels at 1080×1920)
    // ──────────────────────────────────────────────
    const PAD_X = 40;                    // Horizontal padding from edges
    const CONTENT_W = W - PAD_X * 2;     // 1000px usable width

    // Instagram safe zones
    const IG_HEADER = 120;               // IG username/follow bar

    // Title
    const TITLE_Y = IG_HEADER + 45;      // 165px — just below IG header
    const TITLE_FONT = 'bold 42px "Outfit", "Inter", sans-serif';

    // Player labels
    const LABEL_Y = TITLE_Y + 50;        // 215px
    const LABEL_H = 52;
    const LABEL_GAP = 14;
    const VS_WIDTH = 40;
    const LABEL_W = (CONTENT_W - VS_WIDTH - LABEL_GAP * 2) / 2;
    const LABEL_FONT = 'bold 24px "Outfit", "Inter", sans-serif';

    // Game board area
    const BOARD_Y = LABEL_Y + LABEL_H + 30;  // ~297px
    const BOARD_X = PAD_X;
    const BOARD_W = CONTENT_W;               // 1000px
    const BOARD_H = BOARD_W * (5 / 4);       // 4:5 ratio = 1250px
    const BOARD_R = 24;                      // Corner radius

    // HP value cards (directly below board)
    const HP_CARD_Y = BOARD_Y + BOARD_H + 35;    // ~1582px
    const HP_CARD_H = 56;
    const HP_CARD_GAP = 16;
    const HP_CARD_W = (CONTENT_W - HP_CARD_GAP) / 2;
    const HP_CARD_R = 14;

    // Match timer
    const TIMER_Y = HP_CARD_Y + HP_CARD_H + 30;  // ~1668px (well above IG footer at 1760)

    // 2. Composite loop
    function drawFrame() {
      if (!isRecording) return;
      animFrameId = requestAnimationFrame(drawFrame);

      // ── Background ──
      recCtx.fillStyle = '#0a0a0f';
      recCtx.fillRect(0, 0, W, H);

      // Subtle gradient overlay (like the game background)
      const bgGrad1 = recCtx.createRadialGradient(W * 0.2, H * 0.3, 0, W * 0.2, H * 0.3, 600);
      bgGrad1.addColorStop(0, 'rgba(74, 158, 255, 0.06)');
      bgGrad1.addColorStop(1, 'transparent');
      recCtx.fillStyle = bgGrad1;
      recCtx.fillRect(0, 0, W, H);

      const bgGrad2 = recCtx.createRadialGradient(W * 0.8, H * 0.7, 0, W * 0.8, H * 0.7, 600);
      bgGrad2.addColorStop(0, 'rgba(255, 74, 106, 0.06)');
      bgGrad2.addColorStop(1, 'transparent');
      recCtx.fillStyle = bgGrad2;
      recCtx.fillRect(0, 0, W, H);

      // ── Title ──
      const titleGrad = recCtx.createLinearGradient(W * 0.25, 0, W * 0.75, 0);
      titleGrad.addColorStop(0, '#4a9eff');
      titleGrad.addColorStop(0.5, '#a855f7');
      titleGrad.addColorStop(1, '#ff4a6a');
      recCtx.fillStyle = titleGrad;
      recCtx.font = TITLE_FONT;
      recCtx.textAlign = 'center';
      recCtx.textBaseline = 'middle';
      recCtx.fillText('BALL BATTLE SIMULATOR', W / 2, TITLE_Y);

      // ── Player Labels ──
      const p1X = PAD_X;
      const p2X = PAD_X + LABEL_W + LABEL_GAP + VS_WIDTH + LABEL_GAP;

      // Player 1 (Blue)
      drawRoundedRect(recCtx, p1X, LABEL_Y, LABEL_W, LABEL_H, 10);
      recCtx.fillStyle = 'rgba(74, 158, 255, 0.12)';
      recCtx.fill();
      recCtx.strokeStyle = 'rgba(74, 158, 255, 0.4)';
      recCtx.lineWidth = 1.5;
      recCtx.stroke();
      recCtx.fillStyle = '#4a9eff';
      recCtx.font = LABEL_FONT;
      recCtx.textAlign = 'center';
      recCtx.textBaseline = 'middle';
      recCtx.fillText(CONFIG.ball1.name, p1X + LABEL_W / 2, LABEL_Y + LABEL_H / 2);

      // VS badge
      const vsX = PAD_X + LABEL_W + LABEL_GAP;
      recCtx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      recCtx.font = 'bold 18px "Outfit", "Inter", sans-serif';
      recCtx.textAlign = 'center';
      recCtx.textBaseline = 'middle';
      recCtx.fillText('VS', vsX + VS_WIDTH / 2, LABEL_Y + LABEL_H / 2);

      // Player 2 (Red)
      drawRoundedRect(recCtx, p2X, LABEL_Y, LABEL_W, LABEL_H, 10);
      recCtx.fillStyle = 'rgba(255, 74, 106, 0.12)';
      recCtx.fill();
      recCtx.strokeStyle = 'rgba(255, 74, 106, 0.4)';
      recCtx.lineWidth = 1.5;
      recCtx.stroke();
      recCtx.fillStyle = '#ff4a6a';
      recCtx.font = LABEL_FONT;
      recCtx.textAlign = 'center';
      recCtx.textBaseline = 'middle';
      recCtx.fillText(CONFIG.ball2.name, p2X + LABEL_W / 2, LABEL_Y + LABEL_H / 2);

      // ── Game Board ──
      // Board background with border
      drawRoundedRect(recCtx, BOARD_X, BOARD_Y, BOARD_W, BOARD_H, BOARD_R);
      recCtx.fillStyle = 'rgba(13, 13, 20, 0.9)';
      recCtx.fill();
      recCtx.strokeStyle = 'rgba(120, 80, 255, 0.25)';
      recCtx.lineWidth = 2;
      recCtx.stroke();

      // Corner accent glows on the board
      recCtx.save();
      recCtx.beginPath();
      drawRoundedRect(recCtx, BOARD_X, BOARD_Y, BOARD_W, BOARD_H, BOARD_R);
      recCtx.clip();
      
      const cornerGrad1 = recCtx.createRadialGradient(BOARD_X, BOARD_Y, 0, BOARD_X, BOARD_Y, BOARD_W * 0.4);
      cornerGrad1.addColorStop(0, 'rgba(74, 158, 255, 0.08)');
      cornerGrad1.addColorStop(1, 'transparent');
      recCtx.fillStyle = cornerGrad1;
      recCtx.fillRect(BOARD_X, BOARD_Y, BOARD_W, BOARD_H);

      const cornerGrad2 = recCtx.createRadialGradient(BOARD_X + BOARD_W, BOARD_Y + BOARD_H, 0, BOARD_X + BOARD_W, BOARD_Y + BOARD_H, BOARD_W * 0.4);
      cornerGrad2.addColorStop(0, 'rgba(255, 74, 106, 0.08)');
      cornerGrad2.addColorStop(1, 'transparent');
      recCtx.fillStyle = cornerGrad2;
      recCtx.fillRect(BOARD_X, BOARD_Y, BOARD_W, BOARD_H);
      recCtx.restore();

      // Draw the live game canvas into the board area
      recCtx.save();
      recCtx.beginPath();
      drawRoundedRect(recCtx, BOARD_X, BOARD_Y, BOARD_W, BOARD_H, BOARD_R);
      recCtx.clip();
      recCtx.drawImage(gameCanvas, BOARD_X, BOARD_Y, BOARD_W, BOARD_H);
      recCtx.restore();

      // ── HP Values ──
      const hp1 = state.balls.length > 0 ? Math.max(0, state.balls[0].hp) : CONFIG.ball1.hp;
      const hp2 = state.balls.length > 1 ? Math.max(0, state.balls[1].hp) : CONFIG.ball2.hp;

      // ── HP Value Cards ──
      const hpCard1X = PAD_X;
      const hpCard2X = PAD_X + HP_CARD_W + HP_CARD_GAP;

      // Player 1 card
      drawRoundedRect(recCtx, hpCard1X, HP_CARD_Y, HP_CARD_W, HP_CARD_H, HP_CARD_R);
      recCtx.fillStyle = 'rgba(18, 18, 26, 0.9)';
      recCtx.fill();
      recCtx.strokeStyle = 'rgba(74, 158, 255, 0.25)';
      recCtx.lineWidth = 1;
      recCtx.stroke();
      // Label
      recCtx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      recCtx.font = '18px "Outfit", "Inter", sans-serif';
      recCtx.textAlign = 'left';
      recCtx.textBaseline = 'middle';
      recCtx.fillText('HP', hpCard1X + 20, HP_CARD_Y + HP_CARD_H / 2);
      // Value
      recCtx.fillStyle = '#4a9eff';
      recCtx.font = 'bold 32px "Outfit", "Inter", sans-serif';
      recCtx.textAlign = 'center';
      recCtx.fillText(Math.round(hp1), hpCard1X + HP_CARD_W / 2 + 15, HP_CARD_Y + HP_CARD_H / 2);

      // Player 2 card
      drawRoundedRect(recCtx, hpCard2X, HP_CARD_Y, HP_CARD_W, HP_CARD_H, HP_CARD_R);
      recCtx.fillStyle = 'rgba(18, 18, 26, 0.9)';
      recCtx.fill();
      recCtx.strokeStyle = 'rgba(255, 74, 106, 0.25)';
      recCtx.lineWidth = 1;
      recCtx.stroke();
      // Label
      recCtx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      recCtx.font = '18px "Outfit", "Inter", sans-serif';
      recCtx.textAlign = 'left';
      recCtx.textBaseline = 'middle';
      recCtx.fillText('HP', hpCard2X + 20, HP_CARD_Y + HP_CARD_H / 2);
      // Value
      recCtx.fillStyle = '#ff4a6a';
      recCtx.font = 'bold 32px "Outfit", "Inter", sans-serif';
      recCtx.textAlign = 'center';
      recCtx.fillText(Math.round(hp2), hpCard2X + HP_CARD_W / 2 + 15, HP_CARD_Y + HP_CARD_H / 2);

      // ── Match Timer ──
      const timeStr = getFormattedTime();
      recCtx.font = 'bold 22px "Outfit", "Inter", sans-serif';
      recCtx.textAlign = 'center';
      recCtx.textBaseline = 'middle';
      recCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      recCtx.fillText('\u23F1 ' + timeStr, W / 2, TIMER_Y);

      // ── Game Over Winner Overlay ──
      if (gameOverWinner) {
        // Semi-transparent dark overlay
        recCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        recCtx.fillRect(BOARD_X, BOARD_Y, BOARD_W, BOARD_H);

        // Winner text
        const winnerName = gameOverWinner.name || 'Player';
        const winnerText = `${winnerName} Wins!`;
        
        // Glow effect
        recCtx.save();
        recCtx.shadowBlur = 30;
        recCtx.shadowColor = gameOverWinner.id === 'ball-1' ? '#4a9eff' : '#ff4a6a';
        recCtx.font = 'bold 64px "Outfit", "Inter", sans-serif';
        recCtx.textAlign = 'center';
        recCtx.textBaseline = 'middle';
        recCtx.fillStyle = '#ffffff';
        recCtx.fillText(winnerText, BOARD_X + BOARD_W / 2, BOARD_Y + BOARD_H / 2);
        recCtx.restore();

        // Auto-stop recording after delay
        if (Date.now() - gameOverTime >= GAME_OVER_DELAY) {
          finalizeStop();
          return;
        }
      }
    }

    animFrameId = requestAnimationFrame(drawFrame);

    // 3. Start MediaRecorder on the recording canvas stream
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

export function stopRecording(player1Name, player2Name, winner) {
  if (!isRecording || !mediaRecorder) return;
  
  // Store player names for the upload filename
  stopRecordingPlayerNames = { player1Name, player2Name };
  
  // Set the winner — the drawFrame loop will show the overlay and auto-stop after GAME_OVER_DELAY
  if (winner) {
    gameOverWinner = winner;
    gameOverTime = Date.now();
    // The drawFrame loop will call finalizeStop() after the delay
  } else {
    // No winner (manual stop) — stop immediately
    finalizeStop();
  }
}

let stopRecordingPlayerNames = null;

function finalizeStop() {
  if (!isRecording && !mediaRecorder) return;
  
  isRecording = false;
  gameOverWinner = null;
  gameOverTime = 0;
  if (animFrameId) cancelAnimationFrame(animFrameId);

  const names = stopRecordingPlayerNames || { player1Name: 'P1', player2Name: 'P2' };

  mediaRecorder.onstop = async () => {
    const blob = new Blob(recordedChunks, { type: CONFIG.recording.mimeType });
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    stream = null;
    mediaRecorder = null;
    recCanvas = null;
    recCtx = null;
    stopRecordingPlayerNames = null;

    const now = new Date();
    const timeStr = `${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}`;
    const filename = `${names.player1Name}vs${names.player2Name}_${timeStr}.mp4`;
    
    try {
      console.log('Uploading recording...');
      const response = await fetch(`/api/upload-recording?filename=${encodeURIComponent(filename)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'video/mp4' },
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

