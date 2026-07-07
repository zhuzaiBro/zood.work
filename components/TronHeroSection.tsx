'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

type TronHeroSectionProps = {
  publishedCount: number
  categoryCount: number
}

function formatCount(value: number) {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`
  }

  return String(value)
}

function createPointTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128

  const context = canvas.getContext('2d')
  if (!context) {
    return new THREE.Texture()
  }

  const gradient = context.createRadialGradient(64, 64, 6, 64, 64, 64)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.38, 'rgba(218,241,255,0.95)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')

  context.fillStyle = gradient
  context.fillRect(0, 0, 128, 128)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true

  return texture
}

function createRingTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128

  const context = canvas.getContext('2d')
  if (!context) {
    return new THREE.Texture()
  }

  context.clearRect(0, 0, 128, 128)
  context.strokeStyle = 'rgba(182, 232, 255, 0.95)'
  context.lineWidth = 10
  context.beginPath()
  context.arc(64, 64, 30, 0, Math.PI * 2)
  context.stroke()

  context.strokeStyle = 'rgba(238, 244, 255, 0.82)'
  context.lineWidth = 4
  context.beginPath()
  context.arc(64, 64, 41, 0, Math.PI * 2)
  context.stroke()

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true

  return texture
}

function sampleFacePoint(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) {
  const r1 = Math.random()
  const r2 = Math.random()
  const sqrtR1 = Math.sqrt(r1)

  return new THREE.Vector3()
    .copy(a)
    .multiplyScalar(1 - sqrtR1)
    .add(new THREE.Vector3().copy(b).multiplyScalar(sqrtR1 * (1 - r2)))
    .add(new THREE.Vector3().copy(c).multiplyScalar(sqrtR1 * r2))
}

function longitudeDistance(a: number, b: number) {
  const diff = Math.abs(a - b) % 360
  return diff > 180 ? 360 - diff : diff
}

function landBlob(
  lon: number,
  lat: number,
  centerLon: number,
  centerLat: number,
  radiusLon: number,
  radiusLat: number,
  tilt = 0
) {
  const x = longitudeDistance(lon, centerLon) / radiusLon
  const y = (lat - centerLat) / radiusLat
  const rotatedX = x * Math.cos(tilt) - y * Math.sin(tilt)
  const rotatedY = x * Math.sin(tilt) + y * Math.cos(tilt)
  const distance = rotatedX * rotatedX + rotatedY * rotatedY

  return Math.max(0, 1 - distance)
}

function worldLandStrength(lon: number, lat: number) {
  const continents = [
    landBlob(lon, lat, -104, 48, 42, 22, -0.25),
    landBlob(lon, lat, -92, 24, 26, 13, -0.18),
    landBlob(lon, lat, -60, -15, 20, 36, -0.34),
    landBlob(lon, lat, 18, 3, 25, 34, 0.08),
    landBlob(lon, lat, 16, 51, 23, 13, 0.12),
    landBlob(lon, lat, 76, 43, 58, 25, 0.08),
    landBlob(lon, lat, 104, 20, 30, 16, -0.16),
    landBlob(lon, lat, 137, -25, 20, 12, 0.1),
    landBlob(lon, lat, -42, 72, 20, 8, -0.08),
  ]

  const islandBelt =
    Math.sin((lon + 160) * 0.08) * 0.5 + Math.cos((lat - 6) * 0.35) * 0.5
  const islands = lat > -12 && lat < 24 && lon > 95 && lon < 162 && islandBelt > 0.52 ? 0.42 : 0

  return Math.max(...continents, islands)
}

export default function TronHeroSection({
  publishedCount,
  categoryCount,
}: TronHeroSectionProps) {
  const canvasHostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = canvasHostRef.current
    if (!container) return

    const pointTexture = createPointTexture()
    const ringTexture = createRingTexture()

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 50)
    camera.position.set(0, 0.06, 10.6)

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    const root = new THREE.Group()
    root.position.set(-0.95, -0.08, 0)
    scene.add(root)

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.55)
    scene.add(ambientLight)

    const keyLight = new THREE.PointLight(0x79c7ff, 14, 28, 2)
    keyLight.position.set(2.8, 2.6, 5.8)
    scene.add(keyLight)

    const fillLight = new THREE.PointLight(0xdffcff, 10, 22, 2)
    fillLight.position.set(-3.5, -2.4, 4.6)
    scene.add(fillLight)

    const shellGroup = new THREE.Group()
    root.add(shellGroup)

    const shellPositions: number[] = []
    const shellColors: number[] = []
    const mapPositions: number[] = []
    const mapColors: number[] = []
    const shellRadius = 2.92
    const topColor = new THREE.Color(0xa8cbff)
    const middleColor = new THREE.Color(0x6d92ff)
    const bottomColor = new THREE.Color(0xd9fbff)
    const oceanColor = new THREE.Color(0x244776)
    const landColor = new THREE.Color(0xaeefff)
    const landHotColor = new THREE.Color(0xf5fbff)
    const shellColor = new THREE.Color()

    const latitudeBands = 126
    const longitudeBands = 196

    for (let lat = 0; lat < latitudeBands; lat++) {
      const v = (lat + 0.5) / latitudeBands
      const phi = v * Math.PI

      for (let lon = 0; lon < longitudeBands; lon++) {
        const u = lon / longitudeBands
        const theta = u * Math.PI * 2
        const lonDeg = u * 360 - 180
        const latDeg = 90 - v * 180
        const landStrength = worldLandStrength(lonDeg, latDeg)

        const continentMask =
          Math.sin(theta * 2.6 + phi * 1.35) * 0.35 +
          Math.cos(phi * 5.1 - theta * 1.2) * 0.33 +
          Math.sin((theta + phi) * 3.8) * 0.18

        const sinPhi = Math.sin(phi)
        const yUnit = Math.cos(phi)
        const poleFade = Math.abs(yUnit)
        const randomGate = THREE.MathUtils.clamp(
          0.88 - landStrength * 0.22 - Math.max(continentMask, 0) * 0.08 + Math.max(0, poleFade - 0.82) * 0.26,
          0.56,
          0.96
        )
        if (Math.random() > randomGate) continue

        const microOffset =
          Math.sin(theta * 4.8 + phi * 1.7) * 0.01 +
          Math.cos(theta * 3.4 - phi * 2.2) * 0.008
        const radius = shellRadius + microOffset

        const x = radius * Math.cos(theta) * sinPhi
        const y = radius * yUnit
        const z = radius * Math.sin(theta) * sinPhi

        shellPositions.push(x, y, z)

        const verticalBlend = THREE.MathUtils.clamp((y / shellRadius + 1) * 0.5, 0, 1)
        if (verticalBlend > 0.55) {
          shellColor.lerpColors(middleColor, topColor, (verticalBlend - 0.55) / 0.45)
        } else {
          shellColor.lerpColors(bottomColor, middleColor, verticalBlend / 0.55)
        }

        shellColor.lerp(oceanColor, 0.52)
        if (landStrength > 0) {
          shellColor.lerp(landColor, THREE.MathUtils.clamp(landStrength * 0.86, 0, 0.86))
          shellColor.lerp(landHotColor, THREE.MathUtils.clamp((landStrength - 0.62) * 0.68, 0, 0.26))
        }

        const brightness = THREE.MathUtils.clamp(
          0.38 + landStrength * 0.36 + Math.max(continentMask, -0.18) * 0.08 - Math.max(0, poleFade - 0.88) * 0.12,
          0.34,
          0.9
        )
        shellColors.push(
          Math.min(shellColor.r * brightness, 1),
          Math.min(shellColor.g * brightness, 1),
          Math.min(shellColor.b * brightness, 1)
        )

        if (landStrength > 0.12 && Math.random() < 0.35 + landStrength * 0.95) {
          const mapGlow = new THREE.Color()
          mapGlow.lerpColors(landColor, landHotColor, THREE.MathUtils.clamp(landStrength, 0, 1))
          mapPositions.push(x * 1.006, y * 1.006, z * 1.006)
          mapColors.push(
            Math.min(mapGlow.r * 1.25, 1),
            Math.min(mapGlow.g * 1.25, 1),
            Math.min(mapGlow.b * 1.25, 1)
          )
        }
      }
    }

    const shellGeometry = new THREE.BufferGeometry()
    shellGeometry.setAttribute('position', new THREE.Float32BufferAttribute(shellPositions, 3))
    shellGeometry.setAttribute('color', new THREE.Float32BufferAttribute(shellColors, 3))

    const shellMaterial = new THREE.PointsMaterial({
      size: 0.048,
      map: pointTexture,
      transparent: true,
      opacity: 0.7,
      alphaTest: 0.12,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      sizeAttenuation: true,
    })

    const shellPoints = new THREE.Points(shellGeometry, shellMaterial)
    shellGroup.add(shellPoints)

    const mapGeometry = new THREE.BufferGeometry()
    mapGeometry.setAttribute('position', new THREE.Float32BufferAttribute(mapPositions, 3))
    mapGeometry.setAttribute('color', new THREE.Float32BufferAttribute(mapColors, 3))

    const mapMaterial = new THREE.PointsMaterial({
      size: 0.074,
      map: pointTexture,
      transparent: true,
      opacity: 1,
      alphaTest: 0.1,
      depthWrite: false,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    })

    const mapPoints = new THREE.Points(mapGeometry, mapMaterial)
    shellGroup.add(mapPoints)

    const shellHalo = new THREE.Mesh(
      new THREE.SphereGeometry(shellRadius * 1.04, 48, 48),
      new THREE.MeshBasicMaterial({
        color: 0x98bbff,
        transparent: true,
        opacity: 0.04,
        side: THREE.BackSide,
      })
    )
    shellGroup.add(shellHalo)

    const dustPositions: number[] = []
    const dustColors: number[] = []
    const dustColorA = new THREE.Color(0x5f87ff)
    const dustColorB = new THREE.Color(0xddffff)
    const dustColor = new THREE.Color()

    for (let index = 0; index < 280; index++) {
      const radius = 3.15 + Math.random() * 1.05
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      const sinPhi = Math.sin(phi)

      dustPositions.push(
        radius * Math.cos(theta) * sinPhi,
        radius * Math.cos(phi),
        radius * Math.sin(theta) * sinPhi
      )

      dustColor.lerpColors(dustColorA, dustColorB, Math.random())
      dustColors.push(dustColor.r, dustColor.g, dustColor.b)
    }

    const dustGeometry = new THREE.BufferGeometry()
    dustGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dustPositions, 3))
    dustGeometry.setAttribute('color', new THREE.Float32BufferAttribute(dustColors, 3))

    const dustMaterial = new THREE.PointsMaterial({
      size: 0.076,
      map: pointTexture,
      transparent: true,
      opacity: 0.82,
      alphaTest: 0.12,
      depthWrite: false,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    })

    const dustPoints = new THREE.Points(dustGeometry, dustMaterial)
    root.add(dustPoints)

    const markerGroup = new THREE.Group()
    root.add(markerGroup)

    for (let index = 0; index < 15; index++) {
      const marker = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: ringTexture,
          color: index % 2 === 0 ? 0x96e5ff : 0xc7d6ff,
          transparent: true,
          opacity: 0.95,
          depthWrite: false,
        })
      )

      const radius = shellRadius + 0.16 + Math.random() * 0.3
      const theta = Math.random() * Math.PI * 2
      const phi = 0.28 + Math.random() * (Math.PI - 0.56)
      const sinPhi = Math.sin(phi)

      marker.position.set(
        radius * Math.cos(theta) * sinPhi,
        radius * Math.cos(phi),
        radius * Math.sin(theta) * sinPhi
      )

      const scale = 0.17 + Math.random() * 0.08
      marker.scale.setScalar(scale)
      marker.userData.phase = Math.random() * Math.PI * 2
      marker.userData.baseScale = scale
      markerGroup.add(marker)
    }

    const ringGroup = new THREE.Group()
    ringGroup.position.y = -3.28
    root.add(ringGroup)

    for (let index = 0; index < 7; index++) {
      const points: THREE.Vector3[] = []
      const radiusX = 0.58 + index * 0.17
      const radiusY = 0.12 + index * 0.028
      const segments = 140

      for (let segment = 0; segment <= segments; segment++) {
        const angle = (segment / segments) * Math.PI * 2
        points.push(new THREE.Vector3(Math.cos(angle) * radiusX, 0, Math.sin(angle) * radiusY))
      }

      const ringGeometry = new THREE.BufferGeometry().setFromPoints(points)
      const ringMaterial = new THREE.LineBasicMaterial({
        color: index < 3 ? 0xd1f7ff : 0x82a3e8,
        transparent: true,
        opacity: 0.46 - index * 0.045,
      })

      const ring = new THREE.Line(ringGeometry, ringMaterial)
      ring.rotation.x = Math.PI * 0.5
      ringGroup.add(ring)
    }

    const prismGroup = new THREE.Group()
    prismGroup.position.set(0.02, -0.1, 0.12)
    prismGroup.rotation.set(-0.4, 0.5, -0.08)
    prismGroup.scale.setScalar(0.72)
    root.add(prismGroup)

    const prismVertices = [
      new THREE.Vector3(-1.95, 0.88, 0.42),
      new THREE.Vector3(1.75, 0.78, 0.48),
      new THREE.Vector3(0.2, -0.88, 0.74),
      new THREE.Vector3(-1.18, -0.12, -0.62),
      new THREE.Vector3(0.1, -2.86, -0.08),
      new THREE.Vector3(1.02, -0.2, -0.58),
    ]

    const prismFaces = [
      [0, 1, 2],
      [0, 2, 3],
      [1, 2, 5],
      [3, 2, 4],
      [5, 2, 4],
      [0, 3, 5],
      [0, 1, 5],
    ] as const

    const edgePairs = new Set<string>()
    const edgePositions: number[] = []

    for (const [a, b, c] of prismFaces) {
      const pairs = [
        [a, b],
        [b, c],
        [c, a],
      ]

      for (const [start, end] of pairs) {
        const key = [Math.min(start, end), Math.max(start, end)].join('-')
        if (edgePairs.has(key)) continue

        edgePairs.add(key)
        edgePositions.push(
          prismVertices[start].x,
          prismVertices[start].y,
          prismVertices[start].z,
          prismVertices[end].x,
          prismVertices[end].y,
          prismVertices[end].z
        )
      }
    }

    const edgeGeometry = new THREE.BufferGeometry()
    edgeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(edgePositions, 3))

    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0xf5f7ff,
      transparent: true,
      opacity: 0.7,
    })

    const prismEdges = new THREE.LineSegments(edgeGeometry, edgeMaterial)
    prismGroup.add(prismEdges)

    const faceFillPositions: number[] = []
    const faceFillColors: number[] = []
    const faceTop = new THREE.Color(0xffffff)
    const faceMid = new THREE.Color(0xd8e4ff)
    const faceLow = new THREE.Color(0x9db6e8)
    const faceColor = new THREE.Color()

    prismFaces.forEach(([a, b, c], faceIndex) => {
      const density = faceIndex < 3 ? 900 : 550

      for (let pointIndex = 0; pointIndex < density; pointIndex++) {
        const point = sampleFacePoint(prismVertices[a], prismVertices[b], prismVertices[c])
        faceFillPositions.push(point.x, point.y, point.z)

        const tone = THREE.MathUtils.clamp((point.y + 2.6) / 3.8, 0, 1)
        if (tone > 0.55) {
          faceColor.lerpColors(faceMid, faceTop, (tone - 0.55) / 0.45)
        } else {
          faceColor.lerpColors(faceLow, faceMid, tone / 0.55)
        }

        const glowBoost = faceIndex < 2 ? 1.05 : 0.92
        faceFillColors.push(
          Math.min(faceColor.r * glowBoost, 1),
          Math.min(faceColor.g * glowBoost, 1),
          Math.min(faceColor.b * glowBoost, 1)
        )
      }
    })

    const faceFillGeometry = new THREE.BufferGeometry()
    faceFillGeometry.setAttribute('position', new THREE.Float32BufferAttribute(faceFillPositions, 3))
    faceFillGeometry.setAttribute('color', new THREE.Float32BufferAttribute(faceFillColors, 3))

    const faceFillMaterial = new THREE.PointsMaterial({
      size: 0.05,
      map: pointTexture,
      transparent: true,
      opacity: 0.68,
      alphaTest: 0.12,
      depthWrite: false,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    })

    const prismFill = new THREE.Points(faceFillGeometry, faceFillMaterial)
    prismGroup.add(prismFill)

    const pointer = { x: 0, y: 0 }
    const pointerVelocity = new THREE.Vector2()
    const hoverGlow = new THREE.PointLight(0xa7f0ff, 0, 8, 2)
    scene.add(hoverGlow)

    const handlePointerMove = (event: PointerEvent) => {
      const bounds = container.getBoundingClientRect()
      const nextX = ((event.clientX - bounds.left) / bounds.width) * 2 - 1
      const nextY = -(((event.clientY - bounds.top) / bounds.height) * 2 - 1)

      pointerVelocity.set(nextX - pointer.x, nextY - pointer.y)
      pointer.x = nextX
      pointer.y = nextY
    }

    const handlePointerLeave = () => {
      pointer.x = 0
      pointer.y = 0
      pointerVelocity.set(0, 0)
    }

    container.addEventListener('pointermove', handlePointerMove)
    container.addEventListener('pointerleave', handlePointerLeave)

    const resize = () => {
      const width = container.clientWidth
      const height = container.clientHeight

      if (!width || !height) return

      renderer.setSize(width, height)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)
    resize()

    const clock = new THREE.Clock()
    let animationFrame = 0
    let animationTime = 0
    const maxFrameDelta = 1 / 30

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        clock.getDelta()
        pointerVelocity.set(0, 0)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    const animate = () => {
      animationFrame = window.requestAnimationFrame(animate)
      const delta = document.hidden ? 0 : Math.min(clock.getDelta(), maxFrameDelta)
      animationTime += delta
      const elapsed = animationTime
      const hoverEnergy = THREE.MathUtils.clamp(
        Math.abs(pointer.x) * 0.34 + Math.abs(pointer.y) * 0.28 + pointerVelocity.length() * 9,
        0,
        1
      )

      shellGroup.rotation.y += ((0.42 + elapsed * 0.08 + pointer.x * 0.48) - shellGroup.rotation.y) * 0.04
      shellGroup.rotation.x += ((pointer.y * 0.22) - shellGroup.rotation.x) * 0.045

      prismGroup.rotation.y = 0.5 + elapsed * 0.2 + pointer.x * 0.32
      prismGroup.rotation.x = -0.4 + Math.sin(elapsed * 0.85) * 0.04 + pointer.y * 0.22
      prismGroup.rotation.z = -0.08 + pointer.x * 0.12
      prismFill.scale.setScalar(1 + hoverEnergy * 0.08)
      prismEdges.scale.setScalar(1 + hoverEnergy * 0.1)
      faceFillMaterial.opacity = 0.62 + hoverEnergy * 0.18
      edgeMaterial.opacity = 0.7 + hoverEnergy * 0.22

      hoverGlow.intensity += (hoverEnergy * 4.5 - hoverGlow.intensity) * 0.12
      hoverGlow.position.set(pointer.x * 2.5, pointer.y * 1.9, 3.2)

      dustPoints.rotation.y -= delta * 0.072
      dustPoints.rotation.x = Math.sin(elapsed * 0.35) * 0.03
      markerGroup.rotation.y -= delta * 0.108
      markerGroup.rotation.x = Math.sin(elapsed * 0.5) * 0.04
      ringGroup.rotation.z = Math.sin(elapsed * 0.8) * 0.02

      markerGroup.children.forEach((child, index) => {
        const marker = child as THREE.Sprite
        const baseScale = marker.userData.baseScale as number
        const phase = marker.userData.phase as number
        const pulse = 1 + Math.sin(elapsed * 1.8 + phase + index * 0.2) * 0.12
        marker.scale.setScalar(baseScale * pulse)
      })

      renderer.render(scene, camera)
    }

    animate()

    return () => {
      window.cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()
      container.removeEventListener('pointermove', handlePointerMove)
      container.removeEventListener('pointerleave', handlePointerLeave)
      document.removeEventListener('visibilitychange', handleVisibilityChange)

      root.traverse((object) => {
        const mesh = object as THREE.Mesh & {
          geometry?: THREE.BufferGeometry
          material?: THREE.Material | THREE.Material[]
        }

        mesh.geometry?.dispose()

        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((material) => material.dispose())
        } else {
          mesh.material?.dispose()
        }
      })

      pointTexture.dispose()
      ringTexture.dispose()
      renderer.dispose()
      container.removeChild(renderer.domElement)
    }
  }, [])

  const stats = [
    { label: '学习笔记', value: formatCount(publishedCount) },
    { label: '知识专题', value: formatCount(categoryCount) },
    { label: '主线方向', value: 'Web3 + AI' },
    { label: '社区实践', value: 'Build in Public' },
  ]

  return (
    <section className="relative overflow-hidden border-b border-[#101d38] bg-[#02050b]">
      <div
        className="absolute inset-0 opacity-95"
        style={{
          backgroundImage: `
            radial-gradient(circle at 18% 22%, rgba(58, 102, 255, 0.2), transparent 30%),
            radial-gradient(circle at 82% 20%, rgba(137, 214, 255, 0.14), transparent 24%),
            radial-gradient(circle at 68% 82%, rgba(192, 247, 255, 0.16), transparent 24%),
            linear-gradient(180deg, rgba(3,7,15,0.92), rgba(2,5,11,0.98))
          `,
        }}
      />
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage: 'radial-gradient(rgba(144, 196, 255, 0.24) 1px, transparent 1px)',
          backgroundSize: '14px 14px',
          maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,0,0,0.08))',
          WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,0,0,0.08))',
        }}
      />
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 pb-10 pt-28 lg:px-10 lg:pb-14 lg:pt-32">
        <div className="grid flex-1 items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(520px,0.95fr)]">
          <div className="relative z-10 max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#20345c] bg-[#07101f]/80 px-4 py-2 text-sm font-medium text-[#cbe5ff] shadow-[0_10px_30px_rgba(54,100,255,0.12)] backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-[#8ee7ff]" />
              Web3 x AI Dev Community
            </div>

            <h1 className="max-w-[12ch] text-4xl font-black leading-[0.96] tracking-normal text-[#f5f8ff] sm:text-6xl sm:leading-[0.92] lg:text-7xl">
              Web3 与 AI 开发社区
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-[#9fb2d1] sm:text-lg">
              这里沉淀 Web3 工程、AI 应用开发、智能合约、全栈项目和面试经验。
              从学习路线到真实项目复盘，一起把新技术变成能交付的作品。
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/courses"
                className="inline-flex items-center rounded-full bg-[linear-gradient(135deg,#5f82ff,#8fe7ff)] px-7 py-3 text-sm font-semibold text-[#04101f] shadow-[0_20px_45px_rgba(86,145,255,0.28)] transition-transform duration-200 hover:-translate-y-0.5"
              >
                开始学习
              </Link>
              <Link
                href="/posts/create"
                className="inline-flex items-center rounded-full border border-[#223966] bg-[#081224]/82 px-7 py-3 text-sm font-semibold text-[#e5efff] shadow-[0_12px_30px_rgba(5,10,22,0.35)] transition-transform duration-200 hover:-translate-y-0.5"
              >
                发布笔记
              </Link>
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="absolute h-[74%] w-[74%] rounded-full bg-[radial-gradient(circle,rgba(132,203,255,0.16),rgba(63,108,255,0.08),transparent_68%)] blur-3xl" />
            <div
              ref={canvasHostRef}
              className="relative h-[300px] w-full max-w-full sm:h-[380px] sm:max-w-[560px] lg:h-[500px]"
            />
          </div>
        </div>

        <div className="relative z-10 mt-4 grid gap-6 border-t border-[#162646] pt-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-sm text-[#7f95ba]">{stat.label}</p>
              <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[#edf4ff]">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
