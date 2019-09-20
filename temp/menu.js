/* -------------------------------------------------------------------------- */
/*                             NOTE Import Module                             */
/* -------------------------------------------------------------------------- */
// Base Module
import * as THREE from "../build/three.module.js";
import { OrbitControls } from "./jsm/controls/OrbitControls.js";
// import { PointerLockControls } from "./jsm/controls/PointerLockControls.js";
import { CubemapGenerator } from "./jsm/loaders/EquirectangularToCubeGenerator.js";

// Stat+GUI
import Stats from "./jsm/libs/stats.module.js";
import { GUI } from "./jsm/libs/dat.gui.module.js";

// Processing
import * as Nodes from "./jsm/nodes/Nodes.js";

// // Mirror
// import { Reflector } from "./jsm/objects/Reflector.js";

// GLTF Loader
import { GLTFLoader } from "./jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "./jsm/loaders/DRACOLoader.js";

// // Outline Pass
// import { EffectComposer } from "./jsm/postprocessing/EffectComposer.js";
// import { RenderPass } from "./jsm/postprocessing/RenderPass.js";
// import { ShaderPass } from "./jsm/postprocessing/ShaderPass.js";
// import { OutlinePass } from "./jsm/postprocessing/OutlinePass.js";
// import { FXAAShader } from "./jsm/shaders/FXAAShader.js";

// HDRI Cube
import { RGBELoader } from "./jsm/loaders/RGBELoader.js";
import { EquirectangularToCubeGenerator } from "./jsm/loaders/EquirectangularToCubeGenerator.js";
import { PMREMGenerator } from "./jsm/pmrem/PMREMGenerator.js";
import { PMREMCubeUVPacker } from "./jsm/pmrem/PMREMCubeUVPacker.js";

/* -------------------------------------------------------------------------- */
/*                                NOTE variable                               */
/* -------------------------------------------------------------------------- */
let container, controls, stats;
let camera, scene, renderer;
// let outlineObjects = []; //选择需要加轮廓的物体
// let composer, effectFXAA, outlinePass; //轮廓特性所需要的变量
let envMap;
let loader, models;
let loadingManager;

var modelObj, modelWall, modelSofa01;

const lmroom = new THREE.TextureLoader().load(
	"models/bedroom_LM_Post.png",
	function(t) {
		t.encoding = THREE.sRGBEncoding;
		t.needsUpdate = true;
	}
);
const lmnight = new THREE.TextureLoader().load(
	"models/bedroom_LM_Night_Post.png",
	function(t) {
		t.encoding = THREE.sRGBEncoding;
		t.needsUpdate = true;
	}
);
const lmwall = new THREE.TextureLoader().load(
	"models/livingroom/Wall_LM.png",
	function(t) {
		t.encoding = THREE.sRGBEncoding;
		t.needsUpdate = true;
	}
);
const lmsofa01 = new THREE.TextureLoader().load(
	"models/livingroom/Sofa01_LM.png",
	function(t) {
		t.encoding = THREE.sRGBEncoding;
		t.needsUpdate = true;
	}
);
const lmtable = new THREE.TextureLoader().load(
	"models/livingroom/DinngingTable_LM.png",
	function(t) {
		t.encoding = THREE.sRGBEncoding;
		t.needsUpdate = true;
	}
);
const lmprops01 = new THREE.TextureLoader().load(
	"models/livingroom/Props01_LM.png",
	function(t) {
		t.encoding = THREE.sRGBEncoding;
		t.needsUpdate = true;
	}
);

// define cubemap & cubecamera
var sphere, material;
var cubeCamera1, cubeCamera2, cubeCamFinal;
var cubemap1, cubemap2, cubemapFinal;

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

	// // show background
	// scene.background = new CubemapGenerator(renderer).fromEquirectangular(
	// 	texture,
	// 	options
	// );

	bg = scene.background;
});

// define tv video texture
// const tv = new THREE.VideoTexture(video);
// video.volume = 0;
// tv.minFilter = THREE.LinearFilter;
// tv.magFilter = THREE.LinearFilter;
// tv.format = THREE.RGBFormat;

/* -------------------------------------------------------------------------- */
/*                                End variable                                */
/* -------------------------------------------------------------------------- */

init();
animate();

function init() {
	container = document.createElement("div");
	document.body.appendChild(container);
	camera = new THREE.PerspectiveCamera(
		45,
		window.innerWidth / window.innerHeight,
		0.01,
		100
	);
	// camera.position.set(8, 3, -8);
	// x=max.x, y=max.z, z=max.-y, (x,z,-y)
	camera.position.set(12, 5, 2);
	// camera.position.setScalar(0.2); //拉远相机
	scene = new THREE.Scene();

	// var directionalLight = new THREE.DirectionalLight(0xffffff, 5);
	// directionalLight.position.set(17, 10, -20);
	// directionalLight.castShadow = true;
	// scene.add(directionalLight);

	/* --------------------------- NOTE loading screen -------------------------- */
	loadingManager = new THREE.LoadingManager(() => {
		const loadingScreen = document.getElementById("loading-screen");
		loadingScreen.classList.add("fade-out");
		loadingScreen.addEventListener("transitionend", onTransitionEnd); // optional: remove loader from DOM via event listener
	});

	/* ------------------------------ NOTE renderer ----------------------------- */
	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	// renderer.gammaInput = true;
	renderer.gammaOutput = true;
	renderer.gammaFactor = 1.7;
	renderer.info.autoReset = false;
	renderer.toneMappingExposure = 1;
	renderer.toneMapping = THREE.Uncharted2ToneMapping;
	// renderer.capabilities.maxTextureSize = 1024;
	container.appendChild(renderer.domElement);

	// controls
	controls = new OrbitControls(camera, renderer.domElement);
	controls.target.set(4.5, 0, -4.2);
	controls.update();

	window.addEventListener("resize", onWindowResize, false);
	stats = new Stats(); // Add stats to page.
	document.body.appendChild(stats.dom);

	// // postprocessing
	// composer = new EffectComposer(renderer);
	// var renderPass = new RenderPass(scene, camera);
	// composer.addPass(renderPass);
	// outlinePass = new OutlinePass(
	// 	new THREE.Vector2(window.innerWidth, window.innerHeight),
	// 	scene,
	// 	camera
	// );
	// outlinePass.selectedObjects = []; //显示轮廓的物体
	// outlinePass.pulsePeriod = 3; //轮廓呼吸时间
	// outlinePass.visibleEdgeColor.set(0xffbf64); //轮廓颜色
	// outlinePass.edgeThickness = 1; //轮廓厚度
	// composer.addPass(outlinePass);

	// effectFXAA = new ShaderPass(FXAAShader);
	// effectFXAA.uniforms["resolution"].value.set(
	// 	1 / window.innerWidth,
	// 	1 / window.innerHeight
	// );
	// composer.addPass(effectFXAA);

	// function addSelectedObject(object) { //暂时不清楚有什么用
	// 	selectedObjects = [];
	// 	selectedObjects.push(object);
	// }

	// // Load HDRI ENV map
	// new RGBELoader()
	// 	.setDataType(THREE.UnsignedByteType)
	// 	.load("textures/interior.hdr", function(texture) {
	// 		var cubeGenerator = new EquirectangularToCubeGenerator(texture, {
	// 			resolution: 512
	// 		});
	// 		cubeGenerator.update(renderer);
	// 		var pmremGenerator = new PMREMGenerator(
	// 			cubeGenerator.renderTarget.texture
	// 		);
	// 		pmremGenerator.update(renderer);
	// 		var pmremCubeUVPacker = new PMREMCubeUVPacker(pmremGenerator.cubeLods);
	// 		pmremCubeUVPacker.update(renderer);
	// 		envMap = pmremCubeUVPacker.CubeUVRenderTarget.texture;
	// 		// scene.background = cubeGenerator.renderTarget;

	// 		loadgltf();

	// 		pmremGenerator.dispose();
	// 		pmremCubeUVPacker.dispose();
	// 		// scene.background = cubeGenerator.renderTarget;
	// 	});

	// add a AxesHelper reference
	// var axesHelper = new THREE.AxesHelper(0.5);
	// axesHelper.position.set(4.6, 1.4, -6);
	// scene.add(axesHelper);

	/* ------------------------------ NOTE CubeMap ------------------------------ */
	// max.x=x, max.y=z, max.z=-y
	cubeCamera1 = new THREE.CubeCamera(0.01, 10, 512);
	// cubeCamera1.renderTarget.texture.generateMipmaps = true;
	// cubeCamera1.renderTarget.texture.minFilter = THREE.LinearMipmapLinearFilter;
	cubeCamera1.position.set(4.6, 1.4, -6);
	cubemap1 = cubeCamera1.renderTarget.texture;
	scene.add(cubeCamera1);

	cubeCamera2 = new THREE.CubeCamera(0.01, 10, 512);
	cubeCamera2.renderTarget.texture.generateMipmaps = true; //镜子反射模糊更真实些
	cubeCamera2.renderTarget.texture.minFilter = THREE.LinearMipmapLinearFilter;
	cubeCamera2.position.set(4.6, 1.4, -2.3);
	cubemap2 = cubeCamera2.renderTarget.texture;
	scene.add(cubeCamera2);

	cubeCamFinal = new THREE.CubeCamera(0.01, 10, 512);
	// cubeCamFinal.renderTarget.texture.generateMipmaps = true;
	// cubeCamFinal.renderTarget.texture.minFilter = THREE.LinearMipmapLinearFilter;
	cubeCamFinal.position.set(6.4, 1.4, -4.3);
	cubemapFinal = cubeCamFinal.renderTarget.texture;
	scene.add(cubeCamFinal);

	loadgltf();
}

/* -------------------------------------------------------------------------- */
/*                              NOTE GLTF loader                              */
/* -------------------------------------------------------------------------- */

// function loadgltf() {
// 	loader = new GLTFLoader(loadingManager);
// 	var dracoLoader = new DRACOLoader();
// 	dracoLoader.setDecoderPath("js/libs/draco/gltf/");
// 	loader.setDRACOLoader(dracoLoader);
// 	loader.load("models/bedroom_out/bedroom.gltf", function(gltf) {
// 		// modelwall = gltf.scene.children[0];
// 		// modelprop = gltf.scene.children[1];
// 		// modelbeds = gltf.scene.children[2];

// 		modelObj = gltf.scene;

// 		modelObj.traverse(function(node) {
// 			if (node.isMesh) {
// 				// modelwall.material.lightMap = lmWall;
// 				// modelprop.material.lightMap = lmprop;
// 				// modelbeds.material.lightMap = lmbeds;
// 				node.material.lightMap = lmroom;
// 				node.material.lightMapIntensity = 1;
// 				node.material.aoMap = lmroom;
// 				node.material.aoMapIntensity = 1;
// 				node.material.envMap = cubemapFinal;
// 				node.material.envMapIntensity = 1;
// 				node.material.roughness = 1;
// 				node.material.metalness = 0;
// 				// node.material.needsUpdate = true;
// 				node.material.color = new THREE.Color(0xffffff);
// 				// var map = new THREE.TextureLoader().load(
// 				// 	"models/custom_uv_gray.png",
// 				// 	function(e) {
// 				// 		e.encoding = THREE.sRGBEncoding;
// 				// 		e.flipY = false;
// 				// 		e.wrapS = THREE.RepeatWrapping; //wrapS=U
// 				// 		e.wrapT = THREE.RepeatWrapping; //wrapT=V
// 				// 		e.repeat.set(1, 1); //(U,V)repeat
// 				// 	}
// 				// );
// 				// node.material.map = null;

// 				// chrome
// 				if (node.material.name == "chrome" || node.material.name == "Mirror") {
// 					// node.material.lightMap = null;
// 					// outlinePass.selectedObjects = outlineObjects; //显示轮廓的物体
// 					// outlineObjects.push(node); //加入到选集里
// 					node.material.color = new THREE.Color(0xffffff);
// 					node.material.metalness = 1;
// 					node.material.roughness = 0.05;
// 					node.material.clearcoat = 1;
// 					node.material.clearcoatRoughness = 0.1;
// 				}

// 				// Mirror_Pattern
// 				if (node.material.name == "Mirror_Pattern") {
// 					var rough = new THREE.TextureLoader().load(
// 						"models/bedroom_out/d-1hb.jpg",
// 						function(e) {
// 							e.encoding = THREE.sRGBEncoding;
// 							e.flipY = true;
// 							e.wrapS = THREE.RepeatWrapping; //wrapS=U
// 							e.wrapT = THREE.RepeatWrapping; //wrapT=V
// 							e.repeat.set(1, 1); //(U,V)repeat
// 						}
// 					);
// 					node.material.map = null;
// 					node.material.color = new THREE.Color(0x8c8c8c);
// 					node.material.metalness = 0.8;
// 					node.material.roughnessMap = rough;
// 					node.material.roughness = 0.3;
// 					node.material.clearcoat = 1;
// 					node.material.clearcoatRoughness = 0.1;
// 					node.material.needsUpdate = true;
// 					console.log(node);
// 				}

// 				// gold
// 				if (node.material.name == "gold") {
// 					node.material.color = new THREE.Color(0xd9843b);
// 					node.material.envMapIntensity = 1.5;
// 					node.material.metalness = 0.9;
// 					node.material.roughness = 0.1;
// 					node.material.clearcoat = 1;
// 					node.material.clearcoatRoughness = 0.1;
// 					// node.material.normalMap = normalMap3;
// 					// node.material.normalScale = new THREE.Vector2(0.5, 0.5);
// 				}

// 				// glass
// 				if (node.material.name == "glass") {
// 					node.material.transparent = true;
// 					node.material.metalness = 0.8;
// 					node.material.roughness = 0;
// 					node.material.opacity = 0.4;
// 					node.material.refractionRatio = 0.98;
// 					node.material.envMapIntensity = 2;
// 					// node.material.envMap.mapping = THREE.CubeRefractionMapping;
// 				}

// 				// black
// 				if (
// 					node.material.name == "black" ||
// 					node.material.name == "black_clear" ||
// 					node.material.name == "screen"
// 				) {
// 					node.material.metalness = 0.2;
// 					node.material.roughness = 0;
// 					node.material.color = new THREE.Color(0x000000);
// 				}

// 				// // Screen
// 				// if (node.material.name == "screen") {
// 				// 	// node.material = tv; // Video material for TV
// 				// 	node.material.map = tv;
// 				// }

// 				// White
// 				if (node.material.name == "White") {
// 					node.material.metalness = 0;
// 					node.material.roughness = 0.2;
// 					node.material.color = new THREE.Color(0xffffff);
// 				}

// 				// grey wall
// 				if (node.material.name == "ICI-Grey") {
// 					node.material.metalness = 0;
// 					node.material.roughness = 0.7;
// 					node.material.color = new THREE.Color(0x7a7a7a);
// 				}

// 				// wood_10 doors
// 				if (node.material.name == "wood_10") {
// 					node.material.metalness = 0;
// 					node.material.roughness = 0.8;
// 					node.material.color = new THREE.Color(0xffffff);
// 				}

// 				// bulb emissive
// 				if (node.material.name == "bulb") {
// 					node.material.metalness = 0;
// 					node.material.roughness = 0;
// 					node.material.emissive = new THREE.Color(0xffffff);
// 					node.material.emissiveIntensity = 2;
// 				}

// 				// curtain1
// 				if (node.material.name == "curtain1") {
// 					// node.material = new THREE.MeshBasicMaterial();
// 				}

// 				// perfume & book
// 				if (
// 					node.material.name == "perfume_white" ||
// 					node.material.name == "perfume_pink" ||
// 					node.material.name == "pic01" ||
// 					node.material.name == "pic02" ||
// 					node.material.name == "pic03" ||
// 					node.material.name == "pic04" ||
// 					node.material.name == "pic05"
// 				) {
// 					node.material.map.flipY = true; // flip the Y of image
// 					node.material.metalness = 0.3;
// 					node.material.roughness = 0;
// 					node.material.color = new THREE.Color(0xffffff);
// 				}
// 			}
// 		});

// 		scene.add(modelObj);
// 		models = gltf.scene;

// 		updateCubemap();

// 		// console.log(gltf.scene.children[0].children[0]);

// 		// // testing
// 		// sphere.visible = false;
// 		// cubeCamera2.update(renderer, scene);
// 		// sphere.visible = true;
// 	});
// }

function loadgltf() {
	loader = new GLTFLoader(loadingManager);
	var dracoLoader = new DRACOLoader();
	dracoLoader.setDecoderPath("js/libs/draco/gltf/");
	loader.setDRACOLoader(dracoLoader);
	// loader.setPath("models/livingroom/");

	loader.load("models/livingroom/Wall.gltf", function(gltf) {
		gltf.scene.traverse(function(node) {
			if (node.isMesh) {
				// node.material.side = THREE.DoubleSide;
				node.material.lightMap = lmwall;
				node.material.lightMapIntensity = 1;
				// node.material.map = null;
				node.material.aoMap = lmwall;
				node.material.aoMapIntensity = 1;
				node.material.color = new THREE.Color(0xffffff);
				node.material.roughness = 1;
				node.material.roughnessMap = null;
				node.material.metalness = 0;
				node.material.metalnessMap = null;
				node.material.needsUpdate = true;
			}
		});
		scene.add(gltf.scene);
		updateCubemap();
	});

	loader.load("models/livingroom/Sofa01.gltf", function(gltf) {
		gltf.scene.traverse(function(node) {
			if (node.isMesh) {
				node.material.lightMap = lmsofa01;
				node.material.aoMap = lmsofa01;
				node.material.aoMapIntensity = 0.5;
				node.material.color = new THREE.Color(0xffffff);
				node.material.roughness = 1;
				node.material.metalness = 0;
			}
		});
		scene.add(gltf.scene);
		updateCubemap();
	});

	loader.load("models/livingroom/DinningTable.gltf", function(gltf) {
		gltf.scene.traverse(function(node) {
			if (node.isMesh) {
				node.material.lightMap = lmtable;
				node.material.aoMap = lmtable;
				node.material.color = new THREE.Color(0xffffff);
				node.material.roughness = 1;
				node.material.metalness = 0;
			}
		});
		scene.add(gltf.scene);
		updateCubemap();
	});

	loader.load("models/livingroom/Props01.gltf", function(gltf) {
		gltf.scene.traverse(function(node) {
			if (node.isMesh) {
				node.material.lightMap = lmprops01;
				node.material.aoMap = lmprops01;
				node.material.color = new THREE.Color(0xffffff);
				node.material.roughness = 1;
				node.material.metalness = 0;
			}
		});
		scene.add(gltf.scene);
		updateCubemap();
	});

	loader.load("models/livingroom/Props02.gltf", function(gltf) {
		gltf.scene.traverse(function(node) {
			if (node.isMesh) {
				node.material.lightMap = null;
				node.material.aoMap = null;
				node.material.color = new THREE.Color(0xffffff);
				node.material.roughness = 1;
				node.material.metalness = 1;
			}
		});
		scene.add(gltf.scene);
		updateCubemap();
	});

	// loader.load("models/bedroom_out/bedroom.gltf", function(gltf) {
	// 	gltf.scene.traverse(function(node) {
	// 		if (node.isMesh) {
	// 			node.material.lightMap = lmroom;
	// 			node.material.aoMap = lmroom;
	// 			node.material.color = new THREE.Color(0xffffff);
	// 			node.material.roughness = 1;
	// 			node.material.metalness = 0;
	// 		}
	// 	});
	// 	scene.add(gltf.scene);
	// 	updateCubemap();
	// });
}

// function testloadgltf() {
// 	loader = new GLTFLoader(loadingManager);
// 	var dracoLoader = new DRACOLoader();
// 	dracoLoader.setDecoderPath("js/libs/draco/gltf/");
// 	loader.setDRACOLoader(dracoLoader);
// 	loader.setPath("models/livingroom/");

// 	loader.load("living.glb", function(gltf) {
// 		modelObj = gltf.scene.children[0];
// 		// 0=Props02, 1=Props01, 2=Wall, 3=DinngTable, 4=Sofa01

// 		modelObj.children[0].traverse(function(node) {
// 			if (node.isMesh) {
// 				node.material.lightMap = null;
// 			}
// 		});

// 		modelObj.children[1].traverse(function(node) {
// 			if (node.isMesh) {
// 				node.material.lightMap = null;
// 			}
// 		});

// 		modelObj.children[2].traverse(function(node) {
// 			if (node.isMesh) {
// 				node.material.lightMap = lmwall;
// 				node.material.needsUpdate = true;
// 			}
// 		});

// 		modelObj.children[3].traverse(function(node) {
// 			if (node.isMesh) {
// 				node.material.lightMap = lmtable;
// 			}
// 		});

// 		modelObj.children[4].traverse(function(node) {
// 			if (node.isMesh) {
// 				node.material.lightMap = lmsofa01;
// 			}
// 		});

// 		modelObj.traverse(function(node) {
// 			if (node.isMesh) {
// 				console.log(node);
// 				node.material.color = new THREE.Color(0xffffff);
// 				node.material.map = null;
// 				// node.material.roughness = 1;
// 				// node.material.roughnessMap = null;
// 				// node.material.metalness = 0;
// 				// node.material.metalnessMap = null;
// 				// node.material.envMap = bg;
// 			}
// 		});

// 		// console.log(modelObj);

// 		scene.add(modelObj);
// 		// models = gltf.scene;

// 		// updateCubemap();
// 	});
// }

/* -------------------------------------------------------------------------- */
/*                             NOTE updateCubemap                             */
/* -------------------------------------------------------------------------- */
function updateCubemap() {
	if (scene) {
		scene.traverse(function(node) {
			if (node.isMesh) {
				// sofa
				if (
					node.material.name == "sofa" ||
					node.material.name == "pled" ||
					node.material.name == "Multi Linen Oatmeal"
				) {
					var rough = new THREE.TextureLoader().load(
						"models/livingroom/rough.jpg",
						function(e) {
							e.encoding = THREE.sRGBEncoding;
							e.flipY = false;
							// e.anisotropy = 1;
							e.wrapS = THREE.RepeatWrapping;
							e.wrapT = THREE.RepeatWrapping; //wrapS=U wrapT=V
							e.repeat.set(2, 2); //(U,V)repeat
						}
					);
					var diff = new THREE.TextureLoader().load(
						"models/livingroom/fabr.jpg",
						function(e) {
							e.encoding = THREE.sRGBEncoding;
							e.flipY = false;
							e.wrapS = THREE.RepeatWrapping;
							e.wrapT = THREE.RepeatWrapping; //wrapS=U wrapT=V
							e.repeat.set(2, 2); //(U,V)repeat
						}
					);
					node.material.map = diff;
					node.material.roughnessMap = rough;
					node.material.bumpMap = rough;
					node.material.bumpScale = 0.003;
					node.material.metalness = 0;
					// node.material.roughness = 0.95;
				}

				// wood
				if (node.material.name == "wood") {
					var rough = new THREE.TextureLoader().load(
						"models/livingroom/cmppmax_v2_9_4_2_g2.jpg",
						function(e) {
							// e.encoding = THREE.sRGBEncoding;
							e.flipY = false;
							e.wrapS = e.wrapT = THREE.RepeatWrapping; //wrapS=U wrapT=V
							e.repeat.set(1, 1); //(U,V)repeat
						}
					);
					// node.material.roughnessMap = rough;
					node.material.bumpMap = rough;
					node.material.bumpScale = 0.005;
					node.material.metalness = 0;
					node.material.roughness = 0.8;
				}

				// wood_black dinnging table legs
				if (node.material.name == "wood_black") {
					var diff = new THREE.TextureLoader().load(
						"models/livingroom/Arch_056_001_wood.jpg",
						function(e) {
							e.encoding = THREE.sRGBEncoding;
							e.flipY = false;
							e.wrapS = e.wrapT = THREE.RepeatWrapping; //wrapS=U wrapT=V
							e.repeat.set(1, 1); //(U,V)repeat
						}
					);
					var rough = new THREE.TextureLoader().load(
						"models/livingroom/Arch_056_001_wood_rough.jpg",
						function(e) {
							// e.encoding = THREE.sRGBEncoding;
							e.flipY = false;
							e.wrapS = e.wrapT = THREE.RepeatWrapping; //wrapS=U wrapT=V
							e.repeat.set(1, 1); //(U,V)repeat
						}
					);
					node.material.roughnessMap = rough;
					node.material.map = diff;
					node.material.bumpMap = rough;
					node.material.bumpScale = 0.001;
					node.material.metalness = 0;
					// node.material.roughness = 0.6;
				}

				// wood_table
				if (node.material.name == "wood_table") {
					var rough = new THREE.TextureLoader().load(
						"models/livingroom/woodrt.jpg",
						function(e) {
							// e.encoding = THREE.sRGBEncoding;
							e.flipY = false;
							e.wrapS = e.wrapT = THREE.RepeatWrapping; //wrapS=U wrapT=V
							e.repeat.set(1, 1); //(U,V)repeat
						}
					);
					node.material.roughnessMap = rough;
					// node.material.bumpMap = rough;
					// node.material.bumpScale = 0.005;
					node.material.metalness = 0;
					node.material.roughness = 1;
				}

				// Mirror_flower
				if (node.material.name == "Mirror_flower") {
					var rough = new THREE.TextureLoader().load(
						"models/livingroom/d-1hb.jpg",
						function(e) {
							e.encoding = THREE.LinearFilter;
							e.flipY = true;
							// e.anisotropy = 16;
							e.wrapS = e.wrapT = THREE.RepeatWrapping; //wrapS=U wrapT=V
							e.repeat.set(1, 1); //(U,V)repeat
						}
					);
					node.material.map = null;
					// node.material.color = new THREE.Color(0x8c8c8c);
					node.material.metalness = 0.85;
					node.material.roughnessMap = rough;
					// node.material.bumpMap = rough;
					// node.material.bumpScale = 0.003;
					node.material.roughness = 0.3;
					node.material.clearcoat = 1;
					node.material.clearcoatRoughness = 0.1;
					node.material.needsUpdate = true;
				}

				// Mirror
				if (node.material.name == "Mirror") {
					node.material.metalness = 1;
					node.material.roughness = 0.3;
					node.material.clearcoat = 1;
					node.material.clearcoatRoughness = 0.1;
					node.material.needsUpdate = true;
				}

				// chrome
				if (node.material.name == "chrome") {
					node.material.metalness = 1;
					node.material.roughness = 0.3;
					node.material.clearcoat = 1;
					node.material.clearcoatRoughness = 0.1;
					node.material.needsUpdate = true;
				}

				// black
				if (
					node.material.name == "Black" ||
					node.material.name == "screen_laptop" ||
					node.material.name == "black_leg" ||
					node.material.name == "Black Mirror" ||
					node.material.name == "Screen" ||
					node.material.name == "screen"
				) {
					node.material.metalness = 0;
					node.material.roughness = 0.2;
					node.material.color = new THREE.Color(0.03, 0.03, 0.03);
				}

				// White
				if (node.material.name == "White") {
					node.material.metalness = 0;
					node.material.roughness = 0.4;
				}

				// stone
				if (
					node.material.name == "stone01" ||
					node.material.name == "Stone02" ||
					node.material.name == "Stone03"
				) {
					node.material.metalness = 0;
					node.material.roughness = 0.3;
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

				// gold
				if (node.material.name == "Gold1") {
					node.material.color = new THREE.Color(0xd9843b);
					node.material.envMapIntensity = 1;
					node.material.metalness = 0.9;
					node.material.roughness = 0.1;
					node.material.clearcoat = 1;
					node.material.clearcoatRoughness = 0.1;
					// node.material.normalMap = normalMap3;
					// node.material.normalScale = new THREE.Vector2(0.5, 0.5);
				}
				node.material.envMap = bg;
			}
		});

		spriteGroup.visible = false;
		cubeCamFinal.update(renderer, scene);
		cubeCamera2.update(renderer, scene);
		// cubeCamera1.update(renderer, scene);
		spriteGroup.visible = true;

		scene.traverse(function(node) {
			if (node.isMesh) {
				// node.material.map = null; //临时关掉所有贴图
				node.material.envMap = cubemapFinal;
				if (node.material.name == "Mirror_flower") {
					node.material.envMap = cubemap2; //镜子新反射
				}
			}
		});
	}
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
	requestAnimationFrame(animate);
	renderer.info.reset();
	renderer.render(scene, camera);
	// composer.render();
	// console.log(renderer.info.render);
	stats.update();
}

function onTransitionEnd(event) {
	event.target.remove();
}

/* -------------------------------------------------------------------------- */
/*                      NOTE ID button changing function                      */
/* -------------------------------------------------------------------------- */
// var night = document.getElementById("night");
// night.addEventListener("click", changeNight);

// var day = document.getElementById("day");
// day.addEventListener("click", changeDay);

// /* example change texture
// function changeWood() {
// 	new THREE.TextureLoader().load("textures/stone.jpg", function(woodTex) {
// 		woodTex.encoding = THREE.sRGBEncoding;
// 		woodTex.flipY = true;
// 		modelObj.traverse(function(node) {
// 			if (node.isMesh) {
// 				if (node.material.name == "chrome") {
// 					// Do this
// 					node.material.needsUpdate = true;
// 					node.material.map = woodTex;
// 					node.material.lightMap = lmroom;
// 					node.material.lightMapIntensity = 1;
// 					node.material.metalness = 0;
// 					node.material.roughness = 0.3;
// 				}
// 			}
// 		});
// 	});
// }
// */

// function changeNight() {
// 	modelObj.traverse(function(node) {
// 		if (node.isMesh) {
// 			node.material.lightMap = lmnight;
// 			node.material.aoMap = lmnight;
// 			node.material.aoMapIntensity = 1;
// 		}
// 	});

// 	updateCubemap();
// } //change night view

// function changeDay() {
// 	modelObj.traverse(function(node) {
// 		if (node.isMesh) {
// 			node.material.lightMap = lmroom;
// 			node.material.aoMap = lmroom;
// 			node.material.aoMapIntensity = 1;
// 		}
// 	});
// 	updateCubemap();
// } //change day view

// /* ------------------------- outline change texture ------------------------- */
// // var raycaster = new THREE.Raycaster();
// // var mouse = new THREE.Vector2();
// // var intersects;

// // renderer.domElement.addEventListener("mousedown", onClick); //mousedown避开了mouseup时触发事件

// // function onClick(event) {
// // 	mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
// // 	mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

// // 	raycaster.setFromCamera(mouse, camera);
// // 	intersects = raycaster.intersectObjects(outlineObjects, true); //这里`outlineObjects`变量就是发光轮廓的物体集合,或者scene.children改变所有
// // 	if (intersects.length > 0) {
// // 		//点击发光物体后,改变材质
// // 		console.log("clicked");
// // 		changeWood();
// // 	}
// // }

// /* -------------------------------------------------------------------------- */
// /*                                 NOTE sprite                                */
// /* -------------------------------------------------------------------------- */
var spriteMap = new THREE.TextureLoader().load("textures/pick64x64.png");
var spriteMaterial = new THREE.SpriteMaterial({
	map: spriteMap,
	sizeAttenuation: true
}); //统一所有sprite材质

var spriteGroup = new THREE.Group();
scene.add(spriteGroup); //该组用于容纳所有sprite

var size = 0.1;
var marker01 = new THREE.Sprite(spriteMaterial);
marker01.scale.set(size, size, size);
marker01.position.set(2, 1, -5.5);
marker01.name = "marker01";
spriteGroup.add(marker01);

var marker02 = new THREE.Sprite(spriteMaterial);
marker02.scale.set(size, size, size);
marker02.position.set(2, 2, -5.5);
marker02.name = "marker02";
spriteGroup.add(marker02);

var selected = null;
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var touch = new THREE.Vector2();
// var objects = [marker01, marker02];
var objects = spriteGroup.children; //选择sprite group里的所有sprite物体
var intersects = [];

renderer.domElement.addEventListener("click", onClick, false);
renderer.domElement.addEventListener("touchstart", onTouchstart, false);

function onTouchstart(event) {
	event.preventDefault();
	touch.x = (event.touches[0].pageX / window.innerWidth) * 2 - 1;
	touch.y = -(event.touches[0].pageY / window.innerHeight) * 2 + 1;
	raycaster.setFromCamera(touch, camera);
	intersects = raycaster.intersectObjects(objects);
	if (intersects.length > 0) {
		selected = intersects[0].object;

		//do something if "marker01" is selected
		if (selected.name == "marker01") {
			var x = document.getElementById("littleMenu");
			if (x.style.display === "none") {
				x.style.display = "block";
			} else {
				x.style.display = "none";
			}
		}
	}
}

function onClick(event) {
	mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
	mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

	raycaster.setFromCamera(mouse, camera);
	intersects = raycaster.intersectObjects(objects);
	if (intersects.length > 0) {
		selected = intersects[0].object;

		//do something if "marker01" is selected
		if (selected.name == "marker01") {
			var x = document.getElementById("littleMenu");
			if (x.style.display === "none") {
				x.style.display = "block";
			} else {
				x.style.display = "none";
			}
		}
	}
}

// var selectedObject = null;
// window.addEventListener("mousedown", onDocumentMouseMove, false);
// function onDocumentMouseMove(event) {
// 	event.preventDefault();
// 	if (selectedObject) {
// 		selectedObject.material.color.set("#fff");
// 		selectedObject = null;
// 	}

// 	var raycaster = new THREE.Raycaster();
// 	var mouseVector = new THREE.Vector3();

// 	function getIntersects(x, y) {
// 		x = (x / window.innerWidth) * 2 - 1;
// 		y = -(y / window.innerHeight) * 2 + 1;
// 		mouseVector.set(x, y, 0.5);
// 		raycaster.setFromCamera(mouseVector, camera);
// 		return raycaster.intersectObject(marker01, true);
// 	}

// 	var intersects = getIntersects(event.layerX, event.layerY);

// 	console.log(intersects);

// 	if (intersects.length > 0) {
// 		var res = intersects.filter(function(res) {
// 			return res && res.object;
// 		})[0];

// 		if (res && res.object) {
// 			selectedObject = res.object;
// 			selectedObject.material.color.set("#ff0");
// 		}
// 	}
// 	console.log(selectedObject);
// }
