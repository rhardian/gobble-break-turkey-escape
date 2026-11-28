// Sculpted Pixar-grade 3D rigs & props: Barnaby Turkey, Farmer/Chef Jeb, 450°F Hearth Ovens, Forged Knives, Cleavers & Freedom Doors.

import * as THREE from 'three';
import { createKnifeSlashMaterial, createVolumetricFireMaterial } from './shaders.js';

const OUTLINE_MAT = new THREE.MeshBasicMaterial({ color: 0x240c05, side: THREE.BackSide });
const stdMat = (props) => new THREE.MeshStandardMaterial(props);

function enableShadow(root, cast = true, receive = true) {
  root.traverse((o) => {
    if (o.isMesh && !o.userData.noShadow) {
      o.castShadow = cast;
      o.receiveShadow = receive;
    }
  });
  return root;
}

function addInkOutline(mesh, scale = 1.045) {
  const shell = new THREE.Mesh(mesh.geometry, OUTLINE_MAT);
  shell.scale.setScalar(scale);
  shell.userData.noShadow = true;
  mesh.add(shell);
  return mesh;
}

function part(parent, geo, mat, x = 0, y = 0, z = 0, outline = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  if (outline) addInkOutline(m, outline);
  parent.add(m);
  return m;
}

export function createTurkeyRig(textures) {
  const root = new THREE.Group();
  const bodyPivot = new THREE.Group();
  root.add(bodyPivot);

  const plumageMat = stdMat({ map: textures.turkeyPlumage, roughness: 0.56, metalness: 0.05, emissive: 0x240c04, emissiveIntensity: 0.14 });
  const breastMat = stdMat({ color: 0xc96524, roughness: 0.48, emissive: 0x290e04, emissiveIntensity: 0.15 });
  const headMat = stdMat({ color: 0xb8521e, roughness: 0.45, emissive: 0x210a04, emissiveIntensity: 0.12 });
  const wingMat = stdMat({ color: 0x7d2e12, roughness: 0.52 });
  const wingGoldMat = stdMat({ color: 0xf5a42c, roughness: 0.42 });
  const beakMat = stdMat({ color: 0xffbe2e, roughness: 0.3, emissive: 0x382100, emissiveIntensity: 0.2 });
  const wattleMat = stdMat({ color: 0xee1f1f, roughness: 0.32, emissive: 0x520606, emissiveIntensity: 0.35 });
  const scarfMat = stdMat({ color: 0xd9261a, roughness: 0.48 });
  const scarfStripeMat = stdMat({ color: 0xffd24d, roughness: 0.45 });
  const eyeWhiteMat = stdMat({ color: 0xffffff, roughness: 0.18, emissive: 0x222222, emissiveIntensity: 0.2 });
  const pupilMat = stdMat({ color: 0x120804, roughness: 0.1 });
  const legMat = stdMat({ color: 0xf08519, roughness: 0.42 });

  const bodyPts = [[0.01, 0], [0.38, 0.06], [0.58, 0.28], [0.61, 0.58], [0.49, 0.86], [0.28, 1.04], [0.01, 1.12]].map(([r, y]) => new THREE.Vector2(r, y));
  const torso = part(bodyPivot, new THREE.LatheGeometry(bodyPts, 24), plumageMat, 0, 0.24, -0.02, 1.042);
  torso.scale.set(0.95, 0.94, 1.18);
  const chest = part(bodyPivot, new THREE.SphereGeometry(0.44, 18, 14), breastMat, 0, 0.78, 0.32);
  chest.scale.set(0.92, 0.88, 0.92);

  // 2-tier sculpted 13-feather curved teardrop Thanksgiving tail fan
  const tailFan = new THREE.Group();
  tailFan.position.set(0, 0.82, -0.58);
  tailFan.rotation.x = -0.42;
  bodyPivot.add(tailFan);

  const fShape = new THREE.Shape();
  fShape.moveTo(0, 0);
  fShape.quadraticCurveTo(0.15, 0.35, 0.16, 0.78);
  fShape.quadraticCurveTo(0.14, 1.05, 0, 1.1);
  fShape.quadraticCurveTo(-0.14, 1.05, -0.16, 0.78);
  fShape.quadraticCurveTo(-0.15, 0.35, 0, 0);
  const fGeo = new THREE.ExtrudeGeometry(fShape, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2 });
  fGeo.translate(0, 0, -0.015);
  const fPal = [0x9e2112, 0xd44b15, 0xf28d1f, 0xb83014, 0xfab128, 0xde4614, 0xffc238, 0xde4614, 0xfab128, 0xb83014, 0xf28d1f, 0xd44b15, 0x9e2112];
  const darkBandMat = stdMat({ color: 0x2b0e06, roughness: 0.58 });
  const creamTipMat = stdMat({ color: 0xfff2cc, roughness: 0.38, emissive: 0x33240d, emissiveIntensity: 0.18 });

  for (let i = 0; i < 13; i++) {
    const holder = new THREE.Group();
    const t = (i - 6) / 6;
    holder.rotation.z = -t * 1.24;
    holder.position.z = -Math.abs(t) * 0.08 - (i % 2) * 0.04;
    holder.scale.set(0.95, 0.94 + (1 - Math.abs(t)) * 0.18, 1);
    part(holder, fGeo, stdMat({ color: fPal[i], roughness: 0.44 }), 0, 0, 0, 1.05);
    part(holder, new THREE.BoxGeometry(0.28, 0.11, 0.056), darkBandMat, 0, 0.8, 0);
    const tip = part(holder, new THREE.SphereGeometry(0.135, 10, 8), creamTipMat, 0, 0.99, 0);
    tip.scale.set(1.12, 0.75, 0.3);
    tailFan.add(holder);
  }

  // Sculpted curved airfoil wings with golden flight feathers
  const wShape = new THREE.Shape();
  wShape.moveTo(0, 0.16);
  wShape.quadraticCurveTo(0.26, 0.24, 0.42, -0.04);
  wShape.quadraticCurveTo(0.22, -0.34, -0.22, -0.24);
  wShape.quadraticCurveTo(-0.34, -0.02, 0, 0.16);
  const wGeo = new THREE.ExtrudeGeometry(wShape, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 });
  wGeo.rotateY(Math.PI * 0.5);

  const buildWing = (side) => {
    const wG = new THREE.Group();
    wG.position.set(side * 0.54, 0.84, 0.05);
    part(wG, wGeo, wingMat, side * 0.02, -0.02, -0.06, 1.05);
    for (let f = 0; f < 3; f++) {
      const tp = part(wG, new THREE.CapsuleGeometry(0.055, 0.24, 6, 8), wingGoldMat, side * 0.08, -0.14 - f * 0.06, -0.28 - f * 0.07);
      tp.rotation.x = 1.1 + f * 0.28;
    }
    return wG;
  };
  const leftWing = buildWing(-1);
  const rightWing = buildWing(1);
  bodyPivot.add(leftWing, rightWing);

  // Expressive neck, knit scarf, sculpted comic head, open beak & scarlet wattle
  const neckGroup = new THREE.Group();
  neckGroup.position.set(0, 1.16, 0.4);
  bodyPivot.add(neckGroup);
  part(neckGroup, new THREE.CylinderGeometry(0.16, 0.23, 0.44, 16), headMat, 0, 0.16, 0, 1.05);
  const scarfCollar = part(neckGroup, new THREE.TorusGeometry(0.23, 0.075, 10, 20), scarfMat, 0, 0.04, 0, 1.05);
  scarfCollar.rotation.x = Math.PI * 0.5;

  const scarfTail = new THREE.Group();
  const sCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.04, -0.18), new THREE.Vector3(-0.08, 0.08, -0.48), new THREE.Vector3(0.06, -0.04, -0.82)]);
  part(scarfTail, new THREE.TubeGeometry(sCurve, 12, 0.075, 8, false), scarfMat, 0, 0, 0, 1.05);
  part(scarfTail, new THREE.SphereGeometry(0.085, 8, 8), scarfStripeMat, 0.06, -0.04, -0.82);
  neckGroup.add(scarfTail);

  const head = part(neckGroup, new THREE.SphereGeometry(0.32, 20, 18), headMat, 0, 0.5, 0.08, 1.045);
  head.scale.set(0.96, 1.05, 1.02);
  for (let c = 0; c < 3; c++) part(neckGroup, new THREE.SphereGeometry(0.095 - c * 0.012, 10, 10), wattleMat, 0, 0.83 - c * 0.03, 0.08 - c * 0.12, 1.06);

  const upperBeak = part(neckGroup, new THREE.ConeGeometry(0.135, 0.38, 12), beakMat, 0, 0.5, 0.46, 1.05);
  upperBeak.rotation.x = Math.PI * 0.44;
  const lowerBeak = part(neckGroup, new THREE.ConeGeometry(0.1, 0.28, 10), beakMat, 0, 0.39, 0.4);
  lowerBeak.rotation.x = Math.PI * 0.64;

  const wattlePivot = new THREE.Group();
  wattlePivot.position.set(0.05, 0.48, 0.38);
  part(wattlePivot, new THREE.CapsuleGeometry(0.068, 0.16, 6, 10), wattleMat, 0.02, -0.1, 0.03, 1.06);
  const wDrop = part(wattlePivot, new THREE.SphereGeometry(0.092, 10, 10), wattleMat, 0.03, -0.24, 0.02, 1.06);
  wDrop.scale.set(0.9, 1.25, 0.9);
  neckGroup.add(wattlePivot);

  const browMat = stdMat({ color: 0x3b1508, roughness: 0.6 });
  for (const s of [-1, 1]) {
    part(neckGroup, new THREE.SphereGeometry(0.125, 14, 14), eyeWhiteMat, s * 0.19, 0.57, 0.25, 1.05);
    part(neckGroup, new THREE.SphereGeometry(0.062, 10, 10), pupilMat, s * 0.21, 0.57, 0.35);
    part(neckGroup, new THREE.SphereGeometry(0.022, 8, 8), eyeWhiteMat, s * 0.225, 0.6, 0.4);
    const br = part(neckGroup, new THREE.BoxGeometry(0.18, 0.045, 0.06), browMat, s * 0.19, 0.71, 0.29);
    br.rotation.z = s * 0.22;
  }

  const buildLeg = (side) => {
    const leg = new THREE.Group();
    leg.position.set(side * 0.22, 0.42, 0.02);
    const drum = part(leg, new THREE.SphereGeometry(0.13, 10, 10), plumageMat, 0, -0.04, 0);
    drum.scale.set(0.9, 1.15, 0.9);
    part(leg, new THREE.CylinderGeometry(0.042, 0.042, 0.36, 8), legMat, 0, -0.22, 0);
    for (const ta of [-0.42, 0, 0.42]) {
      const toe = part(leg, new THREE.CapsuleGeometry(0.032, 0.2, 4, 6), legMat, Math.sin(ta) * 0.09, -0.39, 0.1);
      toe.rotation.set(Math.PI * 0.5, 0, ta);
    }
    return leg;
  };
  const leftLeg = buildLeg(-1);
  const rightLeg = buildLeg(1);
  root.add(leftLeg, rightLeg);

  const auraLight = new THREE.PointLight(0xffb838, 0, 6);
  auraLight.position.set(0, 1.2, 0.5);
  root.add(auraLight);

  enableShadow(root, true, true);
  return { root, bodyPivot, tailFan, leftWing, rightWing, neckGroup, lowerBeak, wattlePivot, scarfTail, leftLeg, rightLeg, auraLight };
}

export function createFarmerRig(outfit, textures) {
  const root = new THREE.Group();
  const isChef = outfit === 'chef';
  const bodyPivot = new THREE.Group();
  root.add(bodyPivot);

  const skinMat = stdMat({ color: 0xf5be96, roughness: 0.52 });
  const noseMat = stdMat({ color: 0xe67258, roughness: 0.46 });
  const shirtMat = isChef ? stdMat({ color: 0xfcf9f2, roughness: 0.45 }) : stdMat({ map: textures.plaid, roughness: 0.62 });
  const overallMat = isChef ? stdMat({ map: textures.gingham, roughness: 0.52 }) : stdMat({ color: 0x2c5280, roughness: 0.62 });
  const pantsMat = stdMat({ color: isChef ? 0x26242b : 0x25456b, roughness: 0.68 });
  const bootMat = stdMat({ color: 0x3b1d0d, roughness: 0.55 });
  const hairMat = stdMat({ color: 0x823414, roughness: 0.62 });
  const brassMat = stdMat({ color: 0xf7be3e, metalness: 0.82, roughness: 0.25 });

  const torsoPts = [[0.01, 0], [0.54, 0.06], [0.72, 0.45], [0.68, 0.92], [0.56, 1.26], [0.28, 1.38], [0.01, 1.42]].map(([r, y]) => new THREE.Vector2(r, y));
  part(bodyPivot, new THREE.LatheGeometry(torsoPts, 22), shirtMat, 0, 0.82, 0, 1.038);
  part(bodyPivot, new THREE.CylinderGeometry(0.66, 0.72, 0.88, 20, 1, false, -Math.PI * 0.46, Math.PI * 0.92), overallMat, 0, 1.26, 0.04);

  if (isChef) {
    const scarf = part(bodyPivot, new THREE.TorusGeometry(0.32, 0.075, 10, 18), stdMat({ color: 0xd4261a, roughness: 0.48 }), 0, 2.16, 0);
    scarf.rotation.x = Math.PI * 0.5;
    const btnMat = stdMat({ color: 0x241612, roughness: 0.4 });
    for (const bx of [-0.16, 0.16]) for (const by of [1.82, 2.02]) part(bodyPivot, new THREE.SphereGeometry(0.048, 8, 8), btnMat, bx, by, 0.59);
  } else {
    for (const sx of [-0.24, 0.24]) {
      const strap = part(bodyPivot, new THREE.BoxGeometry(0.13, 0.56, 0.12), overallMat, sx, 1.9, 0.48);
      strap.rotation.x = -0.22;
      const btn = part(bodyPivot, new THREE.CylinderGeometry(0.06, 0.06, 0.05, 10), brassMat, sx, 1.66, 0.68);
      btn.rotation.x = Math.PI * 0.5;
    }
  }

  // Sculpted expressive comic head + rosy cheeks + handlebar ginger mustache + brows
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 2.52, 0.08);
  bodyPivot.add(headGroup);
  const head = part(headGroup, new THREE.SphereGeometry(0.46, 20, 18), skinMat, 0, 0, 0, 1.04);
  head.scale.set(1.02, 1.05, 0.98);
  part(headGroup, new THREE.SphereGeometry(0.13, 12, 12), noseMat, 0, -0.02, 0.46, 1.06);
  part(headGroup, new THREE.BoxGeometry(0.22, 0.12, 0.08), stdMat({ color: 0x450b0b }), 0, -0.24, 0.39);

  const mCurve = new THREE.CatmullRomCurve3([[-0.36, -0.1, 0.38], [-0.18, -0.17, 0.45], [0, -0.12, 0.47], [0.18, -0.17, 0.45], [0.36, -0.1, 0.38]].map(([x, y, z]) => new THREE.Vector3(x, y, z)));
  part(headGroup, new THREE.TubeGeometry(mCurve, 16, 0.082, 8, false), hairMat, 0, 0, 0, 1.05);

  const eyeWhite = stdMat({ color: 0xffffff, emissive: 0x222222, emissiveIntensity: 0.2 });
  const pupilMat = stdMat({ color: 0x120804 });
  for (const s of [-1, 1]) {
    part(headGroup, new THREE.SphereGeometry(0.11, 10, 10), skinMat, s * 0.45, -0.02, 0.02);
    const ch = part(headGroup, new THREE.SphereGeometry(0.13, 10, 10), noseMat, s * 0.26, -0.06, 0.34);
    ch.scale.set(1, 0.72, 0.5);
    part(headGroup, new THREE.SphereGeometry(0.105, 12, 12), eyeWhite, s * 0.17, 0.11, 0.38, 1.06);
    part(headGroup, new THREE.SphereGeometry(0.052, 8, 8), pupilMat, s * 0.17, 0.11, 0.47);
    const br = part(headGroup, new THREE.BoxGeometry(0.24, 0.08, 0.1), hairMat, s * 0.17, 0.24, 0.41, 1.06);
    br.rotation.z = -s * 0.36;
  }

  if (isChef) {
    const toqueMat = stdMat({ color: 0xffffff, roughness: 0.38 });
    part(headGroup, new THREE.CylinderGeometry(0.45, 0.43, 0.32, 20), toqueMat, 0, 0.42, 0, 1.04);
    for (let p = 0; p < 6; p++) {
      const a = (p / 6) * Math.PI * 2;
      part(headGroup, new THREE.SphereGeometry(0.32, 14, 12), toqueMat, Math.cos(a) * 0.26, 0.78, Math.sin(a) * 0.26, 1.04);
    }
    part(headGroup, new THREE.SphereGeometry(0.42, 16, 12), toqueMat, 0, 0.94, 0, 1.04);
  } else {
    const strawMat = stdMat({ map: textures.strawHat, roughness: 0.62, side: THREE.DoubleSide });
    part(headGroup, new THREE.CylinderGeometry(0.92, 0.95, 0.08, 24), strawMat, 0, 0.34, 0, 1.03);
    const cPts = [[0.46, 0.34], [0.45, 0.56], [0.38, 0.74], [0.01, 0.76]].map(([r, y]) => new THREE.Vector2(r, y));
    part(headGroup, new THREE.LatheGeometry(cPts, 24), strawMat, 0, 0, 0, 1.035);
    part(headGroup, new THREE.CylinderGeometry(0.465, 0.475, 0.12, 22), stdMat({ color: 0xd9261a, roughness: 0.46 }), 0, 0.43, 0);
  }

  const dizzyGroup = new THREE.Group();
  dizzyGroup.position.y = 1.38;
  const starMat = new THREE.MeshBasicMaterial({ color: 0xffe44d });
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    part(dizzyGroup, new THREE.OctahedronGeometry(0.14, 0), starMat, Math.cos(a) * 0.62, 0, Math.sin(a) * 0.62);
  }
  dizzyGroup.visible = false;
  headGroup.add(dizzyGroup);

  const rightArm = new THREE.Group();
  rightArm.position.set(-0.72, 1.98, 0.08);
  const rU = part(rightArm, new THREE.CapsuleGeometry(0.16, 0.48, 8, 12), shirtMat, 0, -0.22, 0.24, 1.05);
  rU.rotation.x = 0.92;
  part(rightArm, new THREE.SphereGeometry(0.15, 12, 10), skinMat, 0, -0.38, 0.56, 1.05);
  const giantKnife = createCarvingKnifeMesh(1.42, true);
  giantKnife.position.set(0.05, -0.34, 0.72);
  giantKnife.rotation.set(0.12, Math.PI * 0.5, 0.18);
  rightArm.add(giantKnife);
  bodyPivot.add(rightArm);

  const leftArm = new THREE.Group();
  leftArm.position.set(0.72, 1.98, 0.08);
  const lU = part(leftArm, new THREE.CapsuleGeometry(0.16, 0.46, 8, 12), shirtMat, 0, -0.22, 0.22, 1.05);
  lU.rotation.x = 0.75;
  part(leftArm, new THREE.SphereGeometry(0.15, 12, 10), skinMat, 0, -0.38, 0.5, 1.05);
  if (isChef) {
    const fMat = stdMat({ color: 0xeef5fc, metalness: 0.88, roughness: 0.16 });
    const sh = part(leftArm, new THREE.CylinderGeometry(0.03, 0.03, 0.9, 8), fMat, 0, -0.34, 0.85);
    sh.rotation.x = Math.PI * 0.45;
    for (const px of [-0.08, 0.08]) {
      const pr = part(leftArm, new THREE.CylinderGeometry(0.022, 0.028, 0.36, 8), fMat, px, -0.28, 1.38);
      pr.rotation.x = Math.PI * 0.45;
    }
  } else {
    part(leftArm, new THREE.CylinderGeometry(0.14, 0.12, 0.3, 12), stdMat({ color: 0xffe999, emissive: 0xffa61f, emissiveIntensity: 2.0 }), 0, -0.58, 0.56);
    part(leftArm, new THREE.ConeGeometry(0.19, 0.14, 12), brassMat, 0, -0.4, 0.56);
  }
  bodyPivot.add(leftArm);

  const buildBootLeg = (side) => {
    const leg = new THREE.Group();
    leg.position.set(side * 0.29, 0.88, 0);
    part(leg, new THREE.CylinderGeometry(0.2, 0.18, 0.62, 12), pantsMat, 0, -0.3, 0, 1.05);
    part(leg, new THREE.BoxGeometry(0.32, 0.26, 0.56), bootMat, 0, -0.72, 0.09, 1.05);
    return leg;
  };
  const leftLeg = buildBootLeg(-1);
  const rightLeg = buildBootLeg(1);
  root.add(leftLeg, rightLeg);

  const coneGeo = new THREE.RingGeometry(0.6, 5.2, 24, 1, -0.46, 0.92);
  coneGeo.rotateX(-Math.PI * 0.5);
  coneGeo.rotateY(-Math.PI * 0.5);
  const coneMat = new THREE.MeshBasicMaterial({ color: 0xff3f1a, transparent: true, opacity: 0.24, side: THREE.DoubleSide, depthWrite: false });
  const threatCone = part(root, coneGeo, coneMat, 0, 0.06, 0);
  threatCone.userData.noShadow = true;

  enableShadow(root, true, true);
  return { root, bodyPivot, headGroup, head, skinMat, dizzyGroup, rightArm, leftArm, leftLeg, rightLeg, threatCone, coneMat };
}

export function createRoastingOvenMesh(textures, isKitchenHearth = false) {
  const group = new THREE.Group();
  const ironMat = stdMat({ color: 0x383236, roughness: 0.36, metalness: 0.72 });
  const trimIronMat = stdMat({ color: 0x544b52, roughness: 0.32, metalness: 0.78 });
  const copperMat = stdMat({ color: 0xe68238, roughness: 0.24, metalness: 0.82 });
  const brassMat = stdMat({ color: 0xffc845, roughness: 0.22, metalness: 0.86 });
  const dialMat = stdMat({ map: textures.ovenDial, emissive: 0xff5a1f, emissiveIntensity: 0.45 });

  if (isKitchenHearth) {
    part(group, new THREE.BoxGeometry(2.72, 3.25, 1.65), stdMat({ map: textures.brickWall, roughness: 0.7 }), 0.35, 1.62, -0.68);
  }
  part(group, new THREE.BoxGeometry(2.35, 2.38, 2.05), ironMat, 0, 1.32, 0, 1.025);
  for (const [fx, fz] of [[-0.95, -0.8], [0.95, -0.8], [-0.95, 0.8], [0.95, 0.8]]) part(group, new THREE.CylinderGeometry(0.14, 0.18, 0.26, 10), trimIronMat, fx, 0.13, fz);
  part(group, new THREE.BoxGeometry(2.58, 0.24, 2.26), copperMat, 0, 2.56, 0, 1.025);
  const hood = part(group, new THREE.CylinderGeometry(0.45, 1.15, 0.72, 4), copperMat, 0.2, 3.0, 0);
  hood.rotation.y = Math.PI * 0.25;
  part(group, new THREE.CylinderGeometry(0.28, 0.32, 1.45, 14), ironMat, 0.2, 3.9, 0);
  const rim = part(group, new THREE.TorusGeometry(0.31, 0.06, 8, 16), brassMat, 0.2, 4.55, 0);
  rim.rotation.x = Math.PI * 0.5;

  part(group, new THREE.BoxGeometry(1.52, 0.78, 0.06), brassMat, -0.08, 2.02, 1.01);
  part(group, new THREE.PlaneGeometry(1.42, 0.68), dialMat, -0.08, 2.02, 1.045);
  for (const kx of [-0.62, -0.2, 0.22, 0.64]) {
    const k = part(group, new THREE.CylinderGeometry(0.09, 0.09, 0.14, 12), brassMat, kx, 1.38, 1.05);
    k.rotation.x = Math.PI * 0.5;
  }

  part(group, new THREE.BoxGeometry(0.22, 1.24, 1.48), new THREE.MeshBasicMaterial({ color: 0xfff5a8 }), -1.12, 1.08, 0);
  const coilMat = new THREE.MeshBasicMaterial({ color: 0xff4512 });
  for (const cy of [0.76, 1.08, 1.38]) part(group, new THREE.BoxGeometry(0.26, 0.09, 1.36), coilMat, -1.14, cy, 0);

  const doorPivot = new THREE.Group();
  doorPivot.position.set(-1.2, 0.48, 0);
  part(doorPivot, new THREE.BoxGeometry(0.11, 1.22, 1.54), trimIronMat, 0, 0.61, 0);
  const dH = part(doorPivot, new THREE.CylinderGeometry(0.045, 0.045, 1.2, 10), brassMat, -0.1, 1.04, 0);
  dH.rotation.x = Math.PI * 0.5;
  group.add(doorPivot);

  const fireMat = createVolumetricFireMaterial();
  const flameGroup = new THREE.Group();
  flameGroup.position.set(-1.12, 1.08, 0);
  const makeJet = (pts, seg, rotX = 0) => {
    const g = new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
    g.rotateZ(Math.PI * 0.5);
    if (rotX) g.rotateX(rotX);
    const m = part(flameGroup, g, fireMat);
    m.userData.noShadow = true;
  };
  makeJet([[0.38, 0], [0.76, 0.65], [0.72, 1.8], [0.52, 3.1], [0.24, 4.15], [0.03, 4.75]], 20);
  makeJet([[0.24, 0], [0.48, 0.55], [0.42, 1.65], [0.22, 2.75], [0.02, 3.45]], 16, 1.1);
  const sheetGeo = new THREE.ConeGeometry(0.72, 4.6, 4, 14, true);
  sheetGeo.translate(0, 2.3, 0);
  sheetGeo.rotateZ(Math.PI * 0.5);
  part(flameGroup, sheetGeo, fireMat).userData.noShadow = true;
  flameGroup.visible = false;
  group.add(flameGroup);

  const fireLight = new THREE.PointLight(0xff7d1a, 2.4, 12);
  fireLight.position.set(-2.2, 1.5, 0.8);
  group.add(fireLight);

  enableShadow(group, true, true);
  return { group, doorPivot, flameGroup, fireMat, fireLight };
}

export function createCarvingKnifeMesh(scale = 1, withSlashArc = false) {
  const group = new THREE.Group();
  const brassMat = stdMat({ color: 0xfac343, metalness: 0.88, roughness: 0.2 });
  const steelMat = stdMat({ color: 0xf7fbff, metalness: 0.88, roughness: 0.1, emissive: 0x465d78, emissiveIntensity: 0.48 });

  part(group, new THREE.BoxGeometry(0.58, 0.16, 0.1), stdMat({ color: 0x4d1d09, roughness: 0.48 }), -0.46, 0, 0, 1.06);
  for (const rx of [-0.62, -0.46, -0.3]) {
    const rv = part(group, new THREE.CylinderGeometry(0.026, 0.026, 0.12, 8), brassMat, rx, 0.01, 0);
    rv.rotation.x = Math.PI * 0.5;
  }
  part(group, new THREE.BoxGeometry(0.11, 0.3, 0.13), brassMat, -0.14, 0, 0);

  const bShape = new THREE.Shape();
  bShape.moveTo(-0.1, 0.13);
  bShape.lineTo(1.42, 0.08);
  bShape.quadraticCurveTo(0.9, -0.16, -0.1, -0.18);
  bShape.closePath();
  const bGeo = new THREE.ExtrudeGeometry(bShape, { depth: 0.028, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.01, bevelSegments: 2 });
  bGeo.translate(0, 0, -0.014);
  part(group, bGeo, steelMat, 0, 0, 0, 1.045);

  const glint = part(group, new THREE.BoxGeometry(1.36, 0.032, 0.052), new THREE.MeshBasicMaterial({ color: 0xffffff }), 0.6, -0.08, 0);
  glint.rotation.z = 0.11;
  glint.userData.noShadow = true;

  if (withSlashArc) {
    const sl = part(group, new THREE.RingGeometry(1.16, 1.44, 20, 1, -0.65, 1.45), createKnifeSlashMaterial(), 0.28, 0, 0);
    sl.userData.noShadow = true;
  }

  group.scale.setScalar(scale);
  enableShadow(group, true, false);
  return group;
}

export function createCleaverPendulumMesh(height = 5.8) {
  const root = new THREE.Group();
  const pivot = new THREE.Group();
  pivot.position.y = height;
  root.add(pivot);
  const chainMat = stdMat({ color: 0x3b312e, metalness: 0.78, roughness: 0.36 });
  const steelMat = stdMat({ color: 0xf2f8ff, metalness: 0.9, roughness: 0.12, emissive: 0x3b4d63, emissiveIntensity: 0.38 });
  const rodLen = height - 1.5;
  part(pivot, new THREE.CylinderGeometry(0.055, 0.055, rodLen, 10), chainMat, 0, -rodLen * 0.5, 0);
  const h = part(pivot, new THREE.CylinderGeometry(0.095, 0.095, 0.68, 10), stdMat({ color: 0x692b12, roughness: 0.52 }), -0.56, -rodLen - 0.1, 0, 1.06);
  h.rotation.z = Math.PI * 0.5;
  part(pivot, new THREE.BoxGeometry(1.55, 1.12, 0.09), steelMat, 0.22, -rodLen - 0.36, 0, 1.04);
  const hole = part(pivot, new THREE.CylinderGeometry(0.11, 0.11, 0.12, 12), chainMat, 0.7, -rodLen - 0.04, 0);
  hole.rotation.x = Math.PI * 0.5;
  enableShadow(root, true, false);
  return { root, pivot, bobLocalY: -rodLen - 0.36 };
}

export function createSculptedPumpkinMesh(scale = 1) {
  const group = new THREE.Group();
  const pMat = stdMat({ color: 0xf26d16, roughness: 0.42, emissive: 0x2b0e00, emissiveIntensity: 0.12 });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const lobe = part(group, new THREE.SphereGeometry(0.38, 12, 10), pMat, Math.cos(a) * 0.18, 0.4, Math.sin(a) * 0.18);
    lobe.scale.set(0.88, 0.96, 1.12);
    lobe.rotation.y = -a;
  }
  const stemCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.72, 0), new THREE.Vector3(0.05, 0.92, 0.02), new THREE.Vector3(0.14, 1.0, 0.04)]);
  part(group, new THREE.TubeGeometry(stemCurve, 8, 0.06, 6, false), stdMat({ color: 0x456b20, roughness: 0.68 }));
  group.scale.setScalar(scale);
  enableShadow(group, true, true);
  return group;
}

export function createCoverPropMesh(kind, textures) {
  const group = new THREE.Group();
  if (kind === 'haystack') {
    const mat = stdMat({ map: textures.hayWeave, roughness: 0.82 });
    part(group, new THREE.ConeGeometry(1.48, 1.85, 16), mat, 0, 0.94, 0, 1.03);
    part(group, new THREE.SphereGeometry(1.42, 16, 12), mat, 0, 0.56, 0).scale.set(1, 0.64, 1);
  } else if (kind === 'pumpkinPatch') {
    const lm = stdMat({ color: 0x3b6b20, roughness: 0.74 });
    const lb = stdMat({ color: 0x55872c, roughness: 0.7 });
    for (const [lx, ly, lz, rx, ry, rz, b] of [[0, 0.52, 0, 1.05, 0.55, 0.9, 0], [-0.72, 0.42, 0.18, 0.72, 0.46, 0.65, 1], [0.74, 0.44, 0.14, 0.74, 0.48, 0.66, 1], [0, 0.38, -0.52, 0.85, 0.42, 0.6, 0]]) {
      part(group, new THREE.SphereGeometry(1, 12, 10), b ? lb : lm, lx, ly, lz).scale.set(rx, ry, rz);
    }
    for (const [px, pz, s] of [[-0.68, 0.56, 1.05], [0.68, 0.52, 0.92], [0.02, 0.74, 1.18]]) {
      const p = createSculptedPumpkinMesh(s);
      p.position.set(px, 0, pz);
      group.add(p);
    }
  } else if (kind === 'flourBarrel') {
    part(group, new THREE.CylinderGeometry(0.84, 0.88, 1.72, 16), stdMat({ map: textures.woodPlank, roughness: 0.62 }), 0, 0.86, 0, 1.03);
    const bm = stdMat({ color: 0x2e2624, metalness: 0.72, roughness: 0.38 });
    for (const by of [0.38, 1.38]) part(group, new THREE.TorusGeometry(0.86, 0.055, 8, 20), bm, 0, by, 0).rotation.x = Math.PI * 0.5;
  } else {
    part(group, new THREE.BoxGeometry(2.65, 0.22, 1.75), stdMat({ color: 0x703616, roughness: 0.52 }), 0, 1.56, 0);
    part(group, new THREE.BoxGeometry(2.54, 1.36, 1.66), stdMat({ map: textures.gingham, roughness: 0.58 }), 0, 0.82, 0, 1.02);
    part(group, new THREE.CylinderGeometry(0.54, 0.42, 0.18, 18), stdMat({ color: 0xeb9c34, roughness: 0.42 }), 0, 1.74, 0);
    part(group, new THREE.CylinderGeometry(0.46, 0.46, 0.04, 18), stdMat({ color: 0xc95216, roughness: 0.48 }), 0, 1.83, 0);
    part(group, new THREE.SphereGeometry(0.16, 10, 10), stdMat({ color: 0xfffaf0, roughness: 0.3 }), 0, 1.92, 0);
  }
  enableShadow(group, true, true);
  return group;
}

export function createKickPropMesh(kind) {
  const group = new THREE.Group();
  if (kind === 'flourSack') {
    const sm = stdMat({ color: 0xfbf3e3, roughness: 0.74 });
    part(group, new THREE.SphereGeometry(0.52, 16, 14), sm, 0, 0.52, 0, 1.04).scale.set(0.95, 1.14, 0.9);
    part(group, new THREE.CylinderGeometry(0.24, 0.16, 0.22, 12), stdMat({ color: 0xd42c1a, roughness: 0.48 }), 0, 1.06, 0);
    part(group, new THREE.ConeGeometry(0.26, 0.24, 10), sm, 0, 1.24, 0).rotation.x = Math.PI;
  } else if (kind === 'copperPot') {
    const cm = stdMat({ color: 0xe68036, metalness: 0.82, roughness: 0.2 });
    part(group, new THREE.CylinderGeometry(0.5, 0.46, 0.72, 16), cm, 0, 0.36, 0, 1.04);
    part(group, new THREE.TorusGeometry(0.5, 0.05, 8, 18), cm, 0, 0.72, 0).rotation.x = Math.PI * 0.5;
  } else {
    return createSculptedPumpkinMesh(1.05);
  }
  enableShadow(group, true, true);
  return group;
}

export function createPickupMesh(kind) {
  const group = new THREE.Group();
  if (kind === 'corn') {
    part(group, new THREE.CapsuleGeometry(0.14, 0.28, 8, 12), stdMat({ color: 0xffd236, roughness: 0.28, emissive: 0x6b4700, emissiveIntensity: 0.3 }));
    const hm = stdMat({ color: 0x4b8c26, roughness: 0.56 });
    for (const a of [-0.45, 0.45]) part(group, new THREE.ConeGeometry(0.12, 0.32, 7), hm, Math.sin(a) * 0.1, -0.1, 0).rotation.z = a;
    group.rotation.z = 0.24;
  } else if (kind === 'cranberry') {
    const bm = stdMat({ color: 0xed1c34, roughness: 0.16, metalness: 0.15, emissive: 0x5c0610, emissiveIntensity: 0.35 });
    for (const [x, y, z] of [[-0.14, 0, 0], [0.14, 0, 0], [0, 0.18, 0.05]]) part(group, new THREE.SphereGeometry(0.17, 12, 12), bm, x, y, z);
  } else {
    part(group, new THREE.BoxGeometry(0.28, 0.84, 0.07), stdMat({ color: 0xffe459, roughness: 0.2, metalness: 0.5, emissive: 0xad7200, emissiveIntensity: 0.45 }));
  }
  enableShadow(group, true, false);
  return group;
}

export function createExitGateMesh(isFinalFreedom, textures) {
  const group = new THREE.Group();
  const woodMat = stdMat({ map: textures.woodPlank, roughness: 0.58 });
  const goldMat = stdMat({ color: 0xffce4a, metalness: 0.78, roughness: 0.22, emissive: 0x734a00, emissiveIntensity: 0.3 });
  part(group, new THREE.BoxGeometry(0.75, 4.9, 0.75), woodMat, 0, 2.45, -2.55, 1.02);
  part(group, new THREE.BoxGeometry(0.75, 4.9, 0.75), woodMat, 0, 2.45, 2.55, 1.02);
  part(group, new THREE.BoxGeometry(0.92, 0.8, 6.1), isFinalFreedom ? goldMat : woodMat, 0, 5.0, 0, 1.02);

  if (isFinalFreedom) {
    for (const side of [-1, 1]) {
      part(group, new THREE.BoxGeometry(1.85, 4.3, 0.22), woodMat, 0.35, 2.15, side * 3.15).rotation.y = side * -1.35;
    }
  }
  const portal = part(
    group,
    new THREE.PlaneGeometry(4.35, 4.55),
    new THREE.MeshBasicMaterial({ color: isFinalFreedom ? 0xaaff8c : 0xffd86b, transparent: true, opacity: 0.36, side: THREE.DoubleSide }),
    0,
    2.28,
    0,
  );
  portal.rotation.y = Math.PI * 0.5;
  portal.userData.noShadow = true;

  const gateLight = new THREE.PointLight(isFinalFreedom ? 0xb4ff82 : 0xffcf59, 3.6, 15);
  gateLight.position.set(-1.0, 2.8, 0);
  group.add(gateLight);
  enableShadow(group, true, true);
  return group;
}
