export const MESH_NAME = {
    CUBE: "Cube",
    ICOSPHERE: "IcoSphere",
    CYLINDER: "Cylinder",
}

export type IcoData = {
	radius?: number,
	subdivisions?: number
}
export type CubeData = {
	width?: number,
	height?: number,
	depth?: number
}
export type CylinderData = {
	height?: number,
	diameter?: number,
}
