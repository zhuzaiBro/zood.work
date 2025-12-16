'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function ThreeBackground() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // --- 配置 ---
    const PARTICLE_COUNT = 15000 // 粒子数量
    const PARTICLE_SIZE = 0.03   // 粒子大小
    const RADIUS = 4             // 基础半径范围

    // --- 初始化 Scene, Camera, Renderer ---
    const container = containerRef.current
    const scene = new THREE.Scene()
    // 添加一些环境雾效，让远处粒子淡出
    scene.fog = new THREE.FogExp2(0x000000, 0.03)

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100)
    camera.position.z = 8

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    // --- 生成粒子数据 ---
    // 我们预先计算好 4 种形态的所有顶点位置

    // 1. 随机分布 (Cosmos)
    const pos1 = new Float32Array(PARTICLE_COUNT * 3)
    // 2. 球体 (Sphere)
    const pos2 = new Float32Array(PARTICLE_COUNT * 3)
    // 3. 波浪 (Wave)
    const pos3 = new Float32Array(PARTICLE_COUNT * 3)
    // 4. 立方体 (Cube)
    const pos4 = new Float32Array(PARTICLE_COUNT * 3)

    // 当前渲染用的位置数组
    const currentPos = new Float32Array(PARTICLE_COUNT * 3)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3

      // --- 形态 1: 随机 ---
      pos1[i3] = (Math.random() - 0.5) * 30
      pos1[i3 + 1] = (Math.random() - 0.5) * 30
      pos1[i3 + 2] = (Math.random() - 0.5) * 30

      // 初始化 currentPos 为形态 1
      currentPos[i3] = pos1[i3]
      currentPos[i3 + 1] = pos1[i3 + 1]
      currentPos[i3 + 2] = pos1[i3 + 2]

      // --- 形态 2: 球体 ---
      // 使用球坐标公式
      const phi = Math.acos(-1 + (2 * i) / PARTICLE_COUNT)
      const theta = Math.sqrt(PARTICLE_COUNT * Math.PI) * phi

      pos2[i3] = RADIUS * Math.cos(theta) * Math.sin(phi)
      pos2[i3 + 1] = RADIUS * Math.sin(theta) * Math.sin(phi)
      pos2[i3 + 2] = RADIUS * Math.cos(phi)

      // --- 形态 3: 波浪平面 ---
      // 在 x-z 平面上分布，y 轴用正弦波
      const step = Math.sqrt(PARTICLE_COUNT) // 网格边长
      // const row = Math.floor(i / step)
      const row = Math.floor(i / step)
      const col = i % step
      // 归一化到 -1 ~ 1
      const u = (col / step) * 2 - 1
      const v = (row / step) * 2 - 1

      pos3[i3] = u * RADIUS * 2
      pos3[i3 + 2] = v * RADIUS * 1.5 // z轴铺开
      // y 轴根据距离产生波浪
      const dist = Math.sqrt(u * u + v * v)
      pos3[i3 + 1] = Math.sin(dist * 10) * 0.5

      // --- 形态 4: 立方体 ---
      // 简单的随机填充在立方体体积内，或者表面
      // 这里做成表面随机
      const face = Math.floor(Math.random() * 6)
      const uCube = (Math.random() - 0.5) * 2 * (RADIUS * 0.6)
      const vCube = (Math.random() - 0.5) * 2 * (RADIUS * 0.6)
      const wCube = RADIUS * 0.6 // 边长一半

      switch (face) {
        case 0:
          pos4[i3] = wCube
          pos4[i3 + 1] = uCube
          pos4[i3 + 2] = vCube
          break // right
        case 1:
          pos4[i3] = -wCube
          pos4[i3 + 1] = uCube
          pos4[i3 + 2] = vCube
          break // left
        case 2:
          pos4[i3] = uCube
          pos4[i3 + 1] = wCube
          pos4[i3 + 2] = vCube
          break // top
        case 3:
          pos4[i3] = uCube
          pos4[i3 + 1] = -wCube
          pos4[i3 + 2] = vCube
          break // bottom
        case 4:
          pos4[i3] = uCube
          pos4[i3 + 1] = vCube
          pos4[i3 + 2] = wCube
          break // front
        case 5:
          pos4[i3] = uCube
          pos4[i3 + 1] = vCube
          pos4[i3 + 2] = -wCube
          break // back
      }
    }

    // --- 创建 Geometry 和 Material ---
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(currentPos, 3))

    // 增加颜色属性，用于单独控制每个粒子的亮度
    const colors = new Float32Array(PARTICLE_COUNT * 3)
    const baseColor = new THREE.Color(0x44aaff)
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      colors[i * 3] = baseColor.r
      colors[i * 3 + 1] = baseColor.g
      colors[i * 3 + 2] = baseColor.b
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    // 简单的点材质
    const material = new THREE.PointsMaterial({
      size: PARTICLE_SIZE,
      vertexColors: true, // 启用顶点颜色
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    })

    const particles = new THREE.Points(geometry, material)
    scene.add(particles)

    // --- 滚动与插值逻辑 ---

    // 定义缓动函数 (Ease In Out Cubic)
    function easeInOutCubic(x: number) {
      return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
    }

    let targetScroll = 0
    let currentScroll = 0

    const handleScroll = () => {
      targetScroll = window.scrollY
    }
    window.addEventListener('scroll', handleScroll)

    // --- 鼠标交互逻辑 ---
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2(-9999, -9999) // 初始在屏幕外
    const mouseTarget3D = new THREE.Vector3()

    const handleMouseMove = (event: MouseEvent) => {
      // 归一化鼠标坐标 -1 到 1
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener('mousemove', handleMouseMove)

    // 存储每个粒子的瞬时速度/偏移量
    const velocities = new Float32Array(PARTICLE_COUNT * 3)

    // --- 动画循环 ---
    const clock = new THREE.Clock()
    let animationId: number

    function animate() {
      animationId = requestAnimationFrame(animate)

      const time = clock.getElapsedTime()

      // 0. 更新鼠标 3D 位置
      // 让 Raycaster 从相机射向鼠标方向
      raycaster.setFromCamera(mouse, camera)
      // raycaster.ray.at(8, mouseTarget3D)
      // camera.position.z 是 8，我们取 z=0 附近的平面，距离相机 8
      // 使用 ray.at 获取射线上的点
      raycaster.ray.at(8, mouseTarget3D)

      // 1. 平滑滚动数值 (简单的线性插值让滚动没那么生硬)
      currentScroll += (targetScroll - currentScroll) * 0.1

      // 2. 计算当前进度 (0 ~ 3)
      // 总高度 - 视口高度
      const maxScroll = document.body.scrollHeight - window.innerHeight
      // 归一化 0 ~ 1 (如果 maxScroll 为 0，防除零)
      const scrollFraction = maxScroll > 0 ? Math.max(0, Math.min(1, currentScroll / maxScroll)) : 0
      // 映射到 0 ~ 3 (因为有4个阶段，即3段过渡)
      const totalPhases = 3
      const globalProgress = scrollFraction * totalPhases

      // 确定当前在哪两个形态之间
      // phase 0: pos1 -> pos2
      // phase 1: pos2 -> pos3
      // phase 2: pos3 -> pos4
      let currentPhase = Math.floor(globalProgress)
      let phaseProgress = globalProgress - currentPhase

      // 边界处理
      if (currentPhase >= totalPhases) {
        currentPhase = totalPhases - 1
        phaseProgress = 1
      }

      // 3. 粒子位置插值 (Morphing)
      const positions = geometry.attributes.position.array as Float32Array

      // 获取源数组和目标数组
      let sourcePos, targetPos

      if (currentPhase === 0) {
        sourcePos = pos1
        targetPos = pos2
      } else if (currentPhase === 1) {
        sourcePos = pos2
        targetPos = pos3
      } else {
        sourcePos = pos3
        targetPos = pos4
      }

      // 应用缓动
      const t = easeInOutCubic(phaseProgress)

      // 鼠标排斥参数
      const mouseRadius = 1.5 // 鼠标影响半径
      const mouseForce = 2.0 // 排斥力度

      // 自动移动的光源参数 (舞台灯光)
      const spotLightRadius = 3.5 // 光照半径
      const highlightColor = new THREE.Color(0xffffff) // 高亮颜色 (白色)
      const normalColor = new THREE.Color(0x44aaff) // 正常颜色
      const colorAttribute = geometry.attributes.color as THREE.BufferAttribute
      
      // 光源当前位置 (不需要z，因为我们是在屏幕平面/2D投影上移动)
      // 不过为了计算3D距离，我们给它一个z值 (假设在粒子云前方)
      const lightPos = new THREE.Vector3(0, 0, 2) 

      // 遍历所有粒子进行混合 + 鼠标交互
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3

        // A. 计算形态插值后的 基础目标位置
        const targetX = sourcePos[i3] + (targetPos[i3] - sourcePos[i3]) * t
        const targetY = sourcePos[i3 + 1] + (targetPos[i3 + 1] - sourcePos[i3 + 1]) * t
        const targetZ = sourcePos[i3 + 2] + (targetPos[i3 + 2] - sourcePos[i3 + 2]) * t

        // 0. 更新光源位置 (让它做某种平滑的周期运动)
        // 使用不同的频率和相位，让运动轨迹看起来不那么规则 (利萨茹曲线的变体)
        lightPos.x = Math.sin(time * 0.5) * 4 + Math.cos(time * 1.2) * 2
        lightPos.y = Math.cos(time * 0.7) * 3 + Math.sin(time * 1.5) * 1.5
        // z 保持在前方或者微动
        lightPos.z = Math.sin(time * 0.3) * 2 + 2

        // B. 鼠标排斥物理模拟
        // 简易反旋转鼠标坐标到局部空间 (假设只绕 Y 和 X 转了一点点，主要处理 Y)
        const cosRy = Math.cos(-particles.rotation.y)
        const sinRy = Math.sin(-particles.rotation.y)

        // x' = x cos - z sin
        // z' = x sin + z cos
        const mx = mouseTarget3D.x * cosRy - mouseTarget3D.z * sinRy
        const my = mouseTarget3D.y // 忽略 X 轴旋转对 Y 的微小影响
        const mz = mouseTarget3D.x * sinRy + mouseTarget3D.z * cosRy

        const dx = targetX - mx
        const dy = targetY - my
        const dz = targetZ - mz

        const distSq = dx * dx + dy * dy + dz * dz

        // 如果在鼠标半径内
        if (distSq < mouseRadius * mouseRadius) {
          const dist = Math.sqrt(distSq)
          if (dist > 0.01) {
            // 避免除零
            // 归一化方向 * 力度 * (1 - 距离比例) -> 越近力越大
            const force = (1 - dist / mouseRadius) * mouseForce
            // 施加到速度上 (这里简单地直接修改偏移量 velocities)
            velocities[i3] += (dx / dist) * force * 0.1 // 0.1 是时间步长系数
            velocities[i3 + 1] += (dy / dist) * force * 0.1
            velocities[i3 + 2] += (dz / dist) * force * 0.1
          }
        }

        // B2. 舞台灯光逻辑 (基于距离)
        // 计算粒子(target位置)到光源(lightPos)的距离
        // 这里为了性能，我们可以在旋转后的局部空间做计算，或者假设光源也在局部空间移动
        // 简单起见，假设光源在世界坐标系移动，粒子也在世界坐标系(近似)
        // 实际上 particles 有 rotation，所以要把 lightPos 转换到局部空间，或者忽略 rotation 的影响(如果转得慢)
        // 既然前面算了 mx, my, mz (鼠标在局部空间的位置)，我们可以对 lightPos 做同样的变换
        
        const lx = lightPos.x * cosRy - lightPos.z * sinRy
        const ly = lightPos.y
        const lz = lightPos.x * sinRy + lightPos.z * cosRy

        const ldx = targetX - lx
        const ldy = targetY - ly
        const ldz = targetZ - lz
        const lightDist = Math.sqrt(ldx * ldx + ldy * ldy + ldz * ldz)

        if (lightDist < spotLightRadius) {
            const intensity = Math.pow(1 - (lightDist / spotLightRadius), 2) // 平方衰减更自然
            // 颜色混合
            colorAttribute.setXYZ(
              i,
              normalColor.r + (highlightColor.r - normalColor.r) * intensity,
              normalColor.g + (highlightColor.g - normalColor.g) * intensity,
              normalColor.b + (highlightColor.b - normalColor.b) * intensity
            )
        } else {
             colorAttribute.setXYZ(i, normalColor.r, normalColor.g, normalColor.b)
        }

        // C. 阻尼与回弹
        // 让 velocity 衰减并回归 0
        velocities[i3] *= 0.92 // 摩擦力
        velocities[i3 + 1] *= 0.92
        velocities[i3 + 2] *= 0.92

        // D. 最终叠加
        positions[i3] = targetX + velocities[i3]
        positions[i3 + 1] = targetY + velocities[i3 + 1]
        positions[i3 + 2] = targetZ + velocities[i3 + 2]
      }

      // 标记需要更新
      geometry.attributes.position.needsUpdate = true
      geometry.attributes.color.needsUpdate = true

      // 4. 额外的动态效果 (自转)
      // 随着滚动，整体旋转一下，增加动感
      particles.rotation.y = time * 0.05 + currentScroll * 0.0005
      particles.rotation.x = currentScroll * 0.0002

      renderer.render(scene, camera)
    }

    animate()

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    // Set body background to transparent to allow canvas to show
    const originalBackground = document.body.style.background
    document.body.style.background = 'transparent'

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationId)
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement)
      }
      geometry.dispose()
      material.dispose()
      // Restore background
      document.body.style.background = originalBackground
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        background: 'radial-gradient(circle at center, #1a1a1a 0%, #000000 100%)',
      }}
    />
  )
}

