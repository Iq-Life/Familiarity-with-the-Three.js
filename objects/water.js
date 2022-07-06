import {
    Color,
    FrontSide,
    Matrix4,
    Mesh,
    PerspectiveCamera,
    Plane,
    ShaderMaterial,
    UniformsLib,
    UniformsUtils,
    Vector3,
    Vector4,
    WebGLRenderTarget,
} from 'three'

/*
 * Работа на основе :
 * https://github.com/Slayvin: Плоское зеркало для three.js
 * https://home.adelphi.edu/~stemkoski/ : Реализация шейдера воды на основе плоского зеркала
 * http://29a.ch/ && http://29a.ch/slides/2012/webglwater/ : Объяснения шейдеров воды в WebGL
 */

class Water extends Mesh {
    constructor(geometry, options = {}) {
        super(geometry)

        this.isWater = true

        const scope = this

        const textureWidth =
            options.textureWidth !== undefined ? options.textureWidth : 512
        const textureHeight =
            options.textureHeight !== undefined ? options.textureHeight : 512

        const clipBias = options.clipBias !== undefined ? options.clipBias : 0.0
        const alpha = options.alpha !== undefined ? options.alpha : 1.0
        const time = options.time !== undefined ? options.time : 0.0
        const normalSampler =
            options.waterNormals !== undefined ? options.waterNormals : null
        const sunDirection =
            options.sunDirection !== undefined
                ? options.sunDirection
                : new Vector3(0.70707, 0.70707, 0.0)
        const sunColor = new Color(
            options.sunColor !== undefined ? options.sunColor : 0xffffff
        )
        const waterColor = new Color(
            options.waterColor !== undefined ? options.waterColor : 0x7f7f7f
        )
        const eye =
            options.eye !== undefined ? options.eye : new Vector3(0, 0, 0)
        const distortionScale =
            options.distortionScale !== undefined
                ? options.distortionScale
                : 20.0
        const side = options.side !== undefined ? options.side : FrontSide
        const fog = options.fog !== undefined ? options.fog : false

        //

        const mirrorPlane = new Plane()
        const normal = new Vector3()
        const mirrorWorldPosition = new Vector3()
        const cameraWorldPosition = new Vector3()
        const rotationMatrix = new Matrix4()
        const lookAtPosition = new Vector3(0, 0, -1)
        const clipPlane = new Vector4()

        const view = new Vector3()
        const target = new Vector3()
        const q = new Vector4()

        const textureMatrix = new Matrix4()

        const mirrorCamera = new PerspectiveCamera()

        const renderTarget = new WebGLRenderTarget(textureWidth, textureHeight)

        const mirrorShader = {
            uniforms: UniformsUtils.merge([
                UniformsLib['fog'],
                UniformsLib['lights'],
                {
                    normalSampler: { value: null },
                    mirrorSampler: { value: null },
                    alpha: { value: 1.0 },
                    time: { value: 0.0 },
                    size: { value: 1.0 },
                    distortionScale: { value: 20.0 },
                    textureMatrix: { value: new Matrix4() },
                    sunColor: { value: new Color(0x7f7f7f) },
                    sunDirection: { value: new Vector3(0.70707, 0.70707, 0) },
                    eye: { value: new Vector3() },
                    waterColor: { value: new Color(0x555555) },
                },
            ]),
        }

        const material = new ShaderMaterial({
            fragmentShader: mirrorShader.fragmentShader,
            vertexShader: mirrorShader.vertexShader,
            uniforms: UniformsUtils.clone(mirrorShader.uniforms),
            lights: true,
            side: side,
            fog: fog,
        })

        material.uniforms['mirrorSampler'].value = renderTarget.texture
        material.uniforms['textureMatrix'].value = textureMatrix
        material.uniforms['alpha'].value = alpha
        material.uniforms['time'].value = time
        material.uniforms['normalSampler'].value = normalSampler
        material.uniforms['sunColor'].value = sunColor
        material.uniforms['waterColor'].value = waterColor
        material.uniforms['sunDirection'].value = sunDirection
        material.uniforms['distortionScale'].value = distortionScale

        material.uniforms['eye'].value = eye

        scope.material = material

        scope.onBeforeRender = function (renderer, scene, camera) {
            mirrorWorldPosition.setFromMatrixPosition(scope.matrixWorld)
            cameraWorldPosition.setFromMatrixPosition(camera.matrixWorld)

            rotationMatrix.extractRotation(scope.matrixWorld)

            normal.set(0, 0, 1)
            normal.applyMatrix4(rotationMatrix)

            view.subVectors(mirrorWorldPosition, cameraWorldPosition)

            // Избегайте рендеринга, когда зеркало обращено в сторону

            if (view.dot(normal) > 0) return

            view.reflect(normal).negate()
            view.add(mirrorWorldPosition)

            rotationMatrix.extractRotation(camera.matrixWorld)

            lookAtPosition.set(0, 0, -1)
            lookAtPosition.applyMatrix4(rotationMatrix)
            lookAtPosition.add(cameraWorldPosition)

            target.subVectors(mirrorWorldPosition, lookAtPosition)
            target.reflect(normal).negate()
            target.add(mirrorWorldPosition)

            mirrorCamera.position.copy(view)
            mirrorCamera.up.set(0, 1, 0)
            mirrorCamera.up.applyMatrix4(rotationMatrix)
            mirrorCamera.up.reflect(normal)
            mirrorCamera.lookAt(target)

            mirrorCamera.far = camera.far // Использовать в WebGLBackground

            mirrorCamera.updateMatrixWorld()
            mirrorCamera.projectionMatrix.copy(camera.projectionMatrix)

            // Обновление матрицы текстур
            textureMatrix.set(
                0.5,
                0.0,
                0.0,
                0.5,
                0.0,
                0.5,
                0.0,
                0.5,
                0.0,
                0.0,
                0.5,
                0.5,
                0.0,
                0.0,
                0.0,
                1.0
            )
            textureMatrix.multiply(mirrorCamera.projectionMatrix)
            textureMatrix.multiply(mirrorCamera.matrixWorldInverse)

            // Теперь обновите матрицу проекции новой плоскостью отсечения, реализуя код из: http://www.terathon.com/code/oblique.html
            // Шаблон, объясняющий эту технику: http://www.terathon.com/lengyel/Lengyel-Oblique.pdf
            mirrorPlane.setFromNormalAndCoplanarPoint(
                normal,
                mirrorWorldPosition
            )
            mirrorPlane.applyMatrix4(mirrorCamera.matrixWorldInverse)

            clipPlane.set(
                mirrorPlane.normal.x,
                mirrorPlane.normal.y,
                mirrorPlane.normal.z,
                mirrorPlane.constant
            )

            const projectionMatrix = mirrorCamera.projectionMatrix

            q.x =
                (Math.sign(clipPlane.x) + projectionMatrix.elements[8]) /
                projectionMatrix.elements[0]
            q.y =
                (Math.sign(clipPlane.y) + projectionMatrix.elements[9]) /
                projectionMatrix.elements[5]
            q.z = -1.0
            q.w =
                (1.0 + projectionMatrix.elements[10]) /
                projectionMatrix.elements[14]

            // Вычислить масштабированный вектор плоскости
            clipPlane.multiplyScalar(2.0 / clipPlane.dot(q))

            // Замена третьей строки матрицы проекции
            projectionMatrix.elements[2] = clipPlane.x
            projectionMatrix.elements[6] = clipPlane.y
            projectionMatrix.elements[10] = clipPlane.z + 1.0 - clipBias
            projectionMatrix.elements[14] = clipPlane.w

            eye.setFromMatrixPosition(camera.matrixWorld)

            // Отрисовка

            const currentRenderTarget = renderer.getRenderTarget()

            const currentXrEnabled = renderer.xr.enabled
            const currentShadowAutoUpdate = renderer.shadowMap.autoUpdate

            scope.visible = false

            renderer.xr.enabled = false // Избегайте модификации камеры и рекурсии
            renderer.shadowMap.autoUpdate = false // Избегайте повторного вычисления теней

            renderer.setRenderTarget(renderTarget)

            renderer.state.buffers.depth.setMask(true) // убедитесь, что буфер глубины доступен для записи, чтобы его можно было правильно очистить, см. # 18897

            if (renderer.autoClear === false) renderer.clear()
            renderer.render(scene, mirrorCamera)

            scope.visible = true

            renderer.xr.enabled = currentXrEnabled
            renderer.shadowMap.autoUpdate = currentShadowAutoUpdate

            renderer.setRenderTarget(currentRenderTarget)

            // Восстановить область просмотра

            const viewport = camera.viewport

            if (viewport !== undefined) {
                renderer.state.viewport(viewport)
            }
        }
    }
}

export { Water }
