import { useEffect, useState, useRef } from "react";


import introVideo from "../assets/cup_intro.webm?url";
import idleVideo from "../assets/cup_idle.webm?url";
import listeningVideo from "../assets/cup_listening.webm?url";
import speakingVideo from "../assets/cup_speaking.webm?url";

type WaiterState = "intro" | "idle" | "listening" | "speaking";

declare global {
    interface Window {
        setWaiterState?: (state: WaiterState) => void;
    }
}

export function WaiterWidget() {
    const [state, setState] = useState<WaiterState>("intro");
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        window.setWaiterState = (s: WaiterState) => setState(s);
    }, []);

    const videoSrc =
        state === "intro"     ? introVideo :
            state === "listening" ? listeningVideo :
                state === "speaking"  ? speakingVideo :
                    idleVideo;

    const handleVideoEnd = () => {
        if (state === "intro") {
            setState("idle");
        }
        else if (state === "idle") {
            setTimeout(() => {
                if (videoRef.current && state === "idle") {
                    videoRef.current.currentTime = 0;
                    videoRef.current.play();
                }
            }, 3000);
        }

        else if (state === "listening") {
            setTimeout(() => {
                if (videoRef.current && state === "listening") {
                    videoRef.current.currentTime = 0;
                    videoRef.current.play();
                }
            }, 500);
        }
    };

    return (
        <div className="waiter">
            <div className="waiter-avatar">
                {videoSrc && (
                    <video
                        ref={videoRef}
                        key={videoSrc}
                        src={videoSrc}
                        autoPlay
                        muted
                        playsInline
                        onEnded={handleVideoEnd}
                        className={`waiter-video ${state}`}
                        style={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none" }}
                    />
                )}
            </div>

            <div className="waiter-text">
                {state === "intro"     ? "Привіт! Я тут, щоб допомогти" :
                    state === "idle"      ? "Офіціант готовий допомогти" :
                        state === "listening" ? "Слухаю..." :
                            "Підказує..."}
            </div>
        </div>
    );
}