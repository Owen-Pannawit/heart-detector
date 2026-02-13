import React, { useEffect, useRef, useState } from "react";
import {
  FilesetResolver,
  HandLandmarker,
} from "@mediapipe/tasks-vision";
import { HAND_CONNECTIONS, VALENTINE_GIFS, FACE_FILTERS } from "./utils/constants";
import { HeartPulseEmitter, FlowerGarden } from "./utils/animations";
import Header from "./components/Header";
import ModeSelector from "./components/ModeSelector";
import FilterToggle from "./components/FilterToggle";
import ValentineModal from "./components/ValentineModal";
import LoadingScreen from "./components/LoadingScreen";
import path from 'path';

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
  const [currentGif, setCurrentGif] = useState(VALENTINE_GIFS[0]);
  
  const handLandmarkerRef = useRef(null);
  const requestRef = useRef(null);
  
  // Emitters
  const pulseEmitterRef = useRef(new HeartPulseEmitter());
  const flowerGardenRef = useRef(new FlowerGarden()); 
  
  const hasTriggeredRef = useRef(false);

  // ฟังก์ชันเปลี่ยน Filter วนไปเรื่อยๆ
  const cycleFilter = () => {
    setActiveFilterIndex((prev) => (prev + 1) % FACE_FILTERS.length);
  };

  useEffect(() => {
    if (showModal) {
        const randomIndex = Math.floor(Math.random() * VALENTINE_GIFS.length);
        setCurrentGif(VALENTINE_GIFS[randomIndex]);
    }
  }, [showModal]);

  useEffect(() => {
    const setupCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            handleResize();
          };
        }
      } catch (err) {
        console.error(err);
      }
    };

    const loadAI = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
      );
      handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "/hand_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numHands: 2,
        minHandDetectionConfidence: 0.6,
        minHandPresenceConfidence: 0.6,
        minTrackingConfidence: 0.6
      });
      setIsLoaded(true);
    };

    setupCamera();
    loadAI();
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(requestRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

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

  const checkFistGesture = (landmarks) => {
    const wrist = landmarks[0];
    const tips = [8, 12, 16, 20];
    const mcps = [5, 9, 13, 17];
    
    let foldedCount = 0;
    for(let i=0; i<tips.length; i++) {
        const distTipWrist = Math.hypot(landmarks[tips[i]].x - wrist.x, landmarks[tips[i]].y - wrist.y);
        const distMcpWrist = Math.hypot(landmarks[mcps[i]].x - wrist.x, landmarks[mcps[i]].y - wrist.y);
        
        if (distTipWrist < distMcpWrist * 1.2) { 
            foldedCount++;
        }
    }
    return foldedCount >= 3; 
  };

  const loop = () => {
    if (handLandmarkerRef.current && videoRef.current?.readyState === 4) {
      const results = handLandmarkerRef.current.detectForVideo(videoRef.current, performance.now());
      const ctx = canvasRef.current.getContext("2d");
      const w = canvasRef.current.width;
      const h = canvasRef.current.height;

      ctx.clearRect(0, 0, w, h);

      if (results.landmarks) {
        // --- ส่วนวาดโครงกระดูกมือ (Skeleton) แบบใหม่ ---
        ctx.globalAlpha = 0.6; // เพิ่มความชัดนิดหน่อย
        ctx.lineWidth = 3;     // เส้นหนาขึ้น
        ctx.strokeStyle = "#FF69B4"; // เส้นสีชมพู (Hot Pink)

        for (const landmarks of results.landmarks) {
            // วาดเส้นเชื่อม (Lines)
            for (const conn of HAND_CONNECTIONS) {
                const start = landmarks[conn[0]];
                const end = landmarks[conn[1]];
                ctx.beginPath();
                ctx.moveTo(start.x * w, start.y * h);
                ctx.lineTo(end.x * w, end.y * h);
                ctx.stroke();
            }

            // วาดจุดข้อต่อ (Dots)
            ctx.fillStyle = "white"; // สีจุดข้างในเป็นสีขาว
            for (const landmark of landmarks) {
                ctx.beginPath();
                ctx.arc(landmark.x * w, landmark.y * h, 4, 0, 2 * Math.PI); // วงกลมรัศมี 4px
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
                
                const shouldShowCard = pulseEmitterRef.current.animate(ctx, centerX, centerY, detected, w, h);
                if (shouldShowCard && !showModal && !hasTriggeredRef.current) {
                  setShowModal(true);
                  hasTriggeredRef.current = true;
                }
            } else {
                pulseEmitterRef.current.reset();
            }
        } 
        else if (filterMode === "mini") {
            for (const hand of results.landmarks) {
                const dist = Math.hypot(hand[4].x - hand[8].x, hand[4].y - hand[8].y);
                const folded = hand[12].y > hand[9].y;
                if (dist < 0.05 && folded) {
                    detected = true;
                    centerX = ((hand[4].x + hand[8].x) / 2) * w;
                    centerY = ((hand[4].y + hand[8].y) / 2) * h;
                    
                    const shouldShowCard = pulseEmitterRef.current.animate(ctx, centerX, centerY, detected, w, h);
                    if (shouldShowCard && !showModal && !hasTriggeredRef.current) {
                      setShowModal(true);
                      hasTriggeredRef.current = true;
                    }
                    break; 
                }
            }
            if (!detected) pulseEmitterRef.current.reset();
        }
        else if (filterMode === "flower") {
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

                    flowerGardenRef.current.animate(ctx, topX, topY, bottomX, bottomY, true, angle);
                    break; 
                }
            }
            if (!detected) {
                flowerGardenRef.current.animate(ctx, 0, 0, 0, 0, false, 0);
            }
        }

        setIsDetected(detected);
      }
    }
    requestRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => { if (isLoaded) loop(); }, [isLoaded, filterMode, showModal]);

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
            playsInline muted autoPlay 
            style={{ filter: FACE_FILTERS[activeFilterIndex].style }} 
        />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
      </div>

      <Header />
      <FilterToggle currentFilter={FACE_FILTERS[activeFilterIndex]} onCycle={cycleFilter} />
      <ModeSelector currentMode={filterMode} setMode={setFilterMode} />
      
      {/* แสดง LoadingScreen ถ้ายังโหลดไม่เสร็จ (!isLoaded) */}
      {!isLoaded && <LoadingScreen />}
      <ValentineModal show={showModal} onClose={closeModal} gifUrl={currentGif} />
      <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap" rel="stylesheet" />
    </div>
  );
};

export default App;