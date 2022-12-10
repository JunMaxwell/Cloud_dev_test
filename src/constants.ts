export const MESH_NAME = {
    CUBE: "Cube",
    ICOSPHERE: "IcoSphere",
    CYLINDER: "Cylinder",
}

export const GRAVITY = -9.81

export type MeshData = {
	radius?: number,
	subdivisions?: number, 
	width?: number,
	height?: number,
	depth?: number,
	diameter?: number,
}
