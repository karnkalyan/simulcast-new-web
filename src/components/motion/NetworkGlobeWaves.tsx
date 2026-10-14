'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface Hub {
  name: string;
  lat: number;
  lng: number;
  isHQ?: boolean;
}

const HUBS: Hub[] = [
  { name: 'Kathmandu (HQ)', lat: 27.7172, lng: 85.324, isHQ: true },
  { name: 'Singapore', lat: 1.3521, lng: 103.8198 },
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503 },
  { name: 'Dubai', lat: 25.2048, lng: 55.2708 },
  { name: 'Frankfurt', lat: 50.1109, lng: 8.6821 },
  { name: 'London', lat: 51.5074, lng: -0.1278 },
  { name: 'New York', lat: 40.7128, lng: -74.006 },
  { name: 'Sydney', lat: -33.8688, lng: 151.2093 },
  { name: 'Hong Kong', lat: 22.3193, lng: 114.1694 },
  { name: 'Mumbai', lat: 19.076, lng: 72.8777 },
];

const CONNECTIONS: [number, number][] = [
  [0, 1], // Kathmandu -> Singapore
  [0, 2], // Kathmandu -> Tokyo
  [0, 3], // Kathmandu -> Dubai
  [0, 4], // Kathmandu -> Frankfurt
  [0, 5], // Kathmandu -> London
  [0, 8], // Kathmandu -> Hong Kong
  [0, 9], // Kathmandu -> Mumbai
  [1, 2], // Singapore -> Tokyo
  [1, 7], // Singapore -> Sydney
  [3, 4], // Dubai -> Frankfurt
  [4, 5], // Frankfurt -> London
  [5, 6], // London -> New York
  [6, 7], // New York -> Sydney
];

const GLOBE_RADIUS = 38;

function latLngToVector3(lat: number, lng: number, radius = GLOBE_RADIUS): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

export interface NetworkGlobeWavesProps {
  mode?: 'waves-and-globe' | 'waves-only' | 'globe-only';
  theme?: 'light' | 'dark';
  globePosition?: 'right' | 'center' | 'left' | 'left-bottom-cropped';
  variant?: 'default' | 'upper-horizon';
  showHud?: boolean;
}

export default function NetworkGlobeWaves({
  mode = 'waves-and-globe',
  theme = 'light',
  globePosition = 'right',
  variant = 'default',
  showHud = false,
}: NetworkGlobeWavesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeHub, setActiveHub] = useState<string>('Kathmandu (HQ)');
  const [isInteracting, setIsInteracting] = useState<boolean>(false);

  const hasGlobe = mode === 'waves-and-globe' || mode === 'globe-only';
  const hasWaves = mode === 'waves-and-globe' || mode === 'waves-only';
  const isLight = theme === 'light';
  const isUpperHorizon = variant === 'upper-horizon';
  const isLeftBottomCropped = globePosition === 'left-bottom-cropped';

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth;
    let height = container.clientHeight;
    let animationFrameId: number;
    let isVisible = true;

    // --- SCENE & RENDERER ---
    const scene = new THREE.Scene();
    if (isLight) {
      scene.fog = new THREE.FogExp2(0xfaf8fc, 0.003);
    } else {
      scene.fog = new THREE.FogExp2(0x06020c, 0.0035);
    }

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    const isMobile = width < 768;
    if (isUpperHorizon) {
      camera.position.set(0, 32, isMobile ? 180 : 150);
      camera.lookAt(0, 10, 0);
    } else {
      camera.position.set(0, 15, isMobile ? 190 : 155);
      camera.lookAt(0, 0, 0);
    }

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // --- DISPOSABLES TRACKER ---
    const disposables: (THREE.BufferGeometry | THREE.Material)[] = [];

    // --- GLOBE ROOT GROUP ---
    const globeRadius = isUpperHorizon ? 118 : (isLeftBottomCropped ? 88 : 38);
    const globeGroup = new THREE.Group();
    const pulseRings: { mesh: THREE.Mesh; maxScale: number; speed: number }[] = [];
    const dataPackets: {
      mesh: THREE.Mesh;
      curve: THREE.QuadraticBezierCurve3;
      progress: number;
      speed: number;
    }[] = [];
    let atmoMesh: THREE.Mesh | null = null;
    let satMesh: THREE.Mesh | null = null;
    let orbitLine: THREE.Line | null = null;
    const orbitCurve = new THREE.EllipseCurve(0, 0, globeRadius + 12, globeRadius + 12, 0, 2 * Math.PI, false, 0);

    if (hasGlobe) {
      // Offset globe: upper horizon places the globe below so only its upper dotted crest arches into view
      if (isUpperHorizon) {
        globeGroup.position.set(0, isMobile ? -92 : -102, 0);
      } else if (isLeftBottomCropped) {
        // Deeply anchored at bottom-left corner with cropped bottom & left
        globeGroup.position.set(isMobile ? -48 : -88, isMobile ? -32 : -46, 0);
      } else {
        const defaultX = globePosition === 'center' ? 0 : globePosition === 'left' ? -46 : 56;
        globeGroup.position.set(isMobile ? 0 : defaultX, isMobile ? -14 : 6, 0);
      }
      scene.add(globeGroup);

      // 1. External wireframe rings only — NO solid interior sphere shape
      const wireGeo = new THREE.SphereGeometry(globeRadius, isUpperHorizon ? 40 : 28, isUpperHorizon ? 24 : 16);
      const wireMat = new THREE.MeshBasicMaterial({
        color: isLight ? 0x8b5cf6 : 0x7c3aed,
        wireframe: true,
        transparent: true,
        opacity: isLight ? 0.28 : (isUpperHorizon ? 0.35 : 0.20),
      });
      disposables.push(wireGeo, wireMat);
      const wireMesh = new THREE.Mesh(wireGeo, wireMat);
      globeGroup.add(wireMesh);

      // 2. Globe Dots Matrix (Fibonacci Lattice Points)
      const DOTS_COUNT = isUpperHorizon ? 5600 : 2400;
      const dotPositions: number[] = [];
      const dotColors: number[] = [];
      const cPrimary = new THREE.Color(isLight ? 0xd91b6f : 0xf43f5e);
      const cSecondary = new THREE.Color(isLight ? 0x8b5cf6 : 0xa855f7);
      const cDim = new THREE.Color(isLight ? 0xc084fc : (isUpperHorizon ? 0x9333ea : 0x4c1d95));

      for (let i = 0; i < DOTS_COUNT; i++) {
        const phi = Math.acos(-1 + (2 * i) / DOTS_COUNT);
        const theta = Math.sqrt(DOTS_COUNT * Math.PI) * phi;
        const x = globeRadius * Math.cos(theta) * Math.sin(phi);
        const y = globeRadius * Math.sin(theta) * Math.sin(phi);
        const z = globeRadius * Math.cos(phi);
        dotPositions.push(x, y, z);

        const rand = Math.random();
        const dotCol = rand > 0.85 ? cPrimary : rand > 0.45 ? cSecondary : cDim;
        dotColors.push(dotCol.r, dotCol.g, dotCol.b);
      }

      const dotGeo = new THREE.BufferGeometry();
      dotGeo.setAttribute('position', new THREE.Float32BufferAttribute(dotPositions, 3));
      dotGeo.setAttribute('color', new THREE.Float32BufferAttribute(dotColors, 3));
      const dotMat = new THREE.PointsMaterial({
        size: isUpperHorizon ? 2.5 : (isLight ? 1.7 : 1.45),
        vertexColors: true,
        transparent: true,
        opacity: isLight ? 0.95 : 0.92,
        blending: isLight ? THREE.NormalBlending : THREE.AdditiveBlending,
      });
      disposables.push(dotGeo, dotMat);
      const globePoints = new THREE.Points(dotGeo, dotMat);
      globeGroup.add(globePoints);

      // 3. Atmospheric Outer Rim Boundary Line
      const atmoGeo = new THREE.SphereGeometry(globeRadius + (isUpperHorizon ? 4.5 : 3.0), isUpperHorizon ? 48 : 36, isUpperHorizon ? 32 : 36);
      const atmoMat = new THREE.MeshBasicMaterial({
        color: isLight ? 0xd91b6f : 0xe11d72,
        wireframe: true,
        transparent: true,
        opacity: isLight ? 0.12 : (isUpperHorizon ? 0.22 : 0.08),
      });
      disposables.push(atmoGeo, atmoMat);
      atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
      globeGroup.add(atmoMesh);

      // 4. Hub Markers & Nepal HQ Glow
      const hubVectors = HUBS.map((h) => latLngToVector3(h.lat, h.lng, globeRadius));
      const hubMarkersGroup = new THREE.Group();

      HUBS.forEach((hub, idx) => {
        const v = hubVectors[idx];
        const isHQ = hub.isHQ;

        const mGeo = new THREE.SphereGeometry(isHQ ? (isUpperHorizon ? 3.5 : 1.8) : (isUpperHorizon ? 2.4 : 1.1), 16, 16);
        const mMat = new THREE.MeshBasicMaterial({
          color: isHQ ? (isLight ? 0xd91b6f : 0xff2d78) : (isLight ? 0x0284c7 : 0x38bdf8),
        });
        disposables.push(mGeo, mMat);
        const marker = new THREE.Mesh(mGeo, mMat);
        marker.position.copy(v);
        hubMarkersGroup.add(marker);

        const ringGeo = new THREE.RingGeometry(0.8, isHQ ? (isUpperHorizon ? 5.2 : 2.6) : (isUpperHorizon ? 3.6 : 1.8), 24);
        const ringMat = new THREE.MeshBasicMaterial({
          color: isHQ ? 0xd91b6f : (isLight ? 0x0284c7 : 0x38bdf8),
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85,
        });
        disposables.push(ringGeo, ringMat);
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.copy(v.clone().multiplyScalar(1.02));
        ring.lookAt(v.clone().multiplyScalar(2));
        hubMarkersGroup.add(ring);
        pulseRings.push({ mesh: ring, maxScale: isHQ ? 2.8 : 2.0, speed: 0.02 + idx * 0.003 });
      });
      globeGroup.add(hubMarkersGroup);

      // 5. Network Arcs & Glowing Data Packets
      const arcLinesGroup = new THREE.Group();

      CONNECTIONS.forEach(([startIdx, endIdx]) => {
        const vStart = hubVectors[startIdx];
        const vEnd = hubVectors[endIdx];
        const dist = vStart.distanceTo(vEnd);

        const mid = vStart.clone().add(vEnd).multiplyScalar(0.5);
        const altitude = globeRadius + dist * (isUpperHorizon ? 0.32 : 0.38);
        const vMid = mid.normalize().multiplyScalar(altitude);

        const curve = new THREE.QuadraticBezierCurve3(vStart, vMid, vEnd);
        const pts = curve.getPoints(isUpperHorizon ? 60 : 45);
        const arcGeo = new THREE.BufferGeometry().setFromPoints(pts);

        const isKathmanduArc = startIdx === 0 || endIdx === 0;
        const arcMat = new THREE.LineBasicMaterial({
          color: isKathmanduArc ? 0xd91b6f : (isLight ? 0x8b5cf6 : 0xe11d72),
          transparent: true,
          opacity: isKathmanduArc ? (isLight ? 0.85 : 0.8) : (isLight ? 0.55 : 0.5),
        });
        disposables.push(arcGeo, arcMat);
        const arcLine = new THREE.Line(arcGeo, arcMat);
        arcLinesGroup.add(arcLine);

        const packetGeo = new THREE.SphereGeometry(isKathmanduArc ? (isUpperHorizon ? 2.4 : 1.1) : (isUpperHorizon ? 1.8 : 0.8), 10, 10);
        const packetMat = new THREE.MeshBasicMaterial({
          color: isKathmanduArc ? 0xd91b6f : (isLight ? 0x0284c7 : 0x38bdf8),
        });
        disposables.push(packetGeo, packetMat);
        const packet = new THREE.Mesh(packetGeo, packetMat);
        arcLinesGroup.add(packet);

        dataPackets.push({
          mesh: packet,
          curve,
          progress: Math.random(),
          speed: 0.004 + Math.random() * 0.005,
        });
      });
      globeGroup.add(arcLinesGroup);

      // 7. Orbital Satellite Ring
      const orbitPts = orbitCurve.getPoints(90).map((p) => new THREE.Vector3(p.x, 0, p.y));
      const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPts);
      const orbitMat = new THREE.LineBasicMaterial({
        color: isLight ? 0xd91b6f : 0xe11d72,
        transparent: true,
        opacity: isLight ? 0.4 : 0.25,
      });
      disposables.push(orbitGeo, orbitMat);
      orbitLine = new THREE.Line(orbitGeo, orbitMat);
      orbitLine.rotation.x = Math.PI / 4;
      orbitLine.rotation.z = Math.PI / 6;
      globeGroup.add(orbitLine);

      const satGeo = new THREE.SphereGeometry(1.3, 12, 12);
      const satMat = new THREE.MeshBasicMaterial({ color: isLight ? 0xd91b6f : 0xff0080 });
      disposables.push(satGeo, satMat);
      satMesh = new THREE.Mesh(satGeo, satMat);
      globeGroup.add(satMesh);
    }

    // --- 3D ANIMATED WAVE ARTWORK ---
    const waveGroup = new THREE.Group();
    let wavePoints: THREE.Points | null = null;
    const ribbonsData: { geometry: THREE.BufferGeometry; zOffset: number; phase: number }[] = [];
    const W_COLS = 75;
    const W_ROWS = 45;

    if (hasWaves) {
      waveGroup.position.set(0, hasGlobe ? -42 : -20, hasGlobe ? -25 : -10);
      waveGroup.rotation.x = THREE.MathUtils.degToRad(-15);
      scene.add(waveGroup);

      const W_COUNT = W_COLS * W_ROWS;
      const wavePositions = new Float32Array(W_COUNT * 3);
      const waveColors = new Float32Array(W_COUNT * 3);

      let wpIdx = 0;
      const waveColorStart = new THREE.Color(isLight ? 0xd91b6f : 0xe11d72);
      const waveColorMid = new THREE.Color(isLight ? 0x7c3aed : 0x8b5cf6);
      const waveColorEnd = new THREE.Color(isLight ? 0x0284c7 : 0x06b6d4);

      for (let c = 0; c < W_COLS; c++) {
        for (let r = 0; r < W_ROWS; r++) {
          const xPos = (c - W_COLS / 2) * 3.8;
          const zPos = (r - W_ROWS / 2) * 2.8;
          wavePositions[wpIdx * 3] = xPos;
          wavePositions[wpIdx * 3 + 1] = 0;
          wavePositions[wpIdx * 3 + 2] = zPos;

          const ratio = c / W_COLS;
          const curCol =
            ratio < 0.5
              ? waveColorStart.clone().lerp(waveColorMid, ratio * 2)
              : waveColorMid.clone().lerp(waveColorEnd, (ratio - 0.5) * 2);

          waveColors[wpIdx * 3] = curCol.r;
          waveColors[wpIdx * 3 + 1] = curCol.g;
          waveColors[wpIdx * 3 + 2] = curCol.b;
          wpIdx++;
        }
      }

      const waveGeo = new THREE.BufferGeometry();
      waveGeo.setAttribute('position', new THREE.BufferAttribute(wavePositions, 3));
      waveGeo.setAttribute('color', new THREE.BufferAttribute(waveColors, 3));

      const waveMat = new THREE.PointsMaterial({
        size: isLight ? 1.9 : 1.8,
        vertexColors: true,
        transparent: true,
        opacity: isLight ? 0.85 : 0.72,
        blending: isLight ? THREE.NormalBlending : THREE.AdditiveBlending,
      });
      disposables.push(waveGeo, waveMat);
      wavePoints = new THREE.Points(waveGeo, waveMat);
      waveGroup.add(wavePoints);

      const NUM_RIBBONS = 9;
      const RIBBON_SEGS = 110;
      const ribbonColors = [0xd91b6f, 0xc026d3, 0x9333ea, 0x6366f1, 0x2563eb, 0x0284c7, 0x0d9488, 0xe11d72, 0xec4899];

      for (let i = 0; i < NUM_RIBBONS; i++) {
        const rGeo = new THREE.BufferGeometry();
        const rPos = new Float32Array(RIBBON_SEGS * 3);
        const zOffset = (i - NUM_RIBBONS / 2) * 7.5;

        for (let j = 0; j < RIBBON_SEGS; j++) {
          const xPos = (j / (RIBBON_SEGS - 1)) * 260 - 130;
          rPos[j * 3] = xPos;
          rPos[j * 3 + 1] = 0;
          rPos[j * 3 + 2] = zOffset;
        }
        rGeo.setAttribute('position', new THREE.BufferAttribute(rPos, 3));

        const rMat = new THREE.LineBasicMaterial({
          color: ribbonColors[i % ribbonColors.length],
          transparent: true,
          opacity: isLight ? 0.65 : 0.55,
        });
        disposables.push(rGeo, rMat);
        const rLine = new THREE.Line(rGeo, rMat);
        waveGroup.add(rLine);
        ribbonsData.push({ geometry: rGeo, zOffset, phase: i * 0.45 });
      }
    }

    // --- INTERACTION ---
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let targetRotationY = 0.6;
    let targetRotationX = 0.2;
    let targetCameraX = 0;
    let targetCameraY = 15;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      setIsInteracting(true);
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      const normX = (e.clientX / width - 0.5) * 2;
      const normY = (e.clientY / height - 0.5) * 2;
      targetCameraX = normX * 8;
      targetCameraY = 15 - normY * 5;

      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      targetRotationY += deltaX * 0.006;
      targetRotationX += deltaY * 0.006;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
      setIsInteracting(false);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        setIsInteracting(true);
        prevMouseX = e.touches[0].clientX;
        prevMouseY = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - prevMouseX;
      const deltaY = e.touches[0].clientY - prevMouseY;
      targetRotationY += deltaX * 0.008;
      targetRotationX += deltaY * 0.008;
      prevMouseX = e.touches[0].clientX;
      prevMouseY = e.touches[0].clientY;
    };

    const onTouchEnd = () => {
      isDragging = false;
      setIsInteracting(false);
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domEl.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
        });
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    // --- ANIMATION LOOP ---
    const clock = new THREE.Clock();
    let satAngle = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!isVisible) return;

      const elapsed = clock.getElapsedTime();

      if (hasGlobe) {
        if (!isDragging) {
          targetRotationY += 0.0022;
        }
        globeGroup.rotation.y += (targetRotationY - globeGroup.rotation.y) * 0.08;
        globeGroup.rotation.x += (targetRotationX - globeGroup.rotation.x) * 0.08;

        if (atmoMesh) {
          const atmoScale = 1 + Math.sin(elapsed * 2.2) * 0.015;
          atmoMesh.scale.set(atmoScale, atmoScale, atmoScale);
        }

        pulseRings.forEach((p) => {
          const curScale = (p.mesh.scale.x + p.speed) % p.maxScale;
          const norm = curScale / p.maxScale;
          p.mesh.scale.set(curScale, curScale, curScale);
          (p.mesh.material as THREE.MeshBasicMaterial).opacity = 0.85 * (1 - norm);
        });

        dataPackets.forEach((p) => {
          p.progress = (p.progress + p.speed) % 1;
          const pt = p.curve.getPoint(p.progress);
          p.mesh.position.copy(pt);
        });

        if (orbitLine && satMesh) {
          satAngle = (satAngle + 0.015) % (Math.PI * 2);
          const orbitPt = orbitCurve.getPoint(satAngle / (Math.PI * 2));
          const satVec = new THREE.Vector3(orbitPt.x, 0, orbitPt.y);
          satVec.applyEuler(orbitLine.rotation);
          satMesh.position.copy(satVec);
        }
      }

      camera.position.x += (targetCameraX - camera.position.x) * 0.05;
      camera.position.y += (targetCameraY - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);

      if (hasWaves && wavePoints) {
        const wPos = wavePoints.geometry.attributes.position.array as Float32Array;
        let wIdx = 0;
        for (let c = 0; c < W_COLS; c++) {
          for (let r = 0; r < W_ROWS; r++) {
            const px = wPos[wIdx * 3];
            const pz = wPos[wIdx * 3 + 2];
            wPos[wIdx * 3 + 1] =
              Math.sin(px * 0.045 + elapsed * 1.8) * Math.cos(pz * 0.045 + elapsed * 1.2) * 4.8 +
              Math.sin(px * 0.02 - elapsed * 0.9) * 2.4;
            wIdx++;
          }
        }
        wavePoints.geometry.attributes.position.needsUpdate = true;

        ribbonsData.forEach((ribbon) => {
          const arr = ribbon.geometry.attributes.position.array as Float32Array;
          const segs = arr.length / 3;
          for (let j = 0; j < segs; j++) {
            const rx = arr[j * 3];
            arr[j * 3 + 1] =
              Math.sin(rx * 0.035 + elapsed * 1.6 + ribbon.phase) * 5.2 +
              Math.sin(elapsed * 0.8 + ribbon.phase * 0.5) * 2.2;
          }
          ribbon.geometry.attributes.position.needsUpdate = true;
        });

        waveGroup.rotation.z = Math.sin(elapsed * 0.35) * 0.03;
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth;
      height = container.clientHeight;
      const isMob = width < 768;
      camera.aspect = width / height;
      camera.position.z = isUpperHorizon ? (isMob ? 180 : 150) : (isMob ? 190 : 155);
      if (isUpperHorizon) {
        globeGroup.position.set(0, isMob ? -92 : -102, 0);
      } else if (isLeftBottomCropped) {
        globeGroup.position.set(isMob ? -48 : -88, isMob ? -32 : -46, 0);
      } else {
        const defaultX = globePosition === 'center' ? 0 : globePosition === 'left' ? -46 : 56;
        globeGroup.position.set(isMob ? 0 : defaultX, isMob ? -14 : 6, 0);
      }
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
      domEl.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domEl.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);

      if (container && domEl.parentElement === container) {
        container.removeChild(domEl);
      }
      renderer.dispose();
      disposables.forEach((d) => d.dispose());
    };
  }, [hasGlobe, hasWaves, isLight, globePosition, isUpperHorizon]);

  return (
    <div className={`sc-three-canvas-wrap ${isLight ? 'sc-three-light' : 'sc-three-dark'}`} ref={containerRef} aria-hidden="true" />
  );
}
