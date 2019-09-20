/* -------------------------------------------------------------------------- */
/*                                NOTE variable                               */
/* -------------------------------------------------------------------------- */
let container, controls, stats;
let camera, scene, renderer;
let loadingManager;
let loader;
let mesh;
let clock, composer;
const lmwall = new THREE.TextureLoader().load("models/livingroom/Wall_LM.png");

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
	camera.position.set(12, 5, 2);
	scene = new THREE.Scene();

	/* --------------------------- NOTE loading screen -------------------------- */
	loadingManager = new THREE.LoadingManager(() => {
		const loadingScreen = document.getElementById("loading-screen");
		loadingScreen.classList.add("fade-out");
		loadingScreen.addEventListener("transitionend", onTransitionEnd); // optional: remove loader from DOM via event listener
	});

	/* ------------------------------ NOTE renderer ----------------------------- */
	renderer = new THREE.WebGLRenderer({
		preserveDrawingBuffer: true, // IMPORTANT!
		antialias: true
	});
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.gammaInput = true;
	renderer.gammaOutput = true;
	renderer.gammaFactor = 1.7;
	renderer.info.autoReset = false;
	renderer.toneMappingExposure = 1;
	renderer.toneMapping = THREE.Uncharted2ToneMapping;
	container.appendChild(renderer.domElement);

	// controls
	controls = new THREE.OrbitControls(camera, renderer.domElement);
	controls.target.set(4.5, 0, -4.2);
	controls.update();

	window.addEventListener("resize", onWindowResize, false);
	stats = new Stats(); // Add stats to page.
	document.body.appendChild(stats.dom);

	loadgltf();

	// post processing
	clock = new THREE.Clock();
	composer = new POSTPROCESSING.EffectComposer(renderer);

	const vignetteEffect = new POSTPROCESSING.VignetteEffect({ darkness: 0 });
	const renderPass = new POSTPROCESSING.RenderPass(scene, camera);
	const effectPass = new POSTPROCESSING.EffectPass(camera, vignetteEffect);
	effectPass.renderToScreen = true;

	composer.addPass(renderPass);
	composer.addPass(effectPass);
}

/* -------------------------------------------------------------------------- */
/*                              NOTE GLTF loader                              */
/* -------------------------------------------------------------------------- */
function loadgltf() {
	loader = new THREE.GLTFLoader(loadingManager);
	var dracoLoader = new THREE.DRACOLoader();
	dracoLoader.setDecoderPath("js/libs/draco/gltf/");
	loader.setDRACOLoader(dracoLoader);
	loader.load("models/livingroom/Wall.gltf", function(gltf) {
		gltf.scene.traverse(function(node) {
			if (node.isMesh) {
				node.material.lightMap = lmwall;
				node.material.color = new THREE.Color(0xffffff);
				node.material.roughness = 1;
				node.material.metalness = 0;
			}
		});
		scene.add(gltf.scene);
	});
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	// renderer.setSize(window.innerWidth, window.innerHeight);
	composer.setSize(window.innerWidth, window.innerHeight);
}

function onTransitionEnd(e) {
	e.target.remove();
}

function animate() {
	requestAnimationFrame(animate);
	renderer.info.reset();
	// renderer.render(scene, camera);
	composer.render(clock.getDelta());
	// composer.render(scene, camera);
	stats.update();
}
