import { useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { t } from '@/lib/i18n';
import type { PackedTruck } from '@/lib/types';

const COLORS = [
  0xFF6B6B, 0x4ECDC4, 0x45B7D1, 0xFFD93D, 0x96CEB4,
  0xC7F2A4, 0xFF8B94, 0xA8E6CF, 0xF8B400, 0x85C1E9,
  0xF7D794, 0x778CA3, 0xE77F67, 0x786FA6, 0xF8A5C2,
  0x63CDDA, 0xCF6A87, 0x574B90, 0x3DC1D3, 0xE15F41,
];

interface Props {
  truck: PackedTruck;
  selectedPalletId: string | null;
  onSelectPallet: (palletId: string | null) => void;
  containerId: string;
}

export interface VisualizerHandle {
  getScreenshot: () => string | null;
  highlightPallet: (palletId: string | null) => void;
}

const Visualizer = forwardRef<VisualizerHandle, Props>(function Visualizer(
  { truck, selectedPalletId, onSelectPallet, containerId },
  ref
) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const palletMeshesRef = useRef<THREE.Mesh[]>([]);
  const hoveredMeshRef = useRef<THREE.Mesh | null>(null);
  const selectedMeshRef = useRef<THREE.Mesh | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const resizeObsRef = useRef<ResizeObserver | null>(null);
  const onSelectPalletRef = useRef(onSelectPallet);
  onSelectPalletRef.current = onSelectPallet;

  const applySelection = useCallback(
    (mesh: THREE.Mesh | null) => {
      selectedMeshRef.current = mesh;
      const meshes = palletMeshesRef.current;

      if (mesh) {
        meshes.forEach((m) => {
          if (m === hoveredMeshRef.current && m !== mesh) return;
          if (m === mesh) {
            (m.material as THREE.MeshLambertMaterial).emissive = new THREE.Color(0x554400);
            (m.material as THREE.MeshLambertMaterial).opacity = 1.0;
            const edges = m.userData.edges as THREE.LineSegments;
            if (edges) (edges.material as THREE.LineBasicMaterial).opacity = 0.5;
          } else {
            (m.material as THREE.MeshLambertMaterial).emissive = new THREE.Color(0x000000);
            (m.material as THREE.MeshLambertMaterial).opacity = 0.08;
            const edges = m.userData.edges as THREE.LineSegments;
            if (edges) (edges.material as THREE.LineBasicMaterial).opacity = 0.04;
          }
        });
      } else {
        meshes.forEach((m) => {
          if (m === hoveredMeshRef.current) return;
          (m.material as THREE.MeshLambertMaterial).emissive = new THREE.Color(0x000000);
          (m.material as THREE.MeshLambertMaterial).opacity = 0.88;
          const edges = m.userData.edges as THREE.LineSegments;
          if (edges) (edges.material as THREE.LineBasicMaterial).opacity = 0.28;
        });
      }
    },
    []
  );

  const highlightPallet = useCallback(
    (palletId: string | null) => {
      if (palletId === null) {
        applySelection(null);
        return;
      }
      const mesh = palletMeshesRef.current.find(
        (m) => m.userData.pallet.id === palletId
      );
      applySelection(mesh || null);
    },
    [applySelection]
  );

  const getScreenshot = useCallback(() => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!renderer || !scene || !camera) return null;
    renderer.render(scene, camera);
    return renderer.domElement.toDataURL('image/png');
  }, []);

  useImperativeHandle(ref, () => ({ getScreenshot, highlightPallet }), [
    getScreenshot,
    highlightPallet,
  ]);

  // Apply external pallet selection
  useEffect(() => {
    highlightPallet(selectedPalletId);
  }, [selectedPalletId, highlightPallet]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const W = container.clientWidth || 700;
    const H = container.clientHeight || 420;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d1117);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(42, W / H, 1, 50000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const sun = new THREE.DirectionalLight(0xffffff, 0.9);
    sun.position.set(600, 1200, 900);
    sun.castShadow = true;
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0x8899ff, 0.35);
    fill.position.set(-600, 300, -600);
    scene.add(fill);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.screenSpacePanning = false;
    controls.minDistance = 50;
    controls.maxDistance = 8000;
    controlsRef.current = controls;

    const { type: truckType, placements } = truck;
    const TW = truckType.width;
    const TH = truckType.height;
    const TD = truckType.depth;

    const truckEdges = new THREE.EdgesGeometry(
      new THREE.BoxGeometry(TW, TH, TD)
    );
    const truckLine = new THREE.LineSegments(
      truckEdges,
      new THREE.LineBasicMaterial({
        color: 0x2255cc,
        transparent: true,
        opacity: 0.7,
      })
    );
    truckLine.position.set(TW / 2, TH / 2, TD / 2);
    scene.add(truckLine);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(TW, TD),
      new THREE.MeshLambertMaterial({
        color: 0x1a2040,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(TW / 2, 0, TD / 2);
    floor.receiveShadow = true;
    scene.add(floor);

    const step = 100;
    const gridMat = new THREE.LineBasicMaterial({
      color: 0x223366,
      transparent: true,
      opacity: 0.45,
    });
    for (let x = 0; x <= TW; x += step) {
      const g = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, 1, 0),
        new THREE.Vector3(x, 1, TD),
      ]);
      scene.add(new THREE.Line(g, gridMat));
    }
    for (let z = 0; z <= TD; z += step) {
      const g = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 1, z),
        new THREE.Vector3(TW, 1, z),
      ]);
      scene.add(new THREE.Line(g, gridMat));
    }

    const walls = new THREE.Mesh(
      new THREE.BoxGeometry(TW, TH, TD),
      new THREE.MeshLambertMaterial({
        color: 0x111830,
        transparent: true,
        opacity: 0.12,
        side: THREE.BackSide,
      })
    );
    walls.position.set(TW / 2, TH / 2, TD / 2);
    scene.add(walls);

    const meshes: THREE.Mesh[] = [];
    placements.forEach((pl, i) => {
      const { x, y, z, w, h, d, pallet } = pl;
      const gap = 2;
      const color = COLORS[i % COLORS.length];
      const geo = new THREE.BoxGeometry(w - gap, h - gap, d - gap);
      const mat = new THREE.MeshLambertMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0.88,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x + w / 2, y + h / 2, z + d / 2);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { pallet, placement: pl, index: i, origColor: color };

      scene.add(mesh);
      meshes.push(mesh);

      const eGeo = new THREE.EdgesGeometry(geo);
      const eMat = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.28,
      });
      const edges = new THREE.LineSegments(eGeo, eMat);
      edges.position.copy(mesh.position);
      scene.add(edges);
      mesh.userData.edges = edges;
    });
    palletMeshesRef.current = meshes;

    const cx = TW / 2;
    const cy = TH / 2;
    const cz = TD / 2;
    const dist = Math.max(TW, TH, TD) * 1.9;
    camera.position.set(
      cx + dist * 0.65,
      cy + dist * 0.55,
      cz + dist * 0.8
    );
    camera.lookAt(cx, cy, cz);
    controls.target.set(cx, cy, cz);
    controls.update();

    const raycaster = raycasterRef.current;
    const mouse = mouseRef.current;

    function clearHover() {
      const hm = hoveredMeshRef.current;
      if (hm) {
        const isSelected = hm === selectedMeshRef.current;
        const isDimmed = selectedMeshRef.current !== null && !isSelected;
        (hm.material as THREE.MeshLambertMaterial).opacity = isSelected
          ? 1.0
          : isDimmed
            ? 0.08
            : 0.88;
        (hm.material as THREE.MeshLambertMaterial).emissive = new THREE.Color(
          isSelected ? 0x554400 : 0x000000
        );
        const edges = hm.userData.edges as THREE.LineSegments;
        if (edges) {
          (edges.material as THREE.LineBasicMaterial).opacity = isDimmed
            ? 0.04
            : isSelected
              ? 0.5
              : 0.28;
        }
        hoveredMeshRef.current = null;
      }
    }

    function onMouseMove(event: MouseEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(palletMeshesRef.current);
      const tooltip = document.getElementById('vis-tooltip');

      clearHover();

      if (hits.length) {
        const mesh = hits[0].object as THREE.Mesh;
        (mesh.material as THREE.MeshLambertMaterial).opacity = 1.0;
        (mesh.material as THREE.MeshLambertMaterial).emissive = new THREE.Color(
          mesh === selectedMeshRef.current ? 0x776600 : 0x333333
        );
        hoveredMeshRef.current = mesh;

        if (tooltip) {
          const { pallet, placement } = mesh.userData;
          const rotLabel =
            placement.rotation === 90 ? t('tooltip.rotated') : t('tooltip.normal');
          const posLabel = t('tooltip.pos');
          tooltip.innerHTML = `
            <b>${pallet.id}</b><br>
            ${pallet.length}×${pallet.width}×${pallet.height} cm<br>
            ${pallet.weight} kg &nbsp;|&nbsp; ${rotLabel}<br>
            ${posLabel}: X${placement.x} Y${placement.y} Z${placement.z}`;
          tooltip.style.display = 'block';
          tooltip.style.left = event.clientX + 14 + 'px';
          tooltip.style.top = event.clientY - 10 + 'px';
        }
      } else if (tooltip) {
        tooltip.style.display = 'none';
      }
    }

    function onMouseLeave() {
      clearHover();
      const tooltip = document.getElementById('vis-tooltip');
      if (tooltip) tooltip.style.display = 'none';
    }

    function onClick(event: MouseEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(palletMeshesRef.current);
      if (!hits.length) return;
      const mesh = hits[0].object as THREE.Mesh;
      const { pallet } = mesh.userData;
      const isAlreadySelected = mesh === selectedMeshRef.current;
      applySelection(isAlreadySelected ? null : mesh);
      onSelectPalletRef.current(isAlreadySelected ? null : pallet.id);
    }

    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseleave', onMouseLeave);
    renderer.domElement.addEventListener('click', onClick);

    function onResize() {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }

    resizeObsRef.current = new ResizeObserver(onResize);
    resizeObsRef.current.observe(container);

    function animate() {
      animFrameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(animFrameRef.current!);
      resizeObsRef.current?.disconnect();
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('mouseleave', onMouseLeave);
      renderer.domElement.removeEventListener('click', onClick);

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments || obj instanceof THREE.Line) {
          obj.geometry?.dispose();
          const mat = obj.material;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat?.dispose();
        }
      });
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [truck, containerId, applySelection]);

  return (
    <div
      ref={mountRef}
      id={containerId}
      className="flex-1 min-h-[380px] overflow-hidden bg-[#0d1117]"
    />
  );
});

export default Visualizer;
