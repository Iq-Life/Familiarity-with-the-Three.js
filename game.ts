import { PerspectiveCamera, Scene, WebGLRenderer } from "three";

export const scene = new Scene()
export const camera = new PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
)

// Рендер three
let renderer: WebGLRenderer