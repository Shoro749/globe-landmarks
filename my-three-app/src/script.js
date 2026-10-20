import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import './style.css';

const canvas = document.querySelector('canvas.webgl');
const scene = new THREE.Scene();
const labels = document.querySelector('.labels');
const card = document.querySelector('.landmark-card');
const textureLoader = new THREE.TextureLoader();
const globeRadius = 2.5;
const landmarks = [
    { name: 'Ейфелева вежа', city: 'Париж, Франція', year: '1889', lat: 48.8584, lon: 2.2945, fact: 'Її спроєктували як тимчасовий вхід до Всесвітньої виставки. Сьогодні це найвідоміший силует Парижа.' },
    { name: 'Колізей', city: 'Рим, Італія', year: '80', lat: 41.8902, lon: 12.4922, fact: 'Амфітеатр міг прийняти понад 50 000 глядачів і мав складну систему підземних тунелів.' },
    { name: 'Статуя Свободи', city: 'Нью-Йорк, США', year: '1886', lat: 40.6892, lon: -74.0445, fact: 'Мідна статуя була подарунком Франції до сторіччя американської незалежності.' },
    { name: 'Тадж-Махал', city: 'Агра, Індія', year: '1653', lat: 27.1751, lon: 78.0421, fact: 'Білий мармуровий мавзолей збудував імператор Шах-Джахан на памʼять про свою дружину Мумтаз-Махал.' },
    { name: 'Піраміди Гізи', city: 'Гіза, Єгипет', year: '2560 до н.е.', lat: 29.9792, lon: 31.1342, fact: 'Велика піраміда Хуфу була найвищою спорудою світу майже чотири тисячі років.' }
];

const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 0.35, 7.7);
scene.add(camera);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 3.2;
controls.maxDistance = 10;
const ambientLight = new THREE.AmbientLight(0x6f86a8, 0.5);
const sun = new THREE.DirectionalLight(0xfff3d1, 2.6);
sun.position.set(5, 3, 5);
scene.add(ambientLight, sun);

const earth = new THREE.Mesh(
    new THREE.SphereGeometry(globeRadius, 64, 64),
    new THREE.MeshStandardMaterial({ map: textureLoader.load('https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg'), roughness: 0.82, metalness: 0.02 })
);
scene.add(earth);
const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(globeRadius * 1.018, 48, 48), new THREE.MeshBasicMaterial({ color: 0x4ba7d8, transparent: true, opacity: 0.12, side: THREE.BackSide }));
scene.add(atmosphere);

const starsGeometry = new THREE.BufferGeometry();
const starPositions = new Float32Array(1400 * 3);
for (let i = 0; i < starPositions.length; i += 3) {
    const direction = new THREE.Vector3().randomDirection().multiplyScalar(16 + Math.random() * 18);
    starPositions[i] = direction.x; starPositions[i + 1] = direction.y; starPositions[i + 2] = direction.z;
}
starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
scene.add(new THREE.Points(starsGeometry, new THREE.PointsMaterial({ color: 0xa9c5df, size: 0.035, transparent: true, opacity: 0.65 })));

function coordinateToVector(lat, lon, radius = globeRadius) {
    const phi = (90 - lat) * Math.PI / 180;
    const theta = (lon + 180) * Math.PI / 180;
    return new THREE.Vector3(-radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta));
}

const markerGroup = new THREE.Group();
scene.add(markerGroup);
landmarks.forEach((landmark, index) => {
    const marker = new THREE.Mesh(new THREE.SphereGeometry(0.075, 20, 20), new THREE.MeshBasicMaterial({ color: 0xffb35c }));
    marker.position.copy(coordinateToVector(landmark.lat, landmark.lon, globeRadius + 0.1));
    marker.userData = { ...landmark, index };
    markerGroup.add(marker);
    const label = document.createElement('button');
    label.className = 'landmark-label'; label.type = 'button';
    label.innerHTML = `<span>${String(index + 1).padStart(2, '0')}</span>${landmark.name}`;
    label.addEventListener('click', () => openLandmark(landmark, marker));
    labels.appendChild(label);
    landmark.label = label; landmark.marker = marker;
});

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let cameraTween = null;
const initialCameraPosition = camera.position.clone();

function openLandmark(landmark, marker) {
    card.querySelector('.card-index').textContent = `${String(landmark.index + 1).padStart(2, '0')} / ЛАНДМАРК`;
    card.querySelector('h2').textContent = landmark.name;
    card.querySelector('.card-location').textContent = landmark.city;
    card.querySelector('.card-year').textContent = landmark.year;
    card.querySelector('.card-coordinates').textContent = `${landmark.lat.toFixed(2)}° N / ${Math.abs(landmark.lon).toFixed(2)}° ${landmark.lon >= 0 ? 'E' : 'W'}`;
    card.querySelector('.card-fact').textContent = landmark.fact;
    card.classList.add('is-open'); card.setAttribute('aria-hidden', 'false');
    const worldPosition = marker.getWorldPosition(new THREE.Vector3());
    cameraTween = { from: camera.position.clone(), to: worldPosition.normalize().multiplyScalar(5.1), start: performance.now(), duration: 1100 };
    controls.enabled = false;
}
function closeLandmark() {
    card.classList.remove('is-open'); card.setAttribute('aria-hidden', 'true');
    cameraTween = { from: camera.position.clone(), to: initialCameraPosition.clone(), start: performance.now(), duration: 900 };
    controls.enabled = true;
}
card.querySelector('.close-card').addEventListener('click', closeLandmark);
card.querySelector('.return-button').addEventListener('click', closeLandmark);
canvas.addEventListener('pointerdown', (event) => {
    pointer.x = (event.clientX / innerWidth) * 2 - 1; pointer.y = -(event.clientY / innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(markerGroup.children)[0];
    if (hit) openLandmark(hit.object.userData, hit.object);
});

const toggle = document.querySelector('.mode-toggle');
toggle.addEventListener('click', () => {
    const isNight = document.body.classList.toggle('night');
    toggle.setAttribute('aria-pressed', String(isNight));
    toggle.querySelector('.mode-label').textContent = isNight ? 'Ніч' : 'День';
    toggle.querySelector('.mode-icon').textContent = isNight ? '☾' : '☀';
    sun.color.set(isNight ? 0x526bba : 0xfff3d1); sun.position.set(isNight ? -4 : 5, isNight ? 1 : 3, isNight ? -3 : 5);
    sun.intensity = isNight ? 0.65 : 2.6; ambientLight.intensity = isNight ? 0.2 : 0.5;
});

function updateLabels() {
    landmarks.forEach((landmark) => {
        const worldPosition = landmark.marker.getWorldPosition(new THREE.Vector3());
        const projected = worldPosition.clone().project(camera);
        const visible = projected.z < 1 && worldPosition.normalize().dot(camera.position.clone().normalize()) > 0.15;
        landmark.label.style.transform = `translate(-50%, -50%) translate(${(projected.x * 0.5 + 0.5) * innerWidth}px, ${(-projected.y * 0.5 + 0.5) * innerHeight}px)`;
        landmark.label.classList.toggle('is-hidden', !visible);
    });
}
function animate(time = 0) {
    requestAnimationFrame(animate);
    earth.rotation.y += 0.00045; atmosphere.rotation.y = earth.rotation.y; markerGroup.rotation.y = earth.rotation.y;
    landmarks.forEach(({ marker }, index) => marker.scale.setScalar(1 + Math.sin(time * 0.004 + index) * 0.22));
    if (cameraTween) {
        const progress = Math.min((time - cameraTween.start) / cameraTween.duration, 1);
        camera.position.lerpVectors(cameraTween.from, cameraTween.to, 1 - Math.pow(1 - progress, 3));
        if (progress === 1) cameraTween = null;
    }
    controls.update(); updateLabels(); renderer.render(scene, camera);
}
animate();
window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
});