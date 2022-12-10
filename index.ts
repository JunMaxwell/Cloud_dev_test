import { Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3, MeshBuilder, Quaternion, Mesh, Matrix, Geometry, VertexData, StandardMaterial, Color3 } from 'babylonjs';
import lilGUI from 'lil-gui';
import { MESH_NAME, IcoData, CubeData, CylinderData } from './src/constants';

const canvas = document.getElementById("canvas");
if (!(canvas instanceof HTMLCanvasElement)) throw new Error("Couldn't find a canvas. Aborting the demo")

const engine = new Engine(canvas, true, {});

let panel = new lilGUI();
let icoData: IcoData = { radius: 1, subdivisions: 1 }
let cubeData: CubeData = { width: 1, height: 1, depth: 1 }
let cylinderData: CylinderData = { height: 1, diameter: 1 }
const scene = new Scene(engine);

function prepareScene(scene: Scene) {
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
}

prepareScene(scene);

scene.onPointerDown = () => {
	var ray = scene.createPickingRay(scene.pointerX, scene.pointerY, Matrix.Identity(), scene.activeCamera);

	var hit = scene.pickWithRay(ray);

	if (hit?.pickedMesh && hit.pickedMesh instanceof Mesh) {
		outlineObject(hit.pickedMesh);
		meshController(hit.pickedMesh);
	}
}

function meshController(mesh: Mesh) {
	panel.destroy();
	panel = new lilGUI();
	switch (mesh.name) {
		case MESH_NAME.CUBE:
			{
				cubeData = {
					width: mesh.scaling.x,
					height: mesh.scaling.y,
					depth: mesh.scaling.z
				}
				panel.title("Cube");
				panel.add(cubeData, "width", 0, 10).onChange((value: number) => {
					mesh.scaling.x = value;
				});
				panel.add(cubeData, "height", 0, 10).onChange((value: number) => {
					mesh.scaling.y = value;
				});
				panel.add(cubeData, "depth", 0, 10).onChange((value: number) => {
					mesh.scaling.z = value;
				});
			}
			break;
		case MESH_NAME.ICOSPHERE:
			{
				panel.title("Icosphere");
				panel.add(icoData, "radius", 0.1, 2.0).step(0.1).onChange((value: number) => {
					updateGroupGeometry(mesh, CreateIcoSphereGeometry({ radius: value }));
				})
				panel.add(icoData, "subdivisions", 1, 10).step(1).onChange((value: number) => {
					updateGroupGeometry(mesh, CreateIcoSphereGeometry({ subdivisions: value }));
				})
			}
			break;
		case MESH_NAME.CYLINDER:
			{
				panel.title("Cylinder");
				panel.add(cylinderData, "height", 0.1, 2.0).step(0.1).onChange((value: number) => {
					updateGroupGeometry(mesh, CreateCylinderGeometry({ height: value }));
				});
				panel.add(cylinderData, "diameter", 0.1, 2.0).step(0.1).onChange((value: number) => {
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

engine.runRenderLoop(() => {
	scene.render();
});

window.addEventListener("resize", () => {
	engine.resize();
});