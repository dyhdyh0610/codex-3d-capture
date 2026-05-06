import * as THREE from "three";

const POSE_CONNECTIONS = [
  ["pose.left_shoulder", "pose.right_shoulder"],
  ["pose.left_shoulder", "pose.left_elbow"],
  ["pose.left_elbow", "pose.left_wrist"],
  ["pose.right_shoulder", "pose.right_elbow"],
  ["pose.right_elbow", "pose.right_wrist"]
];

const HAND_CONNECTIONS = [
  ["wrist", "thumb_cmc"],
  ["thumb_cmc", "thumb_mcp"],
  ["thumb_mcp", "thumb_ip"],
  ["thumb_ip", "thumb_tip"],
  ["wrist", "index_mcp"],
  ["index_mcp", "index_pip"],
  ["index_pip", "index_dip"],
  ["index_dip", "index_tip"],
  ["index_mcp", "middle_mcp"],
  ["middle_mcp", "middle_pip"],
  ["middle_pip", "middle_dip"],
  ["middle_dip", "middle_tip"],
  ["middle_mcp", "ring_mcp"],
  ["ring_mcp", "ring_pip"],
  ["ring_pip", "ring_dip"],
  ["ring_dip", "ring_tip"],
  ["ring_mcp", "pinky_mcp"],
  ["pinky_mcp", "pinky_pip"],
  ["pinky_pip", "pinky_dip"],
  ["pinky_dip", "pinky_tip"],
  ["wrist", "pinky_mcp"]
];

export class CaptureScene {
  constructor(root) {
    this.root = root;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setClearColor(0x08090a, 1);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    root.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100);
    this.camera.position.set(0, 1.1, 5.2);
    this.camera.lookAt(0, 0.35, 0);

    this.nodes = new Map();
    this.lines = new Map();
    this.latestPositions = new Map();

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const light = new THREE.DirectionalLight(0xffffff, 1.8);
    light.position.set(2, 4, 3);
    this.scene.add(light);
    this.scene.add(new THREE.GridHelper(5, 10, 0x374151, 0x1f2937));
    this.scene.add(new THREE.AxesHelper(1.4));

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(root);
    this.resize();
    this.render();
  }

  update(nodes) {
    this.latestPositions = new Map();
    const activeIds = new Set(Object.keys(nodes));

    for (const [id, node] of Object.entries(nodes)) {
      const position = this.toScenePosition(id, node, nodes);
      this.latestPositions.set(id, position);
      this.upsertNode(id, node).position.copy(position);
    }

    for (const [id, mesh] of this.nodes.entries()) {
      if (!activeIds.has(id)) {
        this.scene.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
        this.nodes.delete(id);
      }
    }

    this.updateLines(nodes);
    this.render();
  }

  clear() {
    for (const mesh of this.nodes.values()) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
    }

    for (const line of this.lines.values()) {
      this.scene.remove(line);
      line.geometry.dispose();
      line.material.dispose();
    }

    this.nodes.clear();
    this.lines.clear();
    this.latestPositions.clear();
    this.render();
  }

  dispose() {
    this.resizeObserver.disconnect();
    this.renderer.dispose();
  }

  resize() {
    const rect = this.root.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.render();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  upsertNode(id, node) {
    if (this.nodes.has(id)) {
      return this.nodes.get(id);
    }

    const geometry = new THREE.SphereGeometry(node.kind === "pose" ? 0.045 : 0.027, 16, 12);
    const material = new THREE.MeshStandardMaterial({
      color: colorForNode(node),
      roughness: 0.35,
      metalness: 0.1
    });
    const mesh = new THREE.Mesh(geometry, material);
    this.nodes.set(id, mesh);
    this.scene.add(mesh);
    return mesh;
  }

  updateLines(nodes) {
    const wanted = new Set();
    for (const [a, b] of POSE_CONNECTIONS) {
      this.upsertLine(a, b, wanted, 0x86efac);
    }

    for (const side of ["left", "right"]) {
      for (const [a, b] of HAND_CONNECTIONS) {
        const start = `hand.${side}.${a}`;
        const end = `hand.${side}.${b}`;
        if (nodes[start] && nodes[end]) {
          this.upsertLine(start, end, wanted, side === "left" ? 0x67e8f9 : 0xfb7185);
        }
      }
    }

    for (const [id, line] of this.lines.entries()) {
      if (!wanted.has(id)) {
        this.scene.remove(line);
        line.geometry.dispose();
        line.material.dispose();
        this.lines.delete(id);
      }
    }
  }

  upsertLine(a, b, wanted, color) {
    const start = this.latestPositions.get(a);
    const end = this.latestPositions.get(b);
    if (!start || !end) {
      return;
    }

    const id = `${a}->${b}`;
    wanted.add(id);
    let line = this.lines.get(id);

    if (!line) {
      const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
      const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9 });
      line = new THREE.Line(geometry, material);
      this.lines.set(id, line);
      this.scene.add(line);
      return;
    }

    line.geometry.setFromPoints([start, end]);
  }

  toScenePosition(id, node, nodes) {
    if (node.kind === "hand" && node.source === "handWorld") {
      const wrist = nodes[`hand.${node.side}.wrist`];
      const poseWrist = nodes[`pose.${node.side}_wrist`];
      const local = new THREE.Vector3(node.x, -node.y, -node.z);

      if (wrist && poseWrist) {
        const base = this.toPosePosition(poseWrist);
        const wristLocal = new THREE.Vector3(wrist.x, -wrist.y, -wrist.z);
        return base.add(local.sub(wristLocal).multiplyScalar(5.5));
      }

      return local.multiplyScalar(5.5).add(new THREE.Vector3(node.side === "left" ? -0.7 : 0.7, 0, 0));
    }

    if (node.source?.endsWith("Normalized")) {
      return new THREE.Vector3((node.x - 0.5) * 3, (0.5 - node.y) * 2.2, -node.z);
    }

    return this.toPosePosition(node);
  }

  toPosePosition(node) {
    return new THREE.Vector3(node.x * 2.2, -node.y * 2.2 + 0.35, -node.z * 2.2);
  }
}

function colorForNode(node) {
  if (node.kind === "pose") {
    return 0xfbbf24;
  }

  return node.side === "left" ? 0x67e8f9 : 0xfb7185;
}
