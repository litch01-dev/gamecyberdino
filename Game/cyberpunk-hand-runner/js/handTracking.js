/**
 * CYBERPUNK HAND RUNNER - MediaPipe Hand Tracking System
 * High precision, real-time hand gesture tracking via webcam using MediaPipe Tasks Vision.
 */

import { Storage } from './storage.js';

export class HandTracker {
  constructor() {
    this.videoElement = null;
    this.stream = null;
    this.handLandmarker = null;
    this.isInitializing = false;
    this.isReady = false;
    this.isTracking = false;

    // Tracking Data
    this.handDetected = false;
    this.rawY = 0.65;
    this.smoothedY = 0.65;
    this.landmarks = null;

    // Calibration & Gesture Logic
    const settings = Storage.getSettings();
    this.baselineY = settings.calibrationBaseline || 0.65;
    this.sensitivity = settings.handSensitivity || 3;
    this.jumpThreshold = this.calculateThreshold(this.sensitivity);

    // Debounce & State Management
    this.isJumpTriggered = false;
    this.lastJumpTime = 0;
    this.jumpCooldown = 400; // ms
    this.alphaEMA = 0.6; // Smoothing factor (0 = full smooth, 1 = raw)

    // Hand loss debounce
    this.framesSinceHandLost = 0;

    // Callback
    this.onJumpCallback = null;
    this.onStatusChangeCallback = null;
    this.status = 'CAMERA INACTIVE';
  }

  /**
   * Convert sensitivity 1-5 to vertical threshold (lower threshold = more sensitive)
   */
  calculateThreshold(level) {
    // Level 1: 0.18 (requires big lift)
    // Level 3: 0.12 (balanced default)
    // Level 5: 0.07 (fast minimal lift)
    const map = {
      1: 0.18,
      2: 0.15,
      3: 0.12,
      4: 0.09,
      5: 0.07
    };
    return map[level] || 0.12;
  }

  setSensitivity(level) {
    this.sensitivity = level;
    this.jumpThreshold = this.calculateThreshold(level);
  }

  setStatus(status) {
    this.status = status;
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback(status);
    }
  }

  /**
   * Initialize MediaPipe HandLandmarker and request webcam permission
   */
  async init(videoElement) {
    if (this.isReady) return true;
    if (this.isInitializing) return false;

    this.isInitializing = true;
    this.videoElement = videoElement;
    this.setStatus('INITIALIZING VISION ENGINE...');

    try {
      // 1. Load MediaPipe Tasks Vision from CDN
      const visionModule = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14');
      const { FilesetResolver, HandLandmarker } = visionModule;

      this.setStatus('LOADING HAND MODEL...');
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );

      try {
        this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.6,
          minHandPresenceConfidence: 0.6,
          minTrackingConfidence: 0.6
        });
      } catch (gpuErr) {
        console.warn('GPU delegate failed, falling back to CPU:', gpuErr);
        this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'CPU'
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.6,
          minHandPresenceConfidence: 0.6,
          minTrackingConfidence: 0.6
        });
      }

      this.setStatus('INITIALIZING CAMERA...');
      await this.startCamera();

      this.isReady = true;
      this.isInitializing = false;
      this.setStatus('CAMERA ACTIVE - SEARCHING FOR HAND');
      return true;
    } catch (err) {
      console.error('Failed to initialize MediaPipe Hand Landmarker:', err);
      this.isInitializing = false;
      this.setStatus('CAMERA / VISION ERROR');
      throw err;
    }
  }

  /**
   * Start webcam video stream
   */
  async startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Webcam mediaDevices API not supported in this browser.');
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      this.videoElement.srcObject = this.stream;
      await new Promise(resolve => {
        this.videoElement.onloadedmetadata = () => {
          this.videoElement.play();
          resolve();
        };
      });

      this.isTracking = true;
    } catch (err) {
      console.error('Camera access denied or failed:', err);
      throw err;
    }
  }

  /**
   * Stop camera stream cleanly to respect user privacy and save battery
   */
  stopCamera() {
    this.isTracking = false;
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
    this.setStatus('CAMERA OFF');
  }

  /**
   * Calibrate current hand position as neutral baseline
   */
  calibrateCurrentPosition() {
    if (this.handDetected) {
      this.baselineY = this.smoothedY;
      Storage.updateSetting('calibrationBaseline', this.baselineY);
      return true;
    }
    return false;
  }

  /**
   * Process a video frame for hand landmarks
   */
  processFrame() {
    if (!this.isReady || !this.isTracking || !this.handLandmarker || !this.videoElement) {
      return;
    }

    if (this.videoElement.readyState < 2) return;

    try {
      const now = performance.now();
      const results = this.handLandmarker.detectForVideo(this.videoElement, now);

      if (results && results.landmarks && results.landmarks.length > 0) {
        this.handDetected = true;
        this.framesSinceHandLost = 0;
        this.landmarks = results.landmarks[0];

        // Calculate palm center Y using Wrist (0) and Knuckles (5, 9, 13, 17)
        const wrist = this.landmarks[0];
        const indexMcp = this.landmarks[5];
        const middleMcp = this.landmarks[9];
        const ringMcp = this.landmarks[13];
        const pinkyMcp = this.landmarks[17];

        const palmY = (wrist.y + indexMcp.y + middleMcp.y + ringMcp.y + pinkyMcp.y) / 5;
        this.rawY = palmY;

        // Exponential Moving Average (EMA) smoothing
        this.smoothedY = (this.alphaEMA * this.rawY) + ((1 - this.alphaEMA) * this.smoothedY);

        // Gesture Detection: Lift hand UP -> palmY decreases
        this.checkJumpGesture(now);
      } else {
        this.framesSinceHandLost++;
        if (this.framesSinceHandLost > 8) {
          this.handDetected = false;
          this.landmarks = null;
        }
      }
    } catch (e) {
      // Occasional timestamp frame drops
    }
  }

  /**
   * Check if smoothed position exceeds jump threshold
   */
  checkJumpGesture(now) {
    const deltaY = this.baselineY - this.smoothedY; // Positive when hand is raised

    // Trigger condition
    if (deltaY > this.jumpThreshold) {
      if (!this.isJumpTriggered && (now - this.lastJumpTime > this.jumpCooldown)) {
        this.isJumpTriggered = true;
        this.lastJumpTime = now;

        if (this.onJumpCallback) {
          this.onJumpCallback();
        }
      }
    } else if (deltaY < this.jumpThreshold * 0.45) {
      // Hand returned to neutral rest position
      this.isJumpTriggered = false;
    }
  }

  /**
   * Render hand skeleton, baseline, and jump threshold on any canvas
   */
  renderDebug(ctx, width, height, isMiniPip = false) {
    ctx.save();

    // Mirror image for natural user movement
    ctx.translate(width, 0);
    ctx.scale(-1, 1);

    // Draw video feed
    if (this.videoElement && this.videoElement.readyState >= 2) {
      ctx.drawImage(this.videoElement, 0, 0, width, height);
    } else {
      ctx.fillStyle = '#080B16';
      ctx.fillRect(0, 0, width, height);
    }

    // Semi-transparent dark tech overlay
    ctx.fillStyle = 'rgba(8, 11, 22, 0.45)';
    ctx.fillRect(0, 0, width, height);

    // Draw Hand Skeleton if detected
    if (this.handDetected && this.landmarks) {
      this.drawHandLandmarks(ctx, width, height, isMiniPip);
    }

    // Invert back to normal coordinates for HUD text & lines
    ctx.restore();
    ctx.save();

    // Baseline Line (Rest height)
    const basePixelY = this.baselineY * height;
    ctx.strokeStyle = '#287BFF';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, basePixelY);
    ctx.lineTo(width, basePixelY);
    ctx.stroke();

    // Jump Threshold Line
    const thresholdPixelY = (this.baselineY - this.jumpThreshold) * height;
    ctx.strokeStyle = this.isJumpTriggered ? '#00FF66' : '#00E5FF';
    ctx.lineWidth = 2;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(0, thresholdPixelY);
    ctx.lineTo(width, thresholdPixelY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Current hand height indicator circle & line
    if (this.handDetected) {
      const currentPixelY = this.smoothedY * height;
      ctx.fillStyle = this.isJumpTriggered ? '#00FF66' : '#00E5FF';
      ctx.shadowBlur = 8;
      ctx.shadowColor = ctx.fillStyle;
      ctx.beginPath();
      ctx.arc(width - 16, currentPixelY, isMiniPip ? 4 : 7, 0, Math.PI * 2);
      ctx.fill();
    }

    // HUD Text overlay
    if (!isMiniPip) {
      ctx.fillStyle = '#8B98B7';
      ctx.font = '10px Rajdhani, sans-serif';
      ctx.fillText('JUMP THRESHOLD', 10, thresholdPixelY - 4);
      ctx.fillText('NEUTRAL BASELINE', 10, basePixelY + 12);
    }

    ctx.restore();
  }

  /**
   * Draw MediaPipe Hand joints & bones
   */
  drawHandLandmarks(ctx, width, height, isMiniPip) {
    const connections = [
      // Thumb
      [0, 1], [1, 2], [2, 3], [3, 4],
      // Index
      [0, 5], [5, 6], [6, 7], [7, 8],
      // Middle
      [5, 9], [9, 10], [10, 11], [11, 12],
      // Ring
      [9, 13], [13, 14], [14, 15], [15, 16],
      // Pinky
      [13, 17], [17, 18], [18, 19], [19, 20],
      // Palm base
      [0, 17]
    ];

    // Bones
    ctx.strokeStyle = this.isJumpTriggered ? 'rgba(0, 255, 102, 0.85)' : 'rgba(0, 229, 255, 0.75)';
    ctx.lineWidth = isMiniPip ? 1.5 : 2.5;

    for (const [start, end] of connections) {
      const p1 = this.landmarks[start];
      const p2 = this.landmarks[end];
      ctx.beginPath();
      ctx.moveTo(p1.x * width, p1.y * height);
      ctx.lineTo(p2.x * width, p2.y * height);
      ctx.stroke();
    }

    // Joints
    ctx.fillStyle = this.isJumpTriggered ? '#00FF66' : '#9B5CFF';
    for (const lm of this.landmarks) {
      ctx.beginPath();
      ctx.arc(lm.x * width, lm.y * height, isMiniPip ? 2 : 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export const HandTrackerInstance = new HandTracker();
