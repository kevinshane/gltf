// // Base Module
import * as THREE from "../build/three.module.js";
import { OrbitControls } from "./jsm/controls/OrbitControls.js";
import { CubemapGenerator } from "./jsm/loaders/EquirectangularToCubeGenerator.js";

// // WASD
import { PointerLockControls } from "./jsm/controls/PointerLockControls.js";

// // Stat+GUI
import Stats from "./jsm/libs/stats.module.js";
// import { GUI } from "./jsm/libs/dat.gui.module.js";

// // GLTF Loader
import { GLTFLoader } from "./jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "./jsm/loaders/DRACOLoader.js";

// // EXR Loader
// import { EXRLoader } from "./jsm/loaders/EXRLoader.js";

// // Outline Pass
// import { EffectComposer } from "./jsm/postprocessing/EffectComposer.js";
// import { RenderPass } from "./jsm/postprocessing/RenderPass.js";
// import { ShaderPass } from "./jsm/postprocessing/ShaderPass.js";
// import { OutlinePass } from "./jsm/postprocessing/OutlinePass.js";
// import { FXAAShader } from "./jsm/shaders/FXAAShader.js";

// // HDRI Cube
// import { RGBELoader } from "./jsm/loaders/RGBELoader.js";
// import { EquirectangularToCubeGenerator } from "./jsm/loaders/EquirectangularToCubeGenerator.js";
// import { PMREMGenerator } from "./jsm/pmrem/PMREMGenerator.js";
// import { PMREMCubeUVPacker } from "./jsm/pmrem/PMREMCubeUVPacker.js";

// define base
var container, stats;
var camera, scene, renderer;

// define gltf models
var loader, models;

// define loading
var loadingManager;

// define lightmap
const lmroom = new THREE.TextureLoader().load(
	// "models/bedroom_LM_Post.png",
	"models/LM_Day.jpg",
	function(t) {
		t.encoding = THREE.LinearEncoding;
		t.needsUpdate = true;
	}
);
const lmnight = new THREE.TextureLoader().load(
	// "models/bedroom_LM_Night_Post.png",
	"models/LM_Night.jpg",
	function(t) {
		t.encoding = THREE.LinearEncoding;
		t.needsUpdate = true;
	}
);

// normal map detail
var normalMap3 = new THREE.TextureLoader().load(
	"textures/pbr/Scratched_gold/Scratched_gold_01_1K_Normal.png"
);
normalMap3.wrapS = THREE.RepeatWrapping;
normalMap3.wrapT = THREE.RepeatWrapping;
normalMap3.repeat.x = 1;
normalMap3.repeat.y = 1;
normalMap3.anisotropy = 16;

// define cubemap & cubecamera
var sphere, material;
var cubeCamera1, cubeCamera2, cubeCamFinal;
var cubemap1, cubemap2, cubemapFinal;

var count = 0;

// define a bg image
var bg;
var textureLoader = new THREE.TextureLoader();
textureLoader.load("textures/HomeInterior01.jpg", function(texture) {
	texture.mapping = THREE.UVMapping;

	var options = {
		resolution: 1024,
		generateMipmaps: true,
		minFilter: THREE.LinearMipmapLinearFilter,
		magFilter: THREE.LinearFilter
	};

	scene.background = new CubemapGenerator(renderer).fromEquirectangular(
		texture,
		options
	);

	bg = scene.background;
});

// define tv video texture
// const tv = new THREE.VideoTexture(video);
// video.volume = 0;
// tv.minFilter = THREE.LinearFilter;
// tv.magFilter = THREE.LinearFilter;
// tv.format = THREE.RGBFormat;
// tv.wrapS = THREE.RepeatWrapping;
// tv.wrapT = THREE.RepeatWrapping;

init();
animate();

function init() {
	container = document.createElement("div");
	document.body.appendChild(container);
	window.addEventListener("resize", onWindowResize, false);

	// loading screen
	loadingManager = new THREE.LoadingManager(() => {
		const loadingScreen = document.getElementById("loading-screen");
		loadingScreen.classList.add("fade-out");
		loadingScreen.addEventListener("transitionend", onTransitionEnd); // optional: remove loader from DOM via event listener
	});

	scene = new THREE.Scene();

	// add a AxesHelper reference
	// var axesHelper = new THREE.AxesHelper(1);
	// axesHelper.position.set(3, 1, -5.5);
	// scene.add(axesHelper);

	// cubeCamera
	// cubeCamera1 = new THREE.CubeCamera(0.01, 100, 128);
	// cubeCamera1.renderTarget.texture.generateMipmaps = true;
	// cubeCamera1.renderTarget.texture.minFilter = THREE.LinearMipmapLinearFilter;
	// cubeCamera1.position.set(3, 1, -5.5);
	// cubemap1 = cubeCamera1.renderTarget.texture;
	// scene.add(cubeCamera1);

	cubeCamera2 = new THREE.CubeCamera(0.01, 10, 128);
	cubeCamera2.renderTarget.texture.generateMipmaps = true;
	cubeCamera2.renderTarget.texture.minFilter = THREE.LinearMipmapLinearFilter;
	cubeCamera2.position.set(3, 1, -5.5);
	cubemap2 = cubeCamera2.renderTarget.texture;
	scene.add(cubeCamera2);

	cubeCamFinal = new THREE.CubeCamera(0.01, 10, 512);
	cubeCamFinal.renderTarget.texture.generateMipmaps = true;
	cubeCamFinal.renderTarget.texture.minFilter = THREE.LinearMipmapLinearFilter;
	cubeCamFinal.position.set(3, 1, -5.5);
	cubemapFinal = cubeCamFinal.renderTarget.texture;
	scene.add(cubeCamFinal);

	// camera
	camera = new THREE.PerspectiveCamera(
		45,
		window.innerWidth / window.innerHeight,
		0.01,
		1000
	);
	camera.position.set(8, 3, -8);
	camera.lookAt(cubeCamFinal);

	// test sphere stuff
	material = new THREE.MeshPhysicalMaterial({
		clearcoat: 1.0,
		clearcoatRoughness: 0.1,
		metalness: 0.9,
		roughness: 0.2,
		color: 0xd9843b,
		normalMap: normalMap3,
		normalScale: new THREE.Vector2(1, 1),
		envMap: cubeCamera2.renderTarget.texture,
		envMapIntensity: 2
	});
	sphere = new THREE.Mesh(
		new THREE.IcosahedronBufferGeometry(0.1, 3),
		material
	);
	sphere.position.set(3, 1, -5.5);
	scene.add(sphere);

	//renderer
	renderer = new THREE.WebGLRenderer({ antialias: true }); //{ antialias: true } affect mobile performance a lot
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.gammaInput = true;
	renderer.gammaOutput = true;
	// renderer.gammaFactor = 2.2;
	renderer.info.autoReset = false;
	container.appendChild(renderer.domElement);

	//controls
	var controls = new OrbitControls(camera, renderer.domElement);
	controls.target.set(3, 1, -5.5);
	controls.update();

	//stats
	stats = new Stats();
	container.appendChild(stats.dom);

	//sprite
	var spriteMap = new THREE.TextureLoader().load("textures/sprite.png");
	var spriteMaterial = new THREE.SpriteMaterial({
		map: spriteMap,
		sizeAttenuation: true,
		color: 0xffffff
	});
	var sprite = new THREE.Sprite(spriteMaterial);
	var size = 0.3;
	sprite.scale.set(size, size, size);
	sprite.position.set(2, 1, -5.5);
	scene.add(sprite);

	loadgltf();
}

function loadgltf() {
	loader = new GLTFLoader(loadingManager);
	var dracoLoader = new DRACOLoader();
	dracoLoader.setDecoderPath("js/libs/draco/gltf/");
	loader.setDRACOLoader(dracoLoader);
	loader.load("models/bedroom_out/bedroom.gltf", function(gltf) {
		// modelwall = gltf.scene.children[0];
		// modelprop = gltf.scene.children[1];
		// modelbeds = gltf.scene.children[2];

		gltf.scene.traverse(function(node) {
			if (node.isMesh) {
				// modelwall.material.lightMap = lmWall;
				// modelprop.material.lightMap = lmprop;
				// modelbeds.material.lightMap = lmbeds;
				node.material.lightMap = lmroom;
				node.material.lightMapIntensity = 1;
				node.material.aoMap = lmroom;
				node.material.aoMapIntensity = 1;
				node.material.envMap = cubemapFinal;
				node.material.envMapIntensity = 1;
				node.material.roughness = 1;
				node.material.metalness = 0;
				// node.material.needsUpdate = true;
				node.material.color = new THREE.Color(0xffffff);
				// var map = new THREE.TextureLoader().load(
				// 	"models/custom_uv_gray.png",
				// 	function(e) {
				// 		e.encoding = THREE.sRGBEncoding;
				// 		e.flipY = false;
				// 		e.wrapS = THREE.RepeatWrapping; //wrapS=U
				// 		e.wrapT = THREE.RepeatWrapping; //wrapT=V
				// 		e.repeat.set(1, 1); //(U,V)repeat
				// 	}
				// );
				// node.material.map = null;

				// chrome
				if (node.material.name == "chrome" || node.material.name == "Mirror") {
					// node.material.lightMap = null;
					node.material.color = new THREE.Color(0xffffff);
					node.material.metalness = 1;
					node.material.roughness = 0.05;
					node.material.clearcoat = 1;
					node.material.clearcoatRoughness = 0.1;
				}

				// // TV Screen Video
				// if (node.material.name == "screen") {
				// 	node.material.map = tv;
				// }

				// TV Screen Video
				if (node.material.name == "screen") {
					node.material.metalness = 1;
					node.material.roughness = 0;
					node.material.color = new THREE.Color(0x000000);
				}

				// gold
				if (node.material.name == "gold") {
					node.material.color = new THREE.Color(0xd9843b);
					node.material.envMapIntensity = 1.5;
					node.material.metalness = 0.9;
					node.material.roughness = 0.1;
					node.material.clearcoat = 1;
					node.material.clearcoatRoughness = 0.1;
					// node.material.normalMap = normalMap3;
					// node.material.normalScale = new THREE.Vector2(0.5, 0.5);
				}

				// glass
				if (node.material.name == "glass") {
					node.material.transparent = true;
					node.material.metalness = 0.8;
					node.material.roughness = 0;
					node.material.opacity = 0.4;
					node.material.refractionRatio = 0.98;
					node.material.envMapIntensity = 2;
					// node.material.envMap.mapping = THREE.CubeRefractionMapping;
				}

				// black
				if (
					node.material.name == "black" ||
					node.material.name == "black_clear"
				) {
					node.material.metalness = 0.2;
					node.material.roughness = 0;
					node.material.color = new THREE.Color(0x000000);
				}

				// White
				if (node.material.name == "White") {
					node.material.metalness = 0;
					node.material.roughness = 0.2;
					node.material.color = new THREE.Color(0xffffff);
				}

				// grey wall
				if (node.material.name == "ICI-Grey") {
					node.material.metalness = 0;
					node.material.roughness = 0.7;
					node.material.color = new THREE.Color(0x7a7a7a);
				}

				// wood_10 doors
				if (node.material.name == "wood_10") {
					node.material.metalness = 0;
					node.material.roughness = 0.8;
					node.material.color = new THREE.Color(0xffffff);
				}

				// bulb emissive
				if (node.material.name == "bulb") {
					node.material.metalness = 0;
					node.material.roughness = 0;
					node.material.emissive = new THREE.Color(0xffffff);
					node.material.emissiveIntensity = 2;
				}

				// curtain1
				if (node.material.name == "curtain1") {
					// node.material = new THREE.MeshBasicMaterial();
				}

				// perfume & book
				if (
					node.material.name == "perfume_white" ||
					node.material.name == "perfume_pink" ||
					node.material.name == "pic01" ||
					node.material.name == "pic02" ||
					node.material.name == "pic03" ||
					node.material.name == "pic04" ||
					node.material.name == "pic05"
				) {
					node.material.map.flipY = true; // flip the Y of image
					node.material.metalness = 0.3;
					node.material.roughness = 0;
					node.material.color = new THREE.Color(0xffffff);
				}
			}
		});

		scene.add(gltf.scene);
		models = gltf.scene;

		// update cubemapFinal
		if (models) {
			models.traverse(function(node) {
				if (node.isMesh) {
					node.material.envMap = null;
				}
			});
			cubeCamFinal.update(renderer, scene);
			models.traverse(function(node) {
				if (node.isMesh) {
					node.material.envMap = cubemapFinal;
				}
			});
		}

		// console.log(gltf.scene.children[0].children[0]);

		// testing
		sphere.visible = false;
		cubeCamera2.update(renderer, scene);
		sphere.visible = true;
	});
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
	requestAnimationFrame(animate);
	renderer.info.reset();

	// const delta = clock.getDelta();
	// if (mixer !== undefined) mixer.update(delta);

	renderer.render(scene, camera);
	console.log(renderer.info.render);
	stats.update();
}

// remove loadingManager
function onTransitionEnd(event) {
	event.target.remove();
}

// changeNight
var night = document.getElementById("night");
night.addEventListener("click", changeNight, false);

function changeNight() {
	models.traverse(function(node) {
		if (node.isMesh) {
			node.material.lightMap = lmnight;
			node.material.aoMap = lmnight;
			node.material.aoMapIntensity = 1;
		}
	});
} //切换夜景
