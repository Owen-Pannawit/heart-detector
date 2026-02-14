/* eslint-disable no-unused-vars */
import React, { useEffect, useRef, useState } from "react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import {
  HAND_CONNECTIONS,
  VALENTINE_GIFS,
  FACE_FILTERS,
} from "./utils/constants";
import { HeartPulseEmitter, FlowerGarden } from "./utils/animations";
import Header from "./components/Header";
import ModeSelector from "./components/ModeSelector";
import FilterToggle from "./components/FilterToggle";
import ValentineModal from "./components/ValentineModal";
import LoadingScreen from "./components/LoadingScreen";

const getDeviceConfig = () => {
  const ua = navigator.userAgent.toLowerCase();
  const isMobile =
    /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);

  // พยายามดึงชื่อรุ่นการ์ดจอ
  let renderer = "";
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (gl) {
      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
      if (debugInfo) {
        renderer = gl
          .getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
          .toLowerCase();
      }
    }
    // eslint-disable-next-line no-unused-vars
  } catch (ex) {
    console.warn("Cannot detect GPU renderer");
  }

  // เช็คประเภทการ์ดจอ
  const isIntel = /intel|uhd|iris|hd graphics/.test(renderer); // Onboard ทั่วไป
  const isApple = /apple|m1|m2|m3/.test(renderer); // Mac แรงๆ
  const isDedicated = /nvidia|geforce|radeon|rtx|gtx/.test(renderer); // การ์ดจอแยก

  let config = {
    label: "Standard PC",
    video: { width: { ideal: 640 }, height: { ideal: 480 } },
    aiInterval: 40,
    useGPU: true,
  };

  if (isMobile) {
    config = {
      label: "Mobile",
      video: { width: { ideal: 480 }, height: { ideal: 640 } },
      aiInterval: 60, // ลดภาระมือถือ
      useGPU: true,
    };
  } else if (isIntel) {
    // --- Onboard GPU Strategy ---
    config = {
      label: "Onboard GPU (Intel)",
      video: { width: { ideal: 640 }, height: { ideal: 480 } }, // VGA พอ
      aiInterval: 50, // 20 FPS
      useGPU: true,
    };
  } else if (isDedicated || isApple) {
    // เครื่องแรง
    config = {
      label: "High-Performance GPU",
      video: { width: { ideal: 1280 }, height: { ideal: 720 } }, // HD
      aiInterval: 25, // 40 FPS
      useGPU: true,
    };
  } else {
    // ไม่รู้จักการ์ดจอ หรือ CPU เก่าๆ
    config = {
      label: "Unknown/Low Spec",
      video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      aiInterval: 60,
      useGPU: true,
    };
  }

  // --- LOGGING SECTION ---
  console.group("🕵️ Device Detection Report");
  console.log(`📱 Mobile Device: ${isMobile}`);
  console.log(`🎮 GPU Renderer: ${renderer || "Unknown"}`);
  console.log(`🏷️ Selected Profile: ${config.label}`);
  console.log(`⏱️ AI Interval: ${config.aiInterval}ms`);
  console.log(`📺 Video Resolution:`, config.video);
  console.log(`⚡ Use GPU Delegate: ${config.useGPU}`);
  console.groupEnd();

  return config;
};

const App = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [filterMode, setFilterMode] = useState("heart");
  const [isDetected, setIsDetected] = useState(false);

  // Filter State
  const [activeFilterIndex, setActiveFilterIndex] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [currentGif, setCurrentGif] = useState(null);
  const [deviceConfig, setDeviceConfig] = useState({
    aiInterval: 50,
    useGPU: true,
    video: {
      width: { ideal: 640 },
      height: { ideal: 480 },
      facingMode: "user",
    },
  });

  const handLandmarkerRef = useRef(null);
  const requestRef = useRef(null);

  // Emitters
  const pulseEmitterRef = useRef(new HeartPulseEmitter());
  const flowerGardenRef = useRef(new FlowerGarden());

  const hasTriggeredRef = useRef(false);

  const lastPredictionTimeRef = useRef(0);
  const lastResultsRef = useRef(null);
  // ฟังก์ชันเปลี่ยน Filter วนไปเรื่อยๆ
  const cycleFilter = () => {
    setActiveFilterIndex((prev) => (prev + 1) % FACE_FILTERS.length);
  };

  const handleResize = () => {
    if (videoRef.current && wrapperRef.current) {
      const vw = videoRef.current.videoWidth;
      const vh = videoRef.current.videoHeight;
      const sw = window.innerWidth;
      const sh = window.innerHeight;
      const scale = Math.max(sw / vw, sh / vh);
      wrapperRef.current.style.width = `${vw * scale}px`;
      wrapperRef.current.style.height = `${vh * scale}px`;
      if (canvasRef.current) {
        canvasRef.current.width = vw;
        canvasRef.current.height = vh;
      }
    }
  };

  useEffect(() => {
    const config = getDeviceConfig();
    setDeviceConfig(config); // Save config to state

    const setupCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: config.video, // Use optimized video constraints
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            handleResize();
          };
        }
      } catch (err) {
        console.error("Camera Error:", err);
      }
    };
    setupCamera();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  useEffect(() => {
    if (showModal) {
      const randomIndex = Math.floor(Math.random() * VALENTINE_GIFS.length);
      setCurrentGif(VALENTINE_GIFS[randomIndex]);
    }
  }, [showModal]);
  useEffect(() => {
    let active = true;
    const loadAI = async () => {
      setIsLoaded(false);
      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close();
        handLandmarkerRef.current = null;
      }

      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm",
      );

      const commonOptions = {
        runningMode: "VIDEO",
        numHands: 2,
        minHandDetectionConfidence: 0.7,
        minHandPresenceConfidence: 0.7,
        minTrackingConfidence: 0.5,
      };

      try {
        handLandmarkerRef.current = await HandLandmarker.createFromOptions(
          vision,
          {
            baseOptions: {
              modelAssetPath: "hand_landmarker.task",
              delegate: deviceConfig.useGPU ? "GPU" : "CPU",
            },
            ...commonOptions,
          },
        );
      } catch (error) {
        console.warn("GPU init failed, switching to CPU:", error);
        handLandmarkerRef.current = await HandLandmarker.createFromOptions(
          vision,
          {
            baseOptions: {
              modelAssetPath: "hand_landmarker.task",
              delegate: "CPU",
            },
            ...commonOptions,
          },
        );
      }

      if (active) setIsLoaded(true);
    };

    if (deviceConfig) loadAI();

    return () => {
      active = false;
      cancelAnimationFrame(requestRef.current);
    };
  }, [deviceConfig]);

  const checkFistGesture = (landmarks) => {
    const wrist = landmarks[0];
    const tips = [8, 12, 16, 20];
    const mcps = [5, 9, 13, 17];

    let foldedCount = 0;
    for (let i = 0; i < tips.length; i++) {
      const distTipWrist = Math.hypot(
        landmarks[tips[i]].x - wrist.x,
        landmarks[tips[i]].y - wrist.y,
      );
      const distMcpWrist = Math.hypot(
        landmarks[mcps[i]].x - wrist.x,
        landmarks[mcps[i]].y - wrist.y,
      );

      if (distTipWrist < distMcpWrist * 1.2) {
        foldedCount++;
      }
    }
    return foldedCount >= 3;
  };

  const loop = () => {
    // eslint-disable-next-line react-hooks/purity
    const now = performance.now();
    const video = videoRef.current;

    if (handLandmarkerRef.current && video && video.readyState === 4) {
      if (now - lastPredictionTimeRef.current > deviceConfig.aiInterval) {
        const results = handLandmarkerRef.current.detectForVideo(video, now);
        lastResultsRef.current = results;
        lastPredictionTimeRef.current = now;
      }
    }

    const ctx = canvasRef.current?.getContext("2d");
    if (ctx && canvasRef.current) {
      const w = canvasRef.current.width;
      const h = canvasRef.current.height;
      ctx.clearRect(0, 0, w, h);

      const results = lastResultsRef.current;

      if (results && results.landmarks) {
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#FF69B4";
        for (const landmarks of results.landmarks) {
          for (const conn of HAND_CONNECTIONS) {
            const start = landmarks[conn[0]];
            const end = landmarks[conn[1]];
            ctx.beginPath();
            ctx.moveTo(start.x * w, start.y * h);
            ctx.lineTo(end.x * w, end.y * h);
            ctx.stroke();
          }
          ctx.fillStyle = "white";
          for (const landmark of landmarks) {
            ctx.beginPath();
            ctx.arc(landmark.x * w, landmark.y * h, 3, 0, 2 * Math.PI);
            ctx.fill();
          }
        }
        ctx.globalAlpha = 1.0;

        let detected = false;
        let centerX = 0;
        let centerY = 0;

        if (filterMode === "heart" && results.landmarks.length === 2) {
          const [h1, h2] = results.landmarks;
          const distThumb = Math.hypot(h1[4].x - h2[4].x, h1[4].y - h2[4].y);
          const distIndex = Math.hypot(h1[8].x - h2[8].x, h1[8].y - h2[8].y);
          if (distThumb < 0.08 && distIndex < 0.08) {
            detected = true;
            centerX = ((h1[4].x + h2[4].x + h1[8].x + h2[8].x) / 4) * w;
            centerY = ((h1[4].y + h2[4].y + h1[8].y + h2[8].y) / 4) * h;
            const shouldShowCard = pulseEmitterRef.current.animate(
              ctx,
              centerX,
              centerY,
              detected,
              w,
              h,
            );
            if (shouldShowCard && !showModal && !hasTriggeredRef.current) {
              setShowModal(true);
              hasTriggeredRef.current = true;
            }
          } else {
            pulseEmitterRef.current.reset();
          }
        } else if (filterMode === "mini") {
          for (const hand of results.landmarks) {
            const dist = Math.hypot(
              hand[4].x - hand[8].x,
              hand[4].y - hand[8].y,
            );
            const folded = hand[12].y > hand[9].y;
            if (dist < 0.05 && folded) {
              detected = true;
              centerX = ((hand[4].x + hand[8].x) / 2) * w;
              centerY = ((hand[4].y + hand[8].y) / 2) * h;
              const shouldShowCard = pulseEmitterRef.current.animate(
                ctx,
                centerX,
                centerY,
                detected,
                w,
                h,
              );
              if (shouldShowCard && !showModal && !hasTriggeredRef.current) {
                setShowModal(true);
                hasTriggeredRef.current = true;
              }
              break;
            }
          }
          if (!detected) pulseEmitterRef.current.reset();
        } else if (filterMode === "flower") {
          for (const hand of results.landmarks) {
            if (checkFistGesture(hand)) {
              detected = true;
              const topX = ((hand[3].x + hand[5].x) / 2) * w;
              const topY = ((hand[3].y + hand[5].y) / 2) * h;
              const bottomX = hand[0].x * w;
              const bottomY = hand[0].y * h;
              const dx = topX - bottomX;
              const dy = topY - bottomY;
              const angle = Math.atan2(dy, dx);
              flowerGardenRef.current.animate(
                ctx,
                topX,
                topY,
                bottomX,
                bottomY,
                true,
                angle,
              );
              break;
            }
          }
          if (!detected)
            flowerGardenRef.current.animate(ctx, 0, 0, 0, 0, false, 0);
        }
        setIsDetected(detected);
      }
    }
    requestRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    if (isLoaded) loop();
  }, [isLoaded, filterMode, showModal]);

  const closeModal = () => {
    setShowModal(false);
    hasTriggeredRef.current = false;
    pulseEmitterRef.current.reset();
    flowerGardenRef.current.reset();
  };

  return (
    <div className="fixed inset-0 bg-black overflow-hidden flex items-center justify-center font-sans select-none">
      {/* Wrapper */}
      <div
        ref={wrapperRef}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ transform: "translate(-50%, -50%) scaleX(-1)" }}
      >
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-contain"
          playsInline
          muted
          autoPlay
          style={{ filter: FACE_FILTERS[activeFilterIndex].style }}
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
      </div>

      <Header />

      <button
        onClick={() =>
          setDeviceConfig((prev) => ({ ...prev, useGPU: !prev.useGPU }))
        }
        className={`absolute top-6 left-6 z-40 backdrop-blur-md border text-white rounded-full px-4 py-2 flex items-center gap-2 transition-all shadow-lg ${deviceConfig.useGPU ? "bg-green-500/40 border-green-400/50 hover:bg-green-500/60" : "bg-gray-500/40 border-gray-400/50 hover:bg-gray-500/60"}`}
      >
        <span className="text-xl">{deviceConfig.useGPU ? "⚡" : "🐢"}</span>
        <span className="text-xs font-bold tracking-wide uppercase">
          {deviceConfig.useGPU ? "GPU" : "CPU"}
        </span>
      </button>

      <FilterToggle
        currentFilter={FACE_FILTERS[activeFilterIndex]}
        onCycle={cycleFilter}
      />
      <ModeSelector currentMode={filterMode} setMode={setFilterMode} />

      {/* แสดง LoadingScreen ถ้ายังโหลดไม่เสร็จ (!isLoaded) */}
      {!isLoaded && <LoadingScreen />}
      <ValentineModal
        show={showModal}
        onClose={closeModal}
        gifUrl={currentGif}
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap"
        rel="stylesheet"
      />
    </div>
  );
};

export default App;
