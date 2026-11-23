import { Component, DestroyRef, ElementRef, afterNextRender, inject, viewChild } from '@angular/core';

/**
 * Three.js hero: a DNA double helix of glowing nodes wrapped around a slowly turning
 * medical cross, with drifting particles. three.js is dynamically imported so it only
 * loads on the landing page. Pauses when off-screen; renders one still frame for
 * reduced-motion users.
 */
@Component({
  selector: 'app-hero-scene',
  template: `<canvas #c aria-hidden="true"></canvas>`,
  styles: `:host { display: block; position: relative; } canvas { width: 100%; height: 100%; display: block; }`,
})
export class HeroScene {
  private canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('c');
  private destroyRef = inject(DestroyRef);

  private dead = false;

  constructor() {
    this.destroyRef.onDestroy(() => (this.dead = true));
    afterNextRender(() => this.start());
  }

  private async start() {
    const THREE = await import('three');
    if (this.dead) return; // left the page while three.js was loading
    const canvas = this.canvas().nativeElement;
    const host = canvas.parentElement!;
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

    let renderer: InstanceType<typeof THREE.WebGLRenderer>;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch {
      return; // no WebGL: the CSS gradient behind the canvas is the fallback
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, 11);

    const root = new THREE.Group();
    scene.add(root);
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const key = new THREE.PointLight(0x22d3ee, 60, 30);
    key.position.set(4, 4, 6);
    const rim = new THREE.PointLight(0x6366f1, 40, 30);
    rim.position.set(-5, -3, 4);
    scene.add(key, rim);

    // DNA helix: two strands of instanced spheres + rungs
    const N = 44;
    const node = new THREE.SphereGeometry(0.13, 16, 16);
    const matA = new THREE.MeshStandardMaterial({ color: 0x22d3ee, emissive: 0x0e7490, emissiveIntensity: 0.9, roughness: 0.3 });
    const matB = new THREE.MeshStandardMaterial({ color: 0x818cf8, emissive: 0x4338ca, emissiveIntensity: 0.9, roughness: 0.3 });
    const strandA = new THREE.InstancedMesh(node, matA, N);
    const strandB = new THREE.InstancedMesh(node, matB, N);
    const rungGeo = new THREE.CylinderGeometry(0.025, 0.025, 1, 6);
    const rungMat = new THREE.MeshStandardMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.35 });
    const rungs = new THREE.InstancedMesh(rungGeo, rungMat, N / 2);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const helix = new THREE.Group();
    for (let i = 0; i < N; i++) {
      const t = (i / N) * Math.PI * 4;
      const y = (i / N) * 9 - 4.5;
      const a = new THREE.Vector3(Math.cos(t) * 1.4, y, Math.sin(t) * 1.4);
      const b = new THREE.Vector3(Math.cos(t + Math.PI) * 1.4, y, Math.sin(t + Math.PI) * 1.4);
      strandA.setMatrixAt(i, m.makeTranslation(a.x, a.y, a.z));
      strandB.setMatrixAt(i, m.makeTranslation(b.x, b.y, b.z));
      if (i % 2 === 0) {
        const dir = b.clone().sub(a);
        q.setFromUnitVectors(up, dir.clone().normalize());
        m.compose(a.clone().add(b).multiplyScalar(0.5), q, new THREE.Vector3(1, dir.length(), 1));
        rungs.setMatrixAt(i / 2, m);
      }
    }
    helix.add(strandA, strandB, rungs);
    helix.rotation.z = 0.35;
    root.add(helix);

    // Medical cross
    const shape = new THREE.Shape();
    const s = 0.42, l = 1.15;
    shape.moveTo(-s, l); shape.lineTo(s, l); shape.lineTo(s, s); shape.lineTo(l, s); shape.lineTo(l, -s);
    shape.lineTo(s, -s); shape.lineTo(s, -l); shape.lineTo(-s, -l); shape.lineTo(-s, -s); shape.lineTo(-l, -s);
    shape.lineTo(-l, s); shape.lineTo(-s, s); shape.closePath();
    const cross = new THREE.Mesh(
      new THREE.ExtrudeGeometry(shape, { depth: 0.5, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 4 }),
      new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.15, metalness: 0.1, transmission: 0.6, thickness: 1, clearcoat: 1, emissive: 0x0891b2, emissiveIntensity: 0.25 }),
    );
    cross.geometry.center();
    cross.position.set(2.6, 1.2, 1);
    cross.scale.setScalar(0.85);
    root.add(cross);

    // Particles
    const P = 420;
    const pos = new Float32Array(P * 3);
    for (let i = 0; i < P * 3; i++) pos[i] = (Math.random() - 0.5) * 18;
    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const particles = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0x7dd3fc, size: 0.04, transparent: true, opacity: 0.7 }));
    scene.add(particles);

    const resize = () => {
      const w = host.clientWidth, h = host.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.position.z = w < 640 ? 14 : 11;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    const pointer = { x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX / innerWidth - 0.5;
      pointer.y = e.clientY / innerHeight - 0.5;
    };
    addEventListener('pointermove', onMove, { passive: true });

    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(canvas);

    const clock = new THREE.Clock();
    let raf = 0;
    const frame = () => {
      const t = clock.getElapsedTime();
      helix.rotation.y = t * 0.35;
      cross.rotation.y = t * 0.6;
      cross.rotation.x = Math.sin(t * 0.8) * 0.25;
      cross.position.y = 1.2 + Math.sin(t * 1.2) * 0.2;
      particles.rotation.y = t * 0.02;
      root.rotation.y += (pointer.x * 0.6 - root.rotation.y) * 0.05;
      root.rotation.x += (pointer.y * 0.3 - root.rotation.x) * 0.05;
      renderer.render(scene, camera);
    };
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (visible) frame();
    };
    calm ? frame() : loop();

    this.destroyRef.onDestroy(() => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      removeEventListener('pointermove', onMove);
      scene.traverse((o: any) => {
        o.geometry?.dispose?.();
        o.material?.dispose?.();
      });
      renderer.dispose();
    });
  }
}
