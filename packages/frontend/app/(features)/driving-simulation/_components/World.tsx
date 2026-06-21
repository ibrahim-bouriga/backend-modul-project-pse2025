"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { SceneManager } from "../_lib/SceneManager";
import { buildInterior } from "../_lib/InteriorBuilder";
import { CarController } from "../_lib/CarController";
import { TrackGenerator } from "../_lib/TrackGenerator";
import { MQTTController } from "../_lib/MQTTController";
import type { CarInput } from "../_lib/types";

function getKeyboardInput(keys: Record<string, boolean>): CarInput {
  return {
    throttle: keys["w"] ? 1 : keys["s"] ? -1 : 0,
    steering: keys["d"] ? 1 : keys["a"] ? -1 : 0,
  };
}

type PhoneStatus = "connecting" | "active" | "disconnected";

export default function World() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const qrRef = useRef<HTMLCanvasElement>(null);
  const mountedRef = useRef(true);

  const [mqttConnected, setMqttConnected] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [speedKmh, setSpeedKmh] = useState(0);
  // Ersetzt die bisherige reine mqttConnected-Anzeige um einen dritten
  // Zustand: Broker verbunden, aber das Smartphone selbst sendet aktuell
  // keine Daten mehr (App geschlossen, gesperrt, WLAN weg). Vorher blieb
  // das in der UI unsichtbar, obwohl der MQTTController.ts-Watchdog den
  // Input bereits intern zurücksetzt.
  const [phoneStatus, setPhoneStatus] = useState<PhoneStatus>("connecting");

  useEffect(() => {
    mountedRef.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // --- Szene ---
    const sceneManager = new SceneManager(canvas);

    // --- MQTT ---
    const mqttController = new MQTTController();
    if (mountedRef.current) setSessionId(mqttController.sessionId);

    mqttController.connect().then(() => {
      if (!mountedRef.current) return;
      setMqttConnected(true);
      if (qrRef.current)
        mqttController.renderQRCode(qrRef.current, window.location.origin);
    });

    // --- Fahrzeug ---
    const carController = new CarController(sceneManager.camera);
    sceneManager.scene.add(carController.root);

    const {
      group: interior,
      steeringWheel,
      rearviewSurface,
      leftMirrorSurface,
      rightMirrorSurface,
    } = buildInterior();
    carController.root.add(interior);
    carController.setSteeringWheel(steeringWheel);

    // Eigener Layer für alle Spiegelflächen-Meshes selbst (nicht für die
    // restliche Szene). Löst die Feedback-Loop-Problematik: Eine Spiegel-
    // kamera rendert in ihr eigenes Render-Target, dessen Textur aber von
    // den Spiegelflächen-Materials referenziert wird - befindet sich eine
    // Spiegelfläche im Sichtfeld EINER der Spiegelkameras (z.B. sieht die
    // Rückspiegel-Kamera einen Außenspiegel im Hintergrund), entsteht ein
    // Zirkelbezug, der die GPU-Warnung "Feedback loop formed between
    // Framebuffer and active Texture" auslöst und im schlimmsten Fall dazu
    // führt, dass die Zieltextur nie korrekt befüllt wird - das Mesh zeigt
    // dann dauerhaft seine ursprüngliche Platzhalter-Farbe statt des RTT-Bilds.
    const MIRROR_SURFACE_LAYER = 1;
    rearviewSurface.layers.set(MIRROR_SURFACE_LAYER);
    leftMirrorSurface.layers.set(MIRROR_SURFACE_LAYER);
    rightMirrorSurface.layers.set(MIRROR_SURFACE_LAYER);
    // Hauptkamera muss weiterhin BEIDE Layer sehen (0 = Standard, 1 = Spiegel),
    // sonst verschwinden die Spiegelflächen aus der normalen Ansicht.
    sceneManager.camera.layers.enableAll();

    // --- Rückspiegel-RTT ---
    const MIRROR_W = 256,
      MIRROR_H = 76;
    const mirrorRT = new THREE.WebGLRenderTarget(MIRROR_W, MIRROR_H, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
    });
    const mirrorCam = new THREE.PerspectiveCamera(
      45,
      MIRROR_W / MIRROR_H,
      0.05,
      300,
    );
    mirrorCam.position.set(0, 1.35, 0.1);
    mirrorCam.rotation.y = Math.PI;
    mirrorCam.layers.enable(0);
    mirrorCam.layers.disable(MIRROR_SURFACE_LAYER);
    carController.root.add(mirrorCam);

    // --- Außenspiegel-RTT (links + rechts) ---
    const SIDE_W = 192,
      SIDE_H = 130;
    const SIDE_ASPECT = SIDE_W / SIDE_H;

    const leftMirrorRT = new THREE.WebGLRenderTarget(SIDE_W, SIDE_H, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
    });
    const leftMirrorCam = new THREE.PerspectiveCamera(
      50,
      SIDE_ASPECT,
      0.05,
      300,
    );
    leftMirrorCam.position.set(-0.87, 1.062, -0.945);
    leftMirrorCam.rotation.y = Math.PI + 0.3;
    leftMirrorCam.layers.enable(0);
    leftMirrorCam.layers.disable(MIRROR_SURFACE_LAYER);
    carController.root.add(leftMirrorCam);

    const rightMirrorRT = new THREE.WebGLRenderTarget(SIDE_W, SIDE_H, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
    });
    const rightMirrorCam = new THREE.PerspectiveCamera(
      50,
      SIDE_ASPECT,
      0.05,
      300,
    );
    rightMirrorCam.position.set(0.87, 1.062, -0.945);
    rightMirrorCam.rotation.y = Math.PI - 0.3;
    rightMirrorCam.layers.enable(0);
    rightMirrorCam.layers.disable(MIRROR_SURFACE_LAYER);
    carController.root.add(rightMirrorCam);

    // --- Material-Zuweisung GESAMMELT am Ende, nachdem alle Kameras und
    // Render-Targets vollständig eingerichtet sind. Testweise umstrukturiert,
    // um auszuschließen, dass eine spätere Kamera-Operation eine frühere
    // material-Zuweisung versehentlich überschreibt (z.B. falls buildInterior
    // intern irgendwo erneut auf dieselbe Objektreferenz zugreift).
    mirrorRT.texture.repeat.set(-1, 1);
    mirrorRT.texture.offset.set(1, 0);
    rearviewSurface.material = new THREE.MeshBasicMaterial({
      map: mirrorRT.texture,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });

    leftMirrorRT.texture.repeat.set(-1, 1);
    leftMirrorRT.texture.offset.set(1, 0);
    leftMirrorSurface.material = new THREE.MeshBasicMaterial({
      map: leftMirrorRT.texture,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });

    rightMirrorRT.texture.repeat.set(-1, 1);
    rightMirrorRT.texture.offset.set(1, 0);
    rightMirrorSurface.material = new THREE.MeshBasicMaterial({
      map: rightMirrorRT.texture,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });

    // --- Strecke ---
    const trackGen = new TrackGenerator(sceneManager.scene, { seed: 42 });
    const spawn = trackGen.generate();
    carController.setSpawn(spawn.position, spawn.yaw);

    // --- Tastatur ---
    const keys: Record<string, boolean> = {};
    const onKeyDown = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    // --- Game Loop ---
    const clock = new THREE.Clock();
    let raf: number;
    let frame = 0;

    function loop() {
      raf = requestAnimationFrame(loop);
      const delta = Math.min(clock.getDelta(), 0.05);

      // MQTT überschreibt Tastatur, sobald das Smartphone aktiv neigt.
      // mqttController.input ist bereits {0,0}, falls der Watchdog in
      // MQTTController.ts einen Timeout erkannt hat - mqttActive wird in
      // diesem Fall automatisch false, Tastatur greift dann ohnehin.
      const mqttInput = mqttController.input;
      const mqttActive =
        mqttController.isConnected &&
        (mqttInput.throttle !== 0 || mqttInput.steering !== 0);
      const input = mqttActive ? mqttInput : getKeyboardInput(keys);

      carController.update(delta, input);
      trackGen.update(carController.root.position);

      // Spiegel-Pässe → Hauptansicht
      const r = sceneManager.renderer;
      const sc = sceneManager.scene;
      r.setRenderTarget(mirrorRT);
      r.render(sc, mirrorCam);
      r.setRenderTarget(leftMirrorRT);
      r.render(sc, leftMirrorCam);
      r.setRenderTarget(rightMirrorRT);
      r.render(sc, rightMirrorCam);
      r.setRenderTarget(null);
      r.render(sc, sceneManager.camera);

      // Speed-HUD ~10 fps aktualisieren (kein Re-render jedes Frame)
      if (++frame % 6 === 0 && mountedRef.current) {
        setSpeedKmh(Math.round(Math.abs(carController.currentSpeed) * 3.6));

        // Phone-Status im selben, gedrosselten Rhythmus aktualisieren.
        // isPhoneActive ändert sich zeitbasiert in MQTTController.ts ohne
        // eigenen React-State - daher hier aktiv abfragen statt auf ein
        // Event zu warten, das es dafür nicht gibt.
        const next: PhoneStatus = !mqttController.isConnected
          ? "connecting"
          : mqttController.isPhoneActive
            ? "active"
            : "disconnected";
        setPhoneStatus(next);
      }
    }

    loop();

    return () => {
      mountedRef.current = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      mqttController.disconnect();
      mirrorRT.dispose();
      leftMirrorRT.dispose();
      rightMirrorRT.dispose();
      trackGen.dispose();
      sceneManager.dispose();
    };
  }, []);

  // Zentrale Stelle für Text/Farbe der Statusanzeige, statt verschachtelte
  // Bedingungen direkt im JSX - leichter lesbar und einfacher zu erweitern.
  const statusDisplay = {
    connecting: { text: "Verbinde…", color: "#ff9800" },
    active: { text: "Steuerung aktiv", color: "#4caf50" },
    disconnected: {
      text: "Smartphone getrennt – Tastatur aktiv",
      color: "#ff5722",
    },
  }[phoneStatus];

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
        background: "#87ceeb",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", height: "100%" }}
      />

      {/* Tachometer */}
      <div
        style={{
          position: "absolute",
          top: 16,
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(0,0,0,0.6)",
          color: "#fff",
          padding: "6px 20px",
          borderRadius: 24,
          fontFamily: "monospace",
          fontSize: 24,
          letterSpacing: 2,
          pointerEvents: "none",
        }}
      >
        {speedKmh} <span style={{ fontSize: 13, opacity: 0.65 }}>km/h</span>
      </div>

      {/* MQTT-Status + QR-Code */}
      <div
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          background: "rgba(0,0,0,0.75)",
          color: "#fff",
          padding: "12px 14px",
          borderRadius: 10,
          fontSize: 13,
          textAlign: "center",
          minWidth: 160,
        }}
      >
        <div
          style={{
            marginBottom: 10,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              background: statusDisplay.color,
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          {statusDisplay.text}
        </div>
        <canvas ref={qrRef} style={{ display: "block" }} />
        {mqttConnected && (
          <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4 }}>
            Smartphone scannen
          </div>
        )}
        {sessionId && (
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 9,
              opacity: 0.45,
              marginTop: 2,
            }}
          >
            {sessionId.slice(0, 8)}
          </div>
        )}
      </div>

      {/* Steuerungs-Hinweis */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: 16,
          background: "rgba(0,0,0,0.55)",
          color: "#bbb",
          padding: "7px 13px",
          borderRadius: 8,
          fontSize: 12,
          lineHeight: 1.7,
          pointerEvents: "none",
        }}
      >
        W / S — Gas / Bremse
        <br />A / D — Lenken
      </div>
    </div>
  );
}
