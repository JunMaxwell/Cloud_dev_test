import { Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3, MeshBuilder, Quaternion, Mesh, Matrix, Geometry, VertexData, StandardMaterial, Color3, CannonJSPlugin, PhysicsImpostor, Animation, Animatable, AbstractMesh, TransformNode } from 'babylonjs';
import lilGUI from 'lil-gui';
import * as CANNON from "cannon";
import { MESH_NAME, GRAVITY, MeshData, coefficientOfRestitution, FRAMERATE } from './src/constants';

let activeScene = localStorage.getItem("activeScene") ?? "1";
const canvas = document.getElementById("canvas");
if (!(canvas instanceof HTMLCanvasElement)) throw new Error("Couldn't find a canvas. Abortingravitythe demo")

const engine = new Engine(canvas, true, {});
let scene = new Scene(engine);

let icoData: MeshData = { radius: 1, subdivisions: 1 }
let cubeData: MeshData = { width: 1, height: 1, depth: 1 }
let cylinderData: MeshData = { height: 1, diameter: 1 };
// Physics
let simulatingPhysics = false;
let physicEngine: CannonJSPlugin;

let sphere: AbstractMesh;
let activeBall: AbstractMesh;
let animTable: Animatable;

const animationAttr = {
	amplitude: 1,
	duration: 1,
	applyBouncing: () => {
		if (!activeBall) return;
		applyBouncingAnimation(activeBall, animationAttr.amplitude, animationAttr.duration);
	},
	reset: () => {
		if (!activeBall) return;
		activeBall.position.set(activeBall.position.x, animationAttr.amplitude, activeBall.position.z);
	}
}

const physicAttr = {
	amplitude: 1,
	duration: 1,
	applyBouncing: () => {
		simulatingPhysics = true;
	},
	reset: () => {
		simulatingPhysics = false;
		if (sphere.physicsImpostor) sphere.physicsImpostor.dispose();
		sphere.position.set(0, physicAttr.amplitude, 0);
	}
}

let panel = new lilGUI();
let sceneBtn = {
	"task 1": function () {
		scene.dispose();
		simulatingPhysics = false;
		scene.physicsEnabled = false;
		scene._physicsEngine = null;
		scene = new Scene(engine);
		prepareScene1(scene);
	},
	"task 2: Animation Frames": function () {
		scene.dispose();
		simulatingPhysics = false;
		scene.physicsEnabled = false;
		scene._physicsEngine = null;
		scene = new Scene(engine);
		prepareScene2(scene);
	},
	"task 2: Physics": function () {
		scene.dispose();
		simulatingPhysics = false;
		scene.physicsEnabled = false;
		scene._physicsEngine = null;
		scene = new Scene(engine);
		prepareScene3(scene);
	}
}
panel.add(sceneBtn, "task 1");
panel.add(sceneBtn, "task 2: Animation Frames");
panel.add(sceneBtn, "task 2: Physics");

function prepareScene1(scene: Scene) {
	disposeGUIFolders();
	localStorage.setItem("activeScene", "1");
	// Camera
	const camera = new ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2.5, 4, new Vector3(0, 0, 0), scene);
	camera.attachControl(canvas, true);

	// Light
	new HemisphericLight("light", new Vector3(0.5, 1, 0.8).normalize(), scene);

	// Objects
	const cube = MeshBuilder.CreateBox(MESH_NAME.CUBE, {}, scene);
	cube.rotationQuaternion = Quaternion.FromEulerAngles(0, Math.PI, 0);

	const icosphere = MeshBuilder.CreateIcoSphere(MESH_NAME.ICOSPHERE, { updatable: true }, scene);
	icosphere.position.set(-2, 0, 0);

	const cylinder = MeshBuilder.CreateCylinder(MESH_NAME.CYLINDER, {}, scene);
	cylinder.position.set(2, 0, 0);

	scene.onPointerDown = () => {
		var ray = scene.createPickingRay(scene.pointerX, scene.pointerY, Matrix.Identity(), scene.activeCamera);

		var hit = scene.pickWithRay(ray);

		if (hit?.pickedMesh && hit.pickedMesh instanceof Mesh) {
			meshController(hit.pickedMesh);
		}
	}

	return { cube, icosphere, cylinder };
}

function prepareScene2(scene: Scene) {
	disposeGUIFolders();
	localStorage.setItem("activeScene", "2");
	// Camera
	const camera = new ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2.5, 4, new Vector3(0, 0, 0), scene);
	camera.attachControl(canvas, true);

	// Light
	new HemisphericLight("light", new Vector3(0.5, 1, 0.8).normalize(), scene);

	// Create Red Sphere
	const redSphere = MeshBuilder.CreateSphere("redSphere", { diameter: 1 }, scene);
	redSphere.position.set(2, 1, 0);
	const material = new StandardMaterial("material", scene);
	material.diffuseColor = Color3.Red();
	redSphere.material = material;

	// Create Green Sphere
	const greenSphere = MeshBuilder.CreateSphere("greenSphere", { diameter: 1 }, scene);
	greenSphere.position.set(-2, 1, 0);
	const material2 = new StandardMaterial("material2", scene);
	material2.diffuseColor = Color3.Green();
	greenSphere.material = material2;

	// Create Ground plane
	const ground = MeshBuilder.CreateGround("ground", { width: 10, height: 10 }, scene);
	ground.position.set(0, -0.5, 0);
	const groundMaterial = new StandardMaterial("groundMaterial", scene);
	groundMaterial.diffuseColor = Color3.Gray();
	ground.material = groundMaterial;

	const SimulationController = panel.addFolder("Simulation");
	SimulationController.add(animationAttr, "amplitude", 0, 10).step(1).onChange((value: number) => {
		if (!activeBall) return;
		activeBall.position.y = value;
	});
	SimulationController.add(animationAttr, "duration", 0, 10).step(1);
	SimulationController.add(animationAttr, "applyBouncing");
	SimulationController.add(animationAttr, "reset");

	scene.onPointerDown = () => {
		var ray = scene.createPickingRay(scene.pointerX, scene.pointerY, Matrix.Identity(), scene.activeCamera);

		var hit = scene.pickWithRay(ray);

		if (hit?.pickedMesh && hit.pickedMesh instanceof Mesh && hit.pickedMesh.name !== "ground") {
			activeBall = hit.pickedMesh;
			outlineObject(hit.pickedMesh)
		}
	}

	return { ground, redSphere, greenSphere }
}

function prepareScene3(scene: Scene) {
	disposeGUIFolders();
	localStorage.setItem("activeScene", "3");
	physicEngine = new CannonJSPlugin(false, 10, CANNON);
	physicEngine.setTimeStep(1 / (physicAttr.duration * 15))
	scene.enablePhysics(new Vector3(0, GRAVITY, 0), physicEngine);

	// Camera
	const camera = new ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2.5, 4, new Vector3(0, 0, 0), scene);
	camera.attachControl(canvas, true);

	// Light
	new HemisphericLight("light", new Vector3(0.5, 1, 0.8).normalize(), scene);

	// Create Blue sphere
	sphere = MeshBuilder.CreateSphere("sphere", { diameter: 1 }, scene);
	sphere.position.set(0, physicAttr.amplitude, 0);
	const material = new StandardMaterial("material", scene);
	material.diffuseColor = Color3.Blue();
	sphere.material = material;

	// Create Physic ground
	const ground = MeshBuilder.CreateGround("ground", { width: 6, height: 6 }, scene);
	ground.position.set(0, -1, 0);
	ground.physicsImpostor = new PhysicsImpostor(ground, PhysicsImpostor.BoxImpostor, { mass: 0, restitution: coefficientOfRestitution }, scene);

	const physicController = panel.addFolder("Simulation");
	physicController.add(physicAttr, "amplitude", 0, 10).step(1).onChange((value: number) => {
		sphere.position.y = value;
	});
	physicController.add(physicAttr, "duration", 0, 10).step(1).onChange((value: number) => {
		scene.getPhysicsEngine()!.setTimeStep(1 / (value * 15));
	});
	physicController.add(physicAttr, "applyBouncing");
	physicController.add(physicAttr, "reset");

	return { ground, sphere }
}

switch (activeScene) {
	case "1":
		prepareScene1(scene);
		break;
	case "2":
		prepareScene2(scene);
		break;
	case "3":
		prepareScene3(scene);
		break;
}

engine.runRenderLoop(() => {
	if (simulatingPhysics && scene.getPhysicsEngine() !== null) {
		if (sphere) {
			if (!sphere.physicsImpostor || sphere.physicsImpostor.isDisposed) sphere.physicsImpostor = new PhysicsImpostor(sphere, PhysicsImpostor.SphereImpostor, { mass: 1, restitution: coefficientOfRestitution }, scene);
			// sphere.physicsImpostor.applyImpulse(new Vector3(0, 1, 0), sphere.getAbsolutePosition());
		}
		requestAnimationFrame(() => {
			scene.render();
		})
	} else {
		scene.render();
	}
});

window.addEventListener("resize", () => {
	engine.resize();
});

function meshController(mesh: Mesh) {
	disposeGUIFolders();
	const folder = panel.addFolder(mesh.name);
	outlineObject(mesh);
	switch (mesh.name) {
		case MESH_NAME.CUBE:
			{
				cubeData = {
					width: mesh.scaling.x,
					height: mesh.scaling.y,
					depth: mesh.scaling.z
				}
				folder.title("Cube");
				folder.add(cubeData, "width", 0, 10).onChange((value: number) => {
					mesh.scaling.x = value;
				});
				folder.add(cubeData, "height", 0, 10).onChange((value: number) => {
					mesh.scaling.y = value;
				});
				folder.add(cubeData, "depth", 0, 10).onChange((value: number) => {
					mesh.scaling.z = value;
				});
			}
			break;
		case MESH_NAME.ICOSPHERE:
			{
				folder.title("Icosphere");
				folder.add(icoData, "radius", 0.1, 2.0).step(0.1).onChange((value: number) => {
					updateGroupGeometry(mesh, CreateIcoSphereGeometry({ radius: value }));
				})
				folder.add(icoData, "subdivisions", 1, 10).step(1).onChange((value: number) => {
					updateGroupGeometry(mesh, CreateIcoSphereGeometry({ subdivisions: value }));
				})
			}
			break;
		case MESH_NAME.CYLINDER:
			{
				folder.title("Cylinder");
				folder.add(cylinderData, "height", 0.1, 2.0).step(0.1).onChange((value: number) => {
					updateGroupGeometry(mesh, CreateCylinderGeometry({ height: value }));
				});
				folder.add(cylinderData, "diameter", 0.1, 2.0).step(0.1).onChange((value: number) => {
					updateGroupGeometry(mesh, CreateCylinderGeometry({ diameter: value }));
				});
			}
	}
}

// Dispose a mesh geometry and update with new geometry
function updateGroupGeometry(mesh: Mesh, geometry: Geometry) {
	const vertexData = VertexData.ExtractFromGeometry(geometry);
	vertexData.applyToMesh(mesh);
}

// New IcosSphereGeometry from Data
function CreateIcoSphereGeometry(data: { radius?: number, subdivisions?: number }) {
	const geometry = new Geometry(MESH_NAME.ICOSPHERE, scene);
	geometry.setAllVerticesData(VertexData.CreateIcoSphere(data));
	return geometry;
}

// New CylinderGeometry from Data
function CreateCylinderGeometry(data: { height?: number, diameter?: number }) {
	const geometry = new Geometry(MESH_NAME.CYLINDER, scene);
	geometry.setAllVerticesData(VertexData.CreateCylinder(data));
	return geometry;
}

function outlineObject(pickedMesh: Mesh) {
	scene.meshes.forEach((mesh) => {
		if (mesh.renderOutline) mesh.renderOutline = false;
	});
	if (!pickedMesh.renderOutline)
		pickedMesh.renderOutline = true;
	else
		pickedMesh.renderOutline = false;
}

function disposeGUIFolders() {
	panel.folders.forEach(folder => {
		folder.destroy();
	});
}

function applyBouncingAnimation(transformNode: TransformNode, amplitude: number, duration: number) {
	let framerates = FRAMERATE * duration;
	transformNode.position.y = amplitude;
	const animation = new Animation("bounce", "position.y", framerates, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
	const keys = [];
	let startHeight: number = amplitude;
	let velocity: number = 0;
	let gravity: number = -GRAVITY;
	let currTime: number = 0;
	let dt: number = 1 / framerates;
	let contactTime: number = 0.1;
	let maxHeight: number = startHeight;
	let currHeight: number = startHeight;
	let stopHeight: number = 0.01;
	let freefall: boolean = true;
	let t_last: number = - Math.sqrt(2 * startHeight / gravity);
	let maxVelocity: number = Math.sqrt(2 * gravity * maxHeight);

	while (maxHeight > stopHeight) {
		if (freefall) {
			let hnew = currHeight + velocity * dt - 0.5 * gravity * dt * dt
			if (hnew < 0) {
				currTime = t_last + 2 * Math.sqrt(2 * maxHeight / gravity)
				freefall = false
				t_last = currTime + contactTime
				currHeight = 0
			} else {
				currTime = currTime + dt
				velocity = velocity - gravity * dt
				currHeight = hnew
			}
		}
		else {
			currTime = currTime + contactTime
			maxVelocity = maxVelocity * coefficientOfRestitution
			velocity = maxVelocity
			freefall = true
			currHeight = 0
		}
		maxHeight = 0.5 * maxVelocity * maxVelocity / gravity
		keys.push({ frame: currTime * framerates, value: currHeight });
	}

	animation.setKeys(keys);
	transformNode.animations = [];
	transformNode.animations.push(animation);
	scene.beginAnimation(transformNode, 0, 25 * framerates, false, (110 * amplitude) / framerates);
}