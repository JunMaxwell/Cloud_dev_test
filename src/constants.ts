export const MESH_NAME = {
    CUBE: "Cube",
    ICOSPHERE: "IcoSphere",
    CYLINDER: "Cylinder",
}

export const GRAVITY = -9.81
export const coefficientOfRestitution = 0.9;
export const FRAMERATE = 30;

export type MeshData = {
	radius?: number,
	subdivisions?: number, 
	width?: number,
	height?: number,
	depth?: number,
	diameter?: number,
}
