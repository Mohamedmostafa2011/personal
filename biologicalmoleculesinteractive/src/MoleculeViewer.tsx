import { useEffect, useRef } from "react";
import * as THREE from "three";

export type MoleculeId = "glucose" | "sucrose" | "starch" | "lipid" | "peptide";
type ElementSymbol = "C" | "H" | "O" | "N" | "S";

type Atom = {
  element: ElementSymbol;
  position: THREE.Vector3;
};

type Bond = {
  from: number;
  to: number;
  order?: number;
};

type Graph = {
  atoms: Atom[];
  bonds: Bond[];
};

type SugarRing = {
  center: THREE.Vector3;
  carbons: number[];
  positions: THREE.Vector3[];
};

const elementColors: Record<ElementSymbol, number> = {
  C: 0x59666a,
  H: 0xf2efe4,
  O: 0xf0765d,
  N: 0x6d9df0,
  S: 0xe6bd69,
};

const elementRadii: Record<ElementSymbol, number> = {
  C: 0.2,
  H: 0.105,
  O: 0.17,
  N: 0.175,
  S: 0.2,
};

function addAtom(graph: Graph, element: ElementSymbol, position: THREE.Vector3) {
  graph.atoms.push({ element, position });
  return graph.atoms.length - 1;
}

function addBond(graph: Graph, from: number, to: number, order = 1) {
  graph.bonds.push({ from, to, order });
}

function addSugarRing(
  graph: Graph,
  center: THREE.Vector3,
  radius: number,
  phase = 0,
): SugarRing {
  const positions: THREE.Vector3[] = [];
  const ringAtoms: number[] = [];
  const carbons: number[] = [];

  for (let index = 0; index < 6; index += 1) {
    const angle = (Math.PI / 3) * index + Math.PI / 2 + phase;
    const position = new THREE.Vector3(
      center.x + Math.cos(angle) * radius,
      center.y + Math.sin(angle) * radius,
      center.z + Math.sin(index * 1.7 + phase) * 0.07,
    );
    const element: ElementSymbol = index === 0 ? "O" : "C";
    const atomIndex = addAtom(graph, element, position);
    positions.push(position);
    ringAtoms.push(atomIndex);
    if (element === "C") carbons.push(atomIndex);
  }

  for (let index = 0; index < ringAtoms.length; index += 1) {
    addBond(graph, ringAtoms[index], ringAtoms[(index + 1) % ringAtoms.length]);
  }

  return { center, carbons, positions };
}

function addHydroxyl(
  graph: Graph,
  carbon: number,
  carbonPosition: THREE.Vector3,
  direction: THREE.Vector3,
) {
  const oxygenPosition = carbonPosition.clone().add(direction.clone().multiplyScalar(0.43));
  const oxygen = addAtom(graph, "O", oxygenPosition);
  addBond(graph, carbon, oxygen);
}

function buildGlucose(): Graph {
  const graph: Graph = { atoms: [], bonds: [] };
  const ring = addSugarRing(graph, new THREE.Vector3(-0.08, 0, 0), 0.78, 0.05);

  ring.carbons.slice(0, 4).forEach((carbon, index) => {
    const ringIndex = index + 1;
    const radial = ring.positions[ringIndex]
      .clone()
      .sub(ring.center)
      .normalize();
    const direction = radial.add(new THREE.Vector3(0, 0, index % 2 === 0 ? 0.32 : -0.32)).normalize();
    addHydroxyl(graph, carbon, ring.positions[ringIndex], direction);
  });

  const sideCarbonRingIndex = 5;
  const sideCarbon = ring.carbons[4];
  const sideDirection = ring.positions[sideCarbonRingIndex]
    .clone()
    .sub(ring.center)
    .normalize();
  const carbonSixPosition = ring.positions[sideCarbonRingIndex]
    .clone()
    .add(sideDirection.clone().multiplyScalar(0.52));
  const carbonSix = addAtom(graph, "C", carbonSixPosition);
  addBond(graph, sideCarbon, carbonSix);
  addHydroxyl(
    graph,
    carbonSix,
    carbonSixPosition,
    sideDirection.clone().add(new THREE.Vector3(0, 0, 0.45)).normalize(),
  );

  return graph;
}

function buildDisaccharide(): Graph {
  const graph: Graph = { atoms: [], bonds: [] };
  const left = addSugarRing(graph, new THREE.Vector3(-0.72, 0, 0), 0.64, -0.06);
  const right = addSugarRing(graph, new THREE.Vector3(0.72, 0, 0.02), 0.64, 0.08);

  // Leave one carbon site open on each sugar so the bridge reads as a glycosidic link.
  left.carbons.forEach((carbon, index) => {
    if (index === 4) return;
    const ringIndex = index + 1;
    const direction = left.positions[ringIndex]
      .clone()
      .sub(left.center)
      .normalize()
      .add(new THREE.Vector3(0, 0, index % 2 === 0 ? 0.28 : -0.28))
      .normalize();
    addHydroxyl(graph, carbon, left.positions[ringIndex], direction);
  });

  right.carbons.forEach((carbon, index) => {
    if (index === 1) return;
    const ringIndex = index + 1;
    const direction = right.positions[ringIndex]
      .clone()
      .sub(right.center)
      .normalize()
      .add(new THREE.Vector3(0, 0, index % 2 === 0 ? -0.28 : 0.28))
      .normalize();
    addHydroxyl(graph, carbon, right.positions[ringIndex], direction);
  });

  const leftCarbon = left.carbons[4];
  const rightCarbon = right.carbons[1];
  const bridgePosition = left.positions[5].clone().lerp(right.positions[2], 0.5);
  const bridgeOxygen = addAtom(graph, "O", bridgePosition);
  addBond(graph, leftCarbon, bridgeOxygen);
  addBond(graph, bridgeOxygen, rightCarbon);
  return graph;
}

function buildStarch(): Graph {
  const graph: Graph = { atoms: [], bonds: [] };
  const rings: SugarRing[] = [];

  for (let index = 0; index < 4; index += 1) {
    const center = new THREE.Vector3((index - 1.5) * 1.13, Math.sin(index * 0.9) * 0.08, 0);
    rings.push(addSugarRing(graph, center, 0.52, index % 2 === 0 ? 0.02 : -0.04));
  }

  rings.forEach((ring, ringIndex) => {
    const bondedCarbonIndex = ringIndex === 0 ? -1 : 1;
    ring.carbons.forEach((carbon, carbonIndex) => {
      if (carbonIndex === bondedCarbonIndex || carbonIndex === 4) return;
      const ringVertex = carbonIndex + 1;
      const direction = ring.positions[ringVertex]
        .clone()
        .sub(ring.center)
        .normalize()
        .add(new THREE.Vector3(0, 0, carbonIndex % 2 === 0 ? 0.3 : -0.3))
        .normalize();
      addHydroxyl(graph, carbon, ring.positions[ringVertex], direction);
    });
  });

  for (let index = 0; index < rings.length - 1; index += 1) {
    const from = rings[index].carbons[4];
    const to = rings[index + 1].carbons[1];
    const fromPosition = rings[index].positions[5];
    const toPosition = rings[index + 1].positions[2];
    const bridgePosition = fromPosition.clone().lerp(toPosition, 0.5);
    const oxygen = addAtom(graph, "O", bridgePosition);
    addBond(graph, from, oxygen);
    addBond(graph, oxygen, to);
  }

  return graph;
}

function buildLipid(): Graph {
  const graph: Graph = { atoms: [], bonds: [] };
  const glycerolPositions = [
    new THREE.Vector3(-0.62, 0.56, 0),
    new THREE.Vector3(-0.72, 0, 0.06),
    new THREE.Vector3(-0.62, -0.56, 0),
  ];
  const glycerol = glycerolPositions.map((position) => addAtom(graph, "C", position));
  addBond(graph, glycerol[0], glycerol[1]);
  addBond(graph, glycerol[1], glycerol[2]);

  glycerolPositions.forEach((position, chainIndex) => {
    const startOxygenPosition = position.clone().add(new THREE.Vector3(0.33, 0, 0.08));
    const esterOxygen = addAtom(graph, "O", startOxygenPosition);
    addBond(graph, glycerol[chainIndex], esterOxygen);

    const carbonylPosition = startOxygenPosition.clone().add(new THREE.Vector3(0.38, 0, 0));
    const carbonylCarbon = addAtom(graph, "C", carbonylPosition);
    addBond(graph, esterOxygen, carbonylCarbon);
    const carbonylOxygenPosition = carbonylPosition
      .clone()
      .add(new THREE.Vector3(0.02, 0.31, chainIndex === 1 ? 0.16 : -0.15));
    const carbonylOxygen = addAtom(graph, "O", carbonylOxygenPosition);
    addBond(graph, carbonylCarbon, carbonylOxygen, 2);

    let previous = carbonylCarbon;
    for (let step = 0; step < 5; step += 1) {
      const zigzag = step % 2 === 0 ? 0.18 : -0.18;
      const zOffset = (chainIndex - 1) * 0.37 + (step % 2 === 0 ? 0.08 : -0.08);
      const position = new THREE.Vector3(
        carbonylPosition.x + 0.43 * (step + 1),
        carbonylPosition.y + zigzag + (chainIndex - 1) * 0.16,
        carbonylPosition.z + zOffset,
      );
      const carbon = addAtom(graph, "C", position);
      addBond(graph, previous, carbon);
      previous = carbon;
    }
  });

  return graph;
}

function buildPeptide(): Graph {
  const graph: Graph = { atoms: [], bonds: [] };
  const residueCount = 6;
  const carbonylCarbons: number[] = [];
  const nitrogens: number[] = [];

  for (let index = 0; index < residueCount; index += 1) {
    const alphaPosition = new THREE.Vector3(
      (index - (residueCount - 1) / 2) * 0.62,
      Math.sin(index * 1.35) * 0.3,
      Math.cos(index * 1.35) * 0.28,
    );
    const nitrogenPosition = alphaPosition.clone().add(new THREE.Vector3(-0.23, 0.1, -0.08));
    const carbonylPosition = alphaPosition.clone().add(new THREE.Vector3(0.24, 0.14, 0.07));
    const oxygenPosition = carbonylPosition.clone().add(new THREE.Vector3(0.03, 0.34, 0.08));
    const sidePosition = alphaPosition.clone().add(
      new THREE.Vector3(0.04, -0.29, index % 2 === 0 ? 0.36 : -0.36),
    );

    const nitrogen = addAtom(graph, "N", nitrogenPosition);
    const alphaCarbon = addAtom(graph, "C", alphaPosition);
    const carbonylCarbon = addAtom(graph, "C", carbonylPosition);
    const carbonylOxygen = addAtom(graph, "O", oxygenPosition);
    const sideAtom = addAtom(graph, index === 3 ? "S" : index === 1 ? "O" : "C", sidePosition);

    addBond(graph, nitrogen, alphaCarbon);
    addBond(graph, alphaCarbon, carbonylCarbon);
    addBond(graph, carbonylCarbon, carbonylOxygen, 2);
    addBond(graph, alphaCarbon, sideAtom);
    nitrogens.push(nitrogen);
    carbonylCarbons.push(carbonylCarbon);
  }

  for (let index = 0; index < residueCount - 1; index += 1) {
    addBond(graph, carbonylCarbons[index], nitrogens[index + 1]);
  }

  return graph;
}

function buildGraph(model: MoleculeId): Graph {
  switch (model) {
    case "glucose":
      return buildGlucose();
    case "sucrose":
      return buildDisaccharide();
    case "starch":
      return buildStarch();
    case "lipid":
      return buildLipid();
    case "peptide":
      return buildPeptide();
  }
}

function buildMoleculeGroup(model: MoleculeId) {
  const graph = buildGraph(model);
  const group = new THREE.Group();
  const sphereGeometry = new THREE.SphereGeometry(1, 22, 18);
  const materials = new Map<ElementSymbol, THREE.MeshStandardMaterial>();

  for (const element of Object.keys(elementColors) as ElementSymbol[]) {
    materials.set(
      element,
      new THREE.MeshStandardMaterial({
        color: elementColors[element],
        roughness: 0.3,
        metalness: 0.05,
      }),
    );
  }

  graph.bonds.forEach(({ from, to, order = 1 }) => {
    const start = graph.atoms[from].position;
    const end = graph.atoms[to].position;
    const direction = end.clone().sub(start);
    const length = direction.length();
    const center = start.clone().add(end).multiplyScalar(0.5);
    const bondCount = order > 1 ? 2 : 1;
    const offsetDirection = new THREE.Vector3()
      .crossVectors(direction.clone().normalize(), new THREE.Vector3(0, 0, 1))
      .normalize();

    for (let bondIndex = 0; bondIndex < bondCount; bondIndex += 1) {
      const offset = bondCount === 1 ? 0 : bondIndex === 0 ? -0.065 : 0.065;
      const bondGeometry = new THREE.CylinderGeometry(0.043, 0.043, length, 8);
      const bondMaterial = new THREE.MeshStandardMaterial({
        color: 0xb6c3bf,
        roughness: 0.46,
        metalness: 0.12,
      });
      const bondMesh = new THREE.Mesh(bondGeometry, bondMaterial);
      bondMesh.position.copy(center).add(offsetDirection.clone().multiplyScalar(offset));
      bondMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
      group.add(bondMesh);
    }
  });

  graph.atoms.forEach(({ element, position }) => {
    const atom = new THREE.Mesh(sphereGeometry, materials.get(element));
    const radius = elementRadii[element];
    atom.position.copy(position);
    atom.scale.setScalar(radius);
    group.add(atom);
  });

  const bounds = new THREE.Box3().setFromObject(group);
  const center = bounds.getCenter(new THREE.Vector3());
  group.position.sub(center);
  return group;
}

type MoleculeCanvasProps = {
  model: MoleculeId;
  autoRotate: boolean;
};

export function MoleculeCanvas({ model, autoRotate }: MoleculeCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    const cameraDistance: Record<MoleculeId, number> = {
      glucose: 5.7,
      sucrose: 7.8,
      starch: 9.1,
      lipid: 8.7,
      peptide: 7.4,
    };
    camera.position.set(0, 0, cameraDistance[model]);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      host.innerHTML = '<div class="viewer-fallback">3D preview is unavailable in this browser.</div>';
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(host.clientWidth || 1, host.clientHeight || 1, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.domElement.setAttribute("aria-label", "Interactive 3D molecule model. Use arrow keys to rotate and plus or minus to zoom.");
    renderer.domElement.setAttribute("role", "application");
    renderer.domElement.tabIndex = 0;
    renderer.domElement.style.touchAction = "none";
    host.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xb8d1d0, 1.7));
    const keyLight = new THREE.DirectionalLight(0xfff1d7, 3.3);
    keyLight.position.set(-3.4, 4.6, 5);
    scene.add(keyLight);
    const fillLight = new THREE.PointLight(0x68b7bb, 35, 18);
    fillLight.position.set(4, -2, 3);
    scene.add(fillLight);

    const molecule = buildMoleculeGroup(model);
    scene.add(molecule);

    let frame = 0;
    let dragging = false;
    let lastPointerX = 0;
    let lastPointerY = 0;

    const resize = () => {
      const width = host.clientWidth || 1;
      const height = host.clientHeight || 1;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    const onPointerDown = (event: PointerEvent) => {
      dragging = true;
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
      renderer.domElement.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      const deltaX = event.clientX - lastPointerX;
      const deltaY = event.clientY - lastPointerY;
      molecule.rotation.y += deltaX * 0.009;
      molecule.rotation.x = THREE.MathUtils.clamp(molecule.rotation.x + deltaY * 0.009, -1.05, 1.05);
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
    };

    const onPointerUp = () => {
      dragging = false;
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      camera.position.z = THREE.MathUtils.clamp(camera.position.z + event.deltaY * 0.004, 3.5, 12);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const turn = 0.12;
      if (event.key === "ArrowLeft") molecule.rotation.y -= turn;
      else if (event.key === "ArrowRight") molecule.rotation.y += turn;
      else if (event.key === "ArrowUp") molecule.rotation.x = THREE.MathUtils.clamp(molecule.rotation.x - turn, -1.05, 1.05);
      else if (event.key === "ArrowDown") molecule.rotation.x = THREE.MathUtils.clamp(molecule.rotation.x + turn, -1.05, 1.05);
      else if (event.key === "+" || event.key === "=") camera.position.z = Math.max(3.5, camera.position.z - 0.4);
      else if (event.key === "-") camera.position.z = Math.min(12, camera.position.z + 0.4);
      else return;
      event.preventDefault();
    };

    const animate = () => {
      frame = window.requestAnimationFrame(animate);
      if (autoRotate && !dragging) molecule.rotation.y += 0.0032;
      renderer.render(scene, camera);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointercancel", onPointerUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });
    renderer.domElement.addEventListener("keydown", onKeyDown);
    animate();

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointercancel", onPointerUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      renderer.domElement.removeEventListener("keydown", onKeyDown);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
          else object.material.dispose();
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentElement === host) host.removeChild(renderer.domElement);
    };
  }, [autoRotate, model]);

  return <div className="molecule-canvas" ref={hostRef} />;
}