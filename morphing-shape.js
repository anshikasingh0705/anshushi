/**
 * Black Morphing Blob with Breaking/Rejoining Animation
 * No watermarks - completely custom Three.js implementation
 */

class MorphingShape3D {
    constructor(container) {
        this.container = container;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.mainBlob = null;
        this.smallBlobs = [];
        this.animationId = null;
        this.mouse = { x: 0, y: 0 };
        this.time = 0;
        this.breakPhase = 0; // 0: whole, 1: breaking, 2: separated, 3: rejoining
        this.phaseTimer = 0;
        
        this.init();
    }

    init() {
        this.setupScene();
        this.createMainBlob();
        this.createSmallBlobs();
        this.setupLighting();
        this.setupEventListeners();
        this.animate();
    }

    setupScene() {
        this.scene = new THREE.Scene();
        
        this.camera = new THREE.PerspectiveCamera(
            75,
            this.container.clientWidth / this.container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(-1, 0.5, 5); // Shifted left to allow overflow
        
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Enable overflow rendering
        this.renderer.localClippingEnabled = false;
        
        this.container.appendChild(this.renderer.domElement);
    }

    createMainBlob() {
        const geometry = new THREE.SphereGeometry(2.5, 80, 80);
        const positions = geometry.attributes.position.array;
        const originalPositions = [...positions];
        
        // Create more organic initial shape
        for (let i = 0; i < positions.length; i += 3) {
            const x = originalPositions[i];
            const y = originalPositions[i + 1];
            const z = originalPositions[i + 2];
            
            const noise1 = Math.sin(x * 0.5 + y * 0.3) * 0.4;
            const noise2 = Math.cos(y * 0.4 + z * 0.6) * 0.3;
            const noise3 = Math.sin(z * 0.3 + x * 0.7) * 0.25;
            
            const totalNoise = (noise1 + noise2 + noise3) * 0.5;
            
            positions[i] = x * (1 + totalNoise);
            positions[i + 1] = y * (1 + totalNoise * 0.8);
            positions[i + 2] = z * (1 + totalNoise * 1.1);
        }
        
        geometry.setAttribute('originalPosition', 
            new THREE.Float32BufferAttribute(originalPositions, 3));
        geometry.computeVertexNormals();
        
        // Black material with subtle variations
        const material = new THREE.MeshPhysicalMaterial({
            color: 0x1a1a1a,
            metalness: 0.05,
            roughness: 0.1,
            transmission: 0,
            transparent: false,
            clearcoat: 0.8,
            clearcoatRoughness: 0.1,
            envMapIntensity: 0.5,
        });

        this.mainBlob = new THREE.Mesh(geometry, material);
        this.mainBlob.position.x = 0.5; // Slightly right to allow overflow
        this.mainBlob.castShadow = true;
        this.scene.add(this.mainBlob);
    }

    createSmallBlobs() {
        const count = 5;
        const material = new THREE.MeshPhysicalMaterial({
            color: 0x2a2a2a,
            metalness: 0.1,
            roughness: 0.15,
            clearcoat: 0.6,
        });

        for (let i = 0; i < count; i++) {
            const size = 0.3 + Math.random() * 0.4;
            const geometry = new THREE.SphereGeometry(size, 32, 32);
            const blob = new THREE.Mesh(geometry, material.clone());
            
            // Initial positions around main blob
            const angle = (i / count) * Math.PI * 2;
            blob.position.set(
                Math.cos(angle) * 3,
                Math.sin(angle * 1.3) * 1.5,
                Math.sin(angle) * 0.8
            );
            
            blob.visible = false;
            blob.castShadow = true;
            blob.userData = { 
                originalSize: size,
                targetPosition: blob.position.clone(),
                phase: 0
            };
            
            this.smallBlobs.push(blob);
            this.scene.add(blob);
        }
    }

    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);

        // Main directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
        directionalLight.position.set(8, 6, 4);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.1;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -10;
        directionalLight.shadow.camera.right = 10;
        directionalLight.shadow.camera.top = 10;
        directionalLight.shadow.camera.bottom = -10;
        this.scene.add(directionalLight);

        // Rim light
        const rimLight = new THREE.DirectionalLight(0x4a4a4a, 0.8);
        rimLight.position.set(-5, 3, -3);
        this.scene.add(rimLight);

        // Subtle accent light
        const accentLight = new THREE.PointLight(0x666666, 0.6, 12);
        accentLight.position.set(3, -2, 2);
        this.scene.add(accentLight);
    }

    setupEventListeners() {
        this.container.addEventListener('mousemove', (event) => {
            const rect = this.container.getBoundingClientRect();
            this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        });

        window.addEventListener('resize', () => this.onWindowResize());
    }

    animate() {
        this.time += 0.008; // Slower, more elegant animation
        this.phaseTimer += 0.01;
        
        // Phase management - break apart every 8 seconds
        if (this.phaseTimer > 8) {
            this.phaseTimer = 0;
            this.breakPhase = (this.breakPhase + 1) % 4;
        }

        this.animateMainBlob();
        this.animateSmallBlobs();
        this.handlePhaseTransitions();

        // Camera subtle movement with mouse interaction
        this.camera.position.x = -1 + Math.sin(this.time * 0.3) * 0.2 + this.mouse.x * 0.1;
        this.camera.position.y = 0.5 + Math.cos(this.time * 0.2) * 0.1 + this.mouse.y * 0.05;
        this.camera.lookAt(0, 0, 0);
        
        this.renderer.render(this.scene, this.camera);
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    animateMainBlob() {
        const geometry = this.mainBlob.geometry;
        const positions = geometry.attributes.position.array;
        const originalPositions = geometry.attributes.originalPosition.array;
        
        for (let i = 0; i < positions.length; i += 3) {
            const x = originalPositions[i];
            const y = originalPositions[i + 1];
            const z = originalPositions[i + 2];
            
            // Multiple wave layers for complex morphing
            const wave1 = Math.sin(this.time * 1.2 + x * 0.8 + y * 0.4) * 0.15;
            const wave2 = Math.cos(this.time * 0.8 + z * 0.6 + x * 0.3) * 0.12;
            const wave3 = Math.sin(this.time * 1.5 + y * 0.5 + z * 0.7) * 0.1;
            const wave4 = Math.cos(this.time * 0.6 + x * 0.4 + z * 0.2) * 0.08;
            
            const totalMorph = wave1 + wave2 + wave3 + wave4;
            
            // Scale factor based on break phase
            let scaleFactor = 1;
            if (this.breakPhase === 1) { // Breaking
                scaleFactor = 1 - (this.phaseTimer / 2) * 0.3;
            } else if (this.breakPhase === 2) { // Separated
                scaleFactor = 0.7;
            } else if (this.breakPhase === 3) { // Rejoining
                scaleFactor = 0.7 + (this.phaseTimer / 2) * 0.3;
            }
            
            positions[i] = x * (scaleFactor + totalMorph);
            positions[i + 1] = y * (scaleFactor + totalMorph * 0.9);
            positions[i + 2] = z * (scaleFactor + totalMorph * 1.1);
        }
        
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();
        
        // Rotation with mouse influence
        this.mainBlob.rotation.y = this.time * 0.15 + this.mouse.x * 0.05;
        this.mainBlob.rotation.x = Math.sin(this.time * 0.4) * 0.08 + this.mouse.y * 0.03;
        this.mainBlob.rotation.z = Math.cos(this.time * 0.3) * 0.04;
    }

    animateSmallBlobs() {
        this.smallBlobs.forEach((blob, index) => {
            const angle = (index / this.smallBlobs.length) * Math.PI * 2;
            const radius = 2.5 + Math.sin(this.time + index) * 0.5;
            
            // Animate each small blob
            const bobbing = Math.sin(this.time * 1.5 + index * 0.5) * 0.3;
            const floating = Math.cos(this.time * 0.8 + index * 0.8) * 0.2;
            
            blob.position.x = Math.cos(angle + this.time * 0.2) * radius + 0.5;
            blob.position.y = Math.sin(angle * 1.3 + this.time * 0.3) * 1.2 + bobbing;
            blob.position.z = Math.sin(angle + this.time * 0.15) * 0.6 + floating;
            
            // Subtle rotation
            blob.rotation.x += 0.005;
            blob.rotation.y += 0.007;
            
            // Scale variation
            const scaleVar = 1 + Math.sin(this.time * 2 + index) * 0.1;
            blob.scale.setScalar(scaleVar);
        });
    }

    handlePhaseTransitions() {
        const progress = this.phaseTimer / 2; // 2 seconds per transition
        
        switch (this.breakPhase) {
            case 0: // Whole state
                this.mainBlob.visible = true;
                this.smallBlobs.forEach(blob => blob.visible = false);
                break;
                
            case 1: // Breaking apart
                this.mainBlob.visible = true;
                this.smallBlobs.forEach((blob, index) => {
                    blob.visible = progress > (index * 0.1);
                    if (blob.visible) {
                        const alpha = Math.min(1, (progress - index * 0.1) * 5);
                        blob.material.opacity = alpha;
                        blob.material.transparent = alpha < 1;
                    }
                });
                break;
                
            case 2: // Separated state  
                this.mainBlob.visible = false;
                this.smallBlobs.forEach(blob => {
                    blob.visible = true;
                    blob.material.opacity = 1;
                    blob.material.transparent = false;
                });
                break;
                
            case 3: // Rejoining
                this.mainBlob.visible = progress > 0.5;
                if (this.mainBlob.visible) {
                    const alpha = (progress - 0.5) * 2;
                    this.mainBlob.material.opacity = alpha;
                    this.mainBlob.material.transparent = alpha < 1;
                }
                
                this.smallBlobs.forEach((blob, index) => {
                    const fadeStart = index * 0.1;
                    if (progress > fadeStart) {
                        const alpha = Math.max(0, 1 - (progress - fadeStart) * 5);
                        blob.material.opacity = alpha;
                        blob.material.transparent = true;
                        blob.visible = alpha > 0.01;
                    }
                });
                break;
        }
    }

    onWindowResize() {
        if (!this.camera || !this.renderer || !this.container) return;
        
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        if (this.container && this.renderer?.domElement) {
            this.container.removeChild(this.renderer.domElement);
        }
        
        // Clean up resources
        if (this.renderer) this.renderer.dispose();
        
        // Dispose geometries and materials
        [this.mainBlob, ...this.smallBlobs].forEach(mesh => {
            if (mesh) {
                mesh.geometry.dispose();
                mesh.material.dispose();
            }
        });
        
        this.scene?.clear();
    }
}

// Make it globally available
window.MorphingShape3D = MorphingShape3D;