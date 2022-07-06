import {
    ACESFilmicToneMapping,
    AnimationClip,
    AnimationMixer,
    Clock,
    Euler,
    Group,
    HemisphereLight,
    InterpolateSmooth,
    LoopOnce,
    MathUtils,
    Mesh,
    MirroredRepeatWrapping,
    PerspectiveCamera,
    PlaneGeometry,
    PMREMGenerator,
    Quaternion,
    QuaternionKeyframeTrack,
    Scene,
    ShaderMaterial,
    SpotLight,
    TextureLoader,
    Vector3,
    VectorKeyframeTrack,
    WebGLRenderer,
} from 'three'
import { Water } from './objects/water'

export const scene = new Scene()
export const camera = new PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
)

const waterGeometry = new PlaneGeometry(10000, 10000)

const water = new Water(waterGeometry, {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: new TextureLoader().load(
        'static/normals/waternormals.jpeg',
        function (texture) {
            texture.wrapS = texture.wrapT = MirroredRepeatWrapping
        }
    ),
    sunDirection: new Vector3(),
    sunColor: 0xffffff,
    waterColor: 0x001e0f,
    distortionScale: 3.7,
    fog: scene.fog !== undefined,
})

// Рендер three
let renderer: WebGLRenderer

// Инициализация сцены
async function init() {
    renderer = new WebGLRenderer()
    renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(renderer.domElement)
    water.rotation.x = -Math.PI / 2
    water.rotation.z = 0
    scene.add(water)
}

const animate = () => {
    requestAnimationFrame(animate)
    renderer.render(scene, camera)
}
