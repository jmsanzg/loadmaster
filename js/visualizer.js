// visualizer.js - Three.js 3D truck/pallet visualization
(function (global) {

    const COLORS = [
        0xFF6B6B, 0x4ECDC4, 0x45B7D1, 0xFFD93D, 0x96CEB4,
        0xC7F2A4, 0xFF8B94, 0xA8E6CF, 0xF8B400, 0x85C1E9,
        0xF7D794, 0x778CA3, 0xE77F67, 0x786FA6, 0xF8A5C2,
        0x63CDDA, 0xCF6A87, 0x574B90, 0x3DC1D3, 0xE15F41
    ];

    class TruckVisualizer {
        constructor(containerId, truckResult) {
            this.containerId  = containerId;
            this.result       = truckResult;
            this.renderer     = null;
            this.scene        = null;
            this.camera       = null;
            this.controls     = null;
            this.animFrame    = null;
            this.palletMeshes  = [];
            this.raycaster     = new THREE.Raycaster();
            this.mouse         = new THREE.Vector2();
            this.hoveredMesh   = null;
            this.selectedMesh  = null;
            this._resizeObs    = null;
        }

        init() {
            const container = document.getElementById(this.containerId);
            if (!container) return;

            const W = container.clientWidth  || 700;
            const H = container.clientHeight || 420;

            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x0d1117);

            this.camera = new THREE.PerspectiveCamera(42, W / H, 1, 50000);

            this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
            this.renderer.setSize(W, H);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            container.appendChild(this.renderer.domElement);

            this.scene.add(new THREE.AmbientLight(0xffffff, 0.55));
            const sun = new THREE.DirectionalLight(0xffffff, 0.9);
            sun.position.set(600, 1200, 900);
            sun.castShadow = true;
            this.scene.add(sun);
            const fill = new THREE.DirectionalLight(0x8899ff, 0.35);
            fill.position.set(-600, 300, -600);
            this.scene.add(fill);

            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping    = true;
            this.controls.dampingFactor    = 0.06;
            this.controls.screenSpacePanning = false;
            this.controls.minDistance      = 50;
            this.controls.maxDistance      = 8000;

            this._buildScene();
            this._positionCamera();

            this.renderer.domElement.addEventListener('mousemove', e => this._onMove(e));
            this.renderer.domElement.addEventListener('mouseleave', () => this._clearHover());
            this.renderer.domElement.addEventListener('click', e => this._onClick(e));

            this._resizeObs = new ResizeObserver(() => this._resize());
            this._resizeObs.observe(container);

            this._animate();
        }

        _buildScene() {
            const { type: truck, placements } = this.result;
            const W = truck.width, H = truck.height, D = truck.depth;

            // Truck wireframe
            const truckEdges = new THREE.EdgesGeometry(new THREE.BoxGeometry(W, H, D));
            const truckLine  = new THREE.LineSegments(
                truckEdges,
                new THREE.LineBasicMaterial({ color: 0x2255cc, transparent: true, opacity: 0.7 })
            );
            truckLine.position.set(W / 2, H / 2, D / 2);
            this.scene.add(truckLine);

            // Floor
            const floor = new THREE.Mesh(
                new THREE.PlaneGeometry(W, D),
                new THREE.MeshLambertMaterial({ color: 0x1a2040, transparent: true, opacity: 0.7, side: THREE.DoubleSide })
            );
            floor.rotation.x = -Math.PI / 2;
            floor.position.set(W / 2, 0, D / 2);
            floor.receiveShadow = true;
            this.scene.add(floor);

            const step = 100; // 100 cm = 1 m
            const gridMat = new THREE.LineBasicMaterial({ color: 0x223366, transparent: true, opacity: 0.45 });
            for (let x = 0; x <= W; x += step) {
                const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, 1, 0), new THREE.Vector3(x, 1, D)]);
                this.scene.add(new THREE.Line(g, gridMat));
            }
            for (let z = 0; z <= D; z += step) {
                const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 1, z), new THREE.Vector3(W, 1, z)]);
                this.scene.add(new THREE.Line(g, gridMat));
            }

            // Interior wall hint (back-side so it's visible from inside)
            const walls = new THREE.Mesh(
                new THREE.BoxGeometry(W, H, D),
                new THREE.MeshLambertMaterial({ color: 0x111830, transparent: true, opacity: 0.12, side: THREE.BackSide })
            );
            walls.position.set(W / 2, H / 2, D / 2);
            this.scene.add(walls);

            this.palletMeshes = [];
            placements.forEach((pl, i) => {
                const { x, y, z, w, h, d, pallet, rotation } = pl;
                const gap    = 2; // small visual gap
                const color  = COLORS[i % COLORS.length];
                const geo    = new THREE.BoxGeometry(w - gap, h - gap, d - gap);
                const mat    = new THREE.MeshLambertMaterial({ color: new THREE.Color(color), transparent: true, opacity: 0.88 });
                const mesh   = new THREE.Mesh(geo, mat);
                mesh.position.set(x + w / 2, y + h / 2, z + d / 2);
                mesh.castShadow    = true;
                mesh.receiveShadow = true;
                mesh.userData      = { pallet, placement: pl, index: i, origColor: color };
                this.scene.add(mesh);
                this.palletMeshes.push(mesh);

                const eGeo  = new THREE.EdgesGeometry(geo);
                const eMat  = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.28 });
                const edges = new THREE.LineSegments(eGeo, eMat);
                edges.position.copy(mesh.position);
                this.scene.add(edges);
                mesh.userData.edges = edges;
            });
        }

        _positionCamera() {
            const { type: truck } = this.result;
            const W = truck.width, H = truck.height, D = truck.depth;
            const cx = W / 2, cy = H / 2, cz = D / 2;
            const dist = Math.max(W, H, D) * 1.9;
            this.camera.position.set(cx + dist * 0.65, cy + dist * 0.55, cz + dist * 0.8);
            this.camera.lookAt(cx, cy, cz);
            this.controls.target.set(cx, cy, cz);
            this.controls.update();
        }

        getScreenshot() {
            this.renderer.render(this.scene, this.camera);
            return this.renderer.domElement.toDataURL('image/png');
        }

        _onMove(event) {
            const rect = this.renderer.domElement.getBoundingClientRect();
            this.mouse.x =  ((event.clientX - rect.left) / rect.width)  * 2 - 1;
            this.mouse.y = -((event.clientY - rect.top)  / rect.height) * 2 + 1;

            this.raycaster.setFromCamera(this.mouse, this.camera);
            const hits    = this.raycaster.intersectObjects(this.palletMeshes);
            const tooltip = document.getElementById('vis-tooltip');

            this._clearHover();

            if (hits.length) {
                const mesh = hits[0].object;
                mesh.material.opacity = 1.0;
                mesh.material.emissive = new THREE.Color(mesh === this.selectedMesh ? 0x776600 : 0x333333);
                this.hoveredMesh = mesh;

                if (tooltip) {
                    const { pallet, placement } = mesh.userData;
                    const _t       = window.i18n ? k => window.i18n.t(k) : k => k;
                    const rotLabel = placement.rotation === 90 ? _t('tooltip.rotated') : _t('tooltip.normal');
                    const posLabel = _t('tooltip.pos');
                    tooltip.innerHTML =
                        `<b>${pallet.id}</b><br>` +
                        `${pallet.length}×${pallet.width}×${pallet.height} cm<br>` +
                        `${pallet.weight} kg &nbsp;|&nbsp; ${rotLabel}<br>` +
                        `${posLabel}: X${placement.x} Y${placement.y} Z${placement.z}`;
                    tooltip.style.display = 'block';
                    tooltip.style.left    = (event.clientX + 14) + 'px';
                    tooltip.style.top     = (event.clientY - 10) + 'px';
                }
            } else if (tooltip) {
                tooltip.style.display = 'none';
            }
        }

        _clearHover() {
            if (this.hoveredMesh) {
                const isSelected = this.hoveredMesh === this.selectedMesh;
                const isDimmed   = this.selectedMesh !== null && !isSelected;
                this.hoveredMesh.material.opacity  = isSelected ? 1.0 : (isDimmed ? 0.08 : 0.88);
                this.hoveredMesh.material.emissive = new THREE.Color(isSelected ? 0x554400 : 0x000000);
                if (this.hoveredMesh.userData.edges) {
                    this.hoveredMesh.userData.edges.material.opacity = isDimmed ? 0.04 : (isSelected ? 0.5 : 0.28);
                }
                this.hoveredMesh = null;
            }
        }

        _onClick(event) {
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const hits = this.raycaster.intersectObjects(this.palletMeshes);
            if (!hits.length) return;
            const mesh = hits[0].object;
            const { pallet } = mesh.userData;
            const isAlreadySelected = mesh === this.selectedMesh;
            this._applySelection(isAlreadySelected ? null : mesh);
            // Sync table row selection
            const card = document.getElementById(this.containerId)?.closest('.result-truck-card');
            if (card) {
                card.querySelectorAll('tr[data-pallet-id]').forEach(r => r.classList.remove('row-selected'));
                if (!isAlreadySelected) {
                    const target = card.querySelector(`tr[data-pallet-id="${pallet.id}"]`);
                    if (target) {
                        target.classList.add('row-selected');
                        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
            }
        }

        highlightPallet(palletId) {
            if (palletId === null) { this._applySelection(null); return; }
            const mesh = this.palletMeshes.find(m => m.userData.pallet.id === palletId);
            this._applySelection(mesh || null);
        }

        _applySelection(mesh) {
            this.selectedMesh = mesh;

            if (mesh) {
                this.palletMeshes.forEach(m => {
                    if (m === this.hoveredMesh) return;
                    if (m === mesh) {
                        m.material.emissive = new THREE.Color(0x554400);
                        m.material.opacity  = 1.0;
                        if (m.userData.edges) m.userData.edges.material.opacity = 0.5;
                    } else {
                        m.material.emissive = new THREE.Color(0x000000);
                        m.material.opacity  = 0.08;
                        if (m.userData.edges) m.userData.edges.material.opacity = 0.04;
                    }
                });
            } else {
                this.palletMeshes.forEach(m => {
                    if (m === this.hoveredMesh) return;
                    m.material.emissive = new THREE.Color(0x000000);
                    m.material.opacity  = 0.88;
                    if (m.userData.edges) m.userData.edges.material.opacity = 0.28;
                });
            }
        }

        _resize() {
            const container = document.getElementById(this.containerId);
            if (!container || !this.renderer) return;
            const w = container.clientWidth;
            const h = container.clientHeight;
            if (!w || !h) return;
            this.camera.aspect = w / h;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(w, h);
        }

        _animate() {
            this.animFrame = requestAnimationFrame(() => this._animate());
            this.controls.update();
            this.renderer.render(this.scene, this.camera);
        }

        dispose() {
            if (this.animFrame)   cancelAnimationFrame(this.animFrame);
            if (this._resizeObs)  this._resizeObs.disconnect();
            const tooltip = document.getElementById('vis-tooltip');
            if (tooltip) tooltip.style.display = 'none';
            if (this.renderer) {
                this.scene.traverse(obj => {
                    if (obj.geometry) obj.geometry.dispose();
                    if (obj.material) {
                        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
                        else obj.material.dispose();
                    }
                });
                this.renderer.dispose();
                const c = document.getElementById(this.containerId);
                if (c && this.renderer.domElement.parentNode === c)
                    c.removeChild(this.renderer.domElement);
            }
        }
    }

    global.TruckVisualizer = TruckVisualizer;

})(window);
