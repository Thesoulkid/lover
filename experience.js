import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { memoriesData } from './utils.js';

class CelestialOrrery {
    constructor() {
        // DOM Elements
        this.container = document.getElementById('experience-container');
        this.ui = {
            loader: document.getElementById('loader'),
            titleCard: document.getElementById('title-card'),
            keyInterface: document.getElementById('key-interface'),
            keyInput: document.getElementById('key-input'),
            keyRings: document.querySelectorAll('.ring'),
            memoryViewer: document.getElementById('memory-viewer'),
            memoryPhoto: document.getElementById('memory-photo'),
            memoryQuote: document.getElementById('memory-quote'),
            finalMessage: document.getElementById('final-message'),
            cursor: document.getElementById('custom-cursor'),
        };
        this.sounds = {
            ambient: document.getElementById('ambient-music'),
            key: document.getElementById('key-sound'),
            unlock: document.getElementById('unlock-sound'),
        }

        // 3D Scene Setup
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
        this.camera.position.set(0, 10, 50);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);
        this.clock = new THREE.Clock();

        // State
        this.state = 'loading';
        this.memoryShards = [];
        this.orbits = [];
        this.viewedMemories = new Set();

        this.init();
    }

    async init() {
        this.initPostProcessing();
        this.initLights();
        await this.loadAssets();
        this.initOrrery();
        this.bindEvents();
        this.startIntro();
        this.animate();
    }

    initPostProcessing() {
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        const bloomParams = { strength: 1.2, radius: 0.5, threshold: 0 };
        this.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), bloomParams.strength, bloomParams.radius, bloomParams.threshold);
        this.composer.addPass(this.bloomPass);
    }
    
    initLights() {
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.2));
        const pointLight = new THREE.PointLight(0xffc0cb, 1.5, 200);
        pointLight.position.set(0, 0, 0);
        this.scene.add(pointLight);
    }

    async loadAssets() {
        const textureLoader = new THREE.TextureLoader();
        const gltfLoader = new GLTFLoader();
        const nebulaTexture = await textureLoader.loadAsync('assets/textures/nebula.jpg');
        const heartGltf = await gltfLoader.loadAsync('assets/models/heart.glb');

        const bgGeo = new THREE.SphereGeometry(1000, 64, 64);
        const bgMat = new THREE.MeshBasicMaterial({ map: nebulaTexture, side: THREE.BackSide });
        this.scene.add(new THREE.Mesh(bgGeo, bgMat));

        this.heart = heartGltf.scene;
        this.heart.scale.set(0, 0, 0);
        this.heart.traverse(child => {
            if (child.isMesh) {
                child.material = new THREE.MeshStandardMaterial({
                    color: 0xffc0cb, emissive: 0xff80ab, emissiveIntensity: 0.6,
                    metalness: 0.9, roughness: 0.1, transparent: true, opacity: 0.9
                });
            }
        });
        this.scene.add(this.heart);
    }

    startIntro() {
        this.ui.loader.classList.add('hidden');
        this.ui.titleCard.classList.remove('hidden');
        gsap.from(this.ui.titleCard, { duration: 2, opacity: 0, scale: 0.8 });
        gsap.to(this.heart.scale, { duration: 3, x: 10, y: 10, z: 10, ease: 'elastic.out(1, 0.5)' });

        setTimeout(() => {
            gsap.to(this.ui.titleCard, { duration: 1, opacity: 0, onComplete: () => this.ui.titleCard.classList.add('hidden') });
            this.ui.keyInterface.classList.remove('hidden');
            gsap.from(this.ui.keyInterface, { duration: 1, opacity: 0 });
            this.ui.keyInput.focus();
            this.state = 'key_entry';
        }, 3000);
    }

    handleKeyInput(value) {
        this.ui.keyRings.forEach((ring, i) => ring.classList.toggle('active', i < value.length));
        this.sounds.key.play();
        if (value === '281025') {
            this.sounds.unlock.play();
            this.state = 'awakening';
            gsap.to(this.ui.keyInterface, { duration: 1, opacity: 0, onComplete: () => this.ui.keyInterface.classList.add('hidden')});
            this.awakenUniverse();
        }
    }
    
    awakenUniverse() {
        gsap.timeline()
            .to(this.heart.scale, { duration: 1, x: 12, y: 12, z: 12, ease: 'power2.inOut' })
            .to(this.heart.scale, { duration: 1, x: 10, y: 10, z: 10, ease: 'power2.inOut' });
        
        this.orbits.forEach((orbit, i) => {
            gsap.to(orbit.scale, { duration: 2, delay: i * 0.2, x: 1, y: 1, z: 1, ease: 'power2.out' });
        });

        setTimeout(() => this.introduceMemories(), 1000);
    }
    
    initOrrery() {
        const orbitRadii = [20, 35, 50];
        orbitRadii.forEach(radius => {
            const orbitGeo = new THREE.TorusGeometry(radius, 0.1, 16, 100);
            const orbitMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2 });
            const orbit = new THREE.Mesh(orbitGeo, orbitMat);
            orbit.rotation.x = Math.PI / 2;
            orbit.scale.set(0, 0, 0);
            this.scene.add(orbit);
            this.orbits.push(orbit);
        });
    }

    introduceMemories() {
        const shardGeo = new THREE.IcosahedronGeometry(1, 0);
        const shardMat = new THREE.MeshStandardMaterial({
            color: 0xffffff, emissive: 0xffc0cb, emissiveIntensity: 0.3,
            transparent: true, opacity: 0.5, roughness: 0.2, metalness: 0.8
        });
        
        memoriesData.forEach((mem, i) => {
            const shard = new THREE.Mesh(shardGeo, shardMat);
            const orbitRadius = this.orbits[mem.chapter - 1].geometry.parameters.radius;
            const angle = (i / memoriesData.length) * Math.PI * 2 * (mem.chapter);
            shard.position.set(Math.cos(angle) * orbitRadius, 0, Math.sin(angle) * orbitRadius);
            shard.userData = { ...mem, index: i };
            shard.visible = false;
            this.scene.add(shard);
            this.memoryShards.push(shard);
        });
        
        gsap.utils.toArray(this.memoryShards).forEach((shard, i) => {
            shard.visible = true;
            shard.scale.set(0,0,0);
            gsap.to(shard.scale, { duration: 1, delay: 2 + i * 0.1, x: 1, y: 1, z: 1, ease: 'back.out(1.7)'});
        });

        this.state = 'exploring';
    }
    
    viewMemory(shard) {
        if (this.state !== 'exploring') return;
        this.state = 'viewing';
        this.activeShard = shard;

        gsap.to(this.camera.position, {
            duration: 2,
            x: shard.position.x * 0.8,
            y: shard.position.y + 5,
            z: shard.position.z * 0.8 + 15,
            ease: 'power3.inOut'
        });
        
        this.ui.memoryPhoto.src = shard.userData.photo;
        this.ui.memoryQuote.textContent = shard.userData.quote;
        this.ui.memoryViewer.classList.remove('hidden');
        gsap.fromTo(this.ui.memoryViewer, { opacity: 0 }, { duration: 1, delay: 1, opacity: 1 });
    }
    
    closeMemoryView() {
        if (this.state !== 'viewing') return;

        gsap.to(this.ui.memoryViewer, { duration: 1, opacity: 0, onComplete: () => this.ui.memoryViewer.classList.add('hidden') });
        gsap.to(this.camera.position, { duration: 2, x: 0, y: 10, z: 50, ease: 'power3.inOut' });

        if (!this.viewedMemories.has(this.activeShard.userData.index)) {
            this.viewedMemories.add(this.activeShard.userData.index);
            // Enhance the Orrery
            gsap.to(this.activeShard.material, { color: new THREE.Color(0xffc0cb), emissiveIntensity: 0.8 });
        }
        
        this.activeShard = null;
        this.state = 'exploring';
        
        if (this.viewedMemories.size === memoriesData.length) {
            this.triggerGrandSymphony();
        }
    }
    
    triggerGrandSymphony() {
        this.state = 'final';
        gsap.timeline({ delay: 2 })
            .to(this.camera.position, { duration: 3, x: 0, y: 80, z: 80, ease: 'power2.inOut' }, 0)
            .to(this.heart.scale, { duration: 2, x: 15, y: 15, z: 15, ease: 'power2.inOut' }, 1)
            .call(() => {
                this.ui.finalMessage.classList.remove('hidden');
                gsap.fromTo(this.ui.finalMessage, { opacity: 0 }, { duration: 3, opacity: 1 });
            }, null, 3);
    }

    bindEvents() {
        window.addEventListener('resize', this.onWindowResize.bind(this));
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.ui.keyInput.addEventListener('input', (e) => this.handleKeyInput(e.target.value));
        this.container.addEventListener('click', this.onClick.bind(this));
        this.ui.memoryViewer.addEventListener('click', this.closeMemoryView.bind(this));
        document.addEventListener('click', () => {
             if (this.sounds.ambient.paused) this.sounds.ambient.play();
        }, { once: true });
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }
    
    onMouseMove(e) {
        const mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        const mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
        gsap.to(this.camera.position, { duration: 1, x: mouseX * 5, y: 10 + mouseY * 5, ease: 'power1.out' });
        
        this.ui.cursor.style.left = `${e.clientX}px`;
        this.ui.cursor.style.top = `${e.clientY}px`;
    }
    
    onClick(e) {
        if (this.state !== 'exploring') return;
        
        const mouse = new THREE.Vector2((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);
        const intersects = raycaster.intersectObjects(this.memoryShards);
        
        if (intersects.length > 0) {
            this.viewMemory(intersects[0].object);
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const delta = this.clock.getDelta();
        
        this.heart.rotation.y += delta * 0.1;
        this.orbits.forEach((orbit, i) => orbit.rotation.z += delta * (0.05 / (i + 1)));
        this.memoryShards.forEach(shard => {
            const orbitRadius = this.orbits[shard.userData.chapter - 1].geometry.parameters.radius;
            const speed = 0.2 / shard.userData.chapter;
            const angle = this.clock.elapsedTime * speed + (shard.userData.index / memoriesData.length) * Math.PI * 2;
            shard.position.x = Math.cos(angle) * orbitRadius;
            shard.position.z = Math.sin(angle) * orbitRadius;
        });

        if (this.activeShard) {
            this.camera.lookAt(this.activeShard.position);
        } else {
            this.camera.lookAt(this.scene.position);
        }

        this.composer.render();
    }
}

new CelestialOrrery();
