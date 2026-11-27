// Hierarchical 3D Three.js character & prop rigs: Barnaby the Turkey, Farmer/Chef Jeb, 450°F Ovens, Knives, Cleavers, Props.

import * as THREE from 'three';

function enableShadow(root, cast = true, receive = true) {
  root.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = cast;
      obj.receiveShadow = receive;
    }
  });
  return root;
}

export function createTurkeyRig() {
  const root = new THREE.Group();
  const bodyPivot = new THREE.Group();
  root.add(bodyPivot);

  const chestnutMat = new THREE.MeshStandardMaterial({ color: 0x8f3a18, roughness: 0.58, metalness: 0.06 });
  const breastMat = new THREE.MeshStandardMaterial({ color: 0xb85824, roughness: 0.52 });
  const wingMat = new THREE.MeshStandardMaterial({ color: 0x752c12, roughness: 0.56 });
  const beakMat = new THREE.MeshStandardMaterial({ color: 0xf7b731, roughness: 0.35 });
  const wattleMat = new THREE.MeshStandardMaterial({ color: 0xe62222, roughness: 0.38, emissive: 0x3a0505 });
  const scarfMat = new THREE.MeshStandardMaterial({ color: 0xd4281c, roughness: 0.5 });
  const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x120804, roughness: 0.15 });
  const legMat = new THREE.MeshStandardMaterial({ color: 0xe87e1b, roughness: 0.45 });

  // Plump sculpted body + warm golden-bronze chest plumage
  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.58, 22, 18), chestnutMat);
  torso.scale.set(0.95, 0.86, 1.18);
  torso.position.set(0, 0.72, 0);
  bodyPivot.add(torso);

  const breast = new THREE.Mesh(new THREE.SphereGeometry(0.46, 18, 14), breastMat);
  breast.scale.set(0.88, 0.82, 0.9);
  breast.position.set(0, 0.74, 0.28);
  bodyPivot.add(breast);

  // Glorious 11-feather 3D iridescent Thanksgiving tail fan (angled so head & wattle silhouette cleanly above!)
  const tailFan = new THREE.Group();
  tailFan.position.set(0, 0.79, -0.55);
  tailFan.rotation.x = -0.56;
  bodyPivot.add(tailFan);

  const featherCols = [0x992416, 0xd45219, 0xf09224, 0xb83318, 0xf7ad2b, 0xd94818, 0xf7ad2b, 0xb83318, 0xf09224, 0xd45219, 0x992416];
  const tipMat = new THREE.MeshStandardMaterial({ color: 0xfff1cc, roughness: 0.42 });
  const bandMat = new THREE.MeshStandardMaterial({ color: 0x2e1008, roughness: 0.6 });

  for (let i = 0; i < 11; i++) {
    const fHolder = new THREE.Group();
    const t = (i - 5) / 5;
    fHolder.rotation.z = -t * 1.12;
    fHolder.position.z = -Math.abs(t) * 0.04;

    const fMat = new THREE.MeshStandardMaterial({ color: featherCols[i], roughness: 0.48 });
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.9, 0.04), fMat);
    shaft.position.y = 0.45;
    fHolder.add(shaft);

    const band = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.11, 0.045), bandMat);
    band.position.y = 0.74;
    fHolder.add(band);

    const tip = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.14, 0.045), tipMat);
    tip.position.y = 0.86;
    fHolder.add(tip);

    tailFan.add(fHolder);
  }

  // Articulated Left & Right Wings with golden primary flight tips (spread wide during Flutter Glide!)
  const wingTrimMat = new THREE.MeshStandardMaterial({ color: 0xf29f29, roughness: 0.44 });
  const leftWing = new THREE.Group();
  leftWing.position.set(-0.5, 0.82, 0.06);
  const lwMesh = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.42, 0.72), wingMat);
  lwMesh.position.set(-0.08, -0.06, -0.1);
  const lwTip = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.66), wingTrimMat);
  lwTip.position.set(-0.1, -0.24, -0.12);
  leftWing.add(lwMesh, lwTip);
  bodyPivot.add(leftWing);

  const rightWing = new THREE.Group();
  rightWing.position.set(0.5, 0.82, 0.06);
  const rwMesh = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.42, 0.72), wingMat);
  rwMesh.position.set(0.08, -0.06, -0.1);
  const rwTip = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.66), wingTrimMat);
  rwTip.position.set(0.1, -0.24, -0.12);
  rightWing.add(rwMesh, rwTip);
  bodyPivot.add(rightWing);

  // Proud Upright Neck, Heroic Crimson Scarf, Expressive Comic Head, Beak & Scarlet Wattle!
  const neckGroup = new THREE.Group();
  neckGroup.position.set(0, 1.12, 0.45);
  bodyPivot.add(neckGroup);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.22, 0.48, 14), chestnutMat);
  neck.position.y = 0.17;
  neckGroup.add(neck);

  const scarfCollar = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.07, 10, 18), scarfMat);
  scarfCollar.rotation.x = Math.PI * 0.5;
  scarfCollar.position.y = 0.05;
  neckGroup.add(scarfCollar);

  const scarfTail = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.065, 0.62), scarfMat);
  scarfTail.position.set(0, 0.05, -0.36);
  neckGroup.add(scarfTail);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 18, 16), breastMat);
  head.position.set(0, 0.48, 0.08);
  neckGroup.add(head);

  // Scarlet head crest tuft
  const crest = new THREE.Mesh(new THREE.ConeGeometry(0.095, 0.26, 8), wattleMat);
  crest.position.set(0, 0.78, 0.03);
  crest.rotation.x = -0.35;
  neckGroup.add(crest);

  // Sculpted golden beak
  const upperBeak = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.34, 10), beakMat);
  upperBeak.rotation.x = Math.PI * 0.5;
  upperBeak.position.set(0, 0.47, 0.41);
  neckGroup.add(upperBeak);

  // Iconic red snood & dangling throat wattle
  const wattlePivot = new THREE.Group();
  wattlePivot.position.set(0.05, 0.45, 0.33);
  const wattle = new THREE.Mesh(new THREE.CapsuleGeometry(0.078, 0.2, 6, 10), wattleMat);
  wattle.position.y = -0.13;
  wattlePivot.add(wattle);
  neckGroup.add(wattlePivot);

  // Big expressive 3D comic eyes (readable from front & 3/4 chase angles)
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), eyeWhiteMat);
    eye.position.set(side * 0.185, 0.53, 0.24);
    neckGroup.add(eye);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.056, 10, 10), pupilMat);
    pupil.position.set(side * 0.21, 0.53, 0.33);
    neckGroup.add(pupil);
  }

  // Articulated Left & Right Legs + Webbed Feet
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.2, 0.4, 0.04);
  const lShin = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.4, 8), legMat);
  lShin.position.y = -0.2;
  const lFoot = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.32), legMat);
  lFoot.position.set(0, -0.38, 0.06);
  leftLeg.add(lShin, lFoot);
  root.add(leftLeg);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.2, 0.4, 0.04);
  const rShin = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.4, 8), legMat);
  rShin.position.y = -0.2;
  const rFoot = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.32), legMat);
  rFoot.position.set(0, -0.38, 0.06);
  rightLeg.add(rShin, rFoot);
  root.add(rightLeg);

  // Hot-streak golden point light attached to Barnaby
  const auraLight = new THREE.PointLight(0xffb838, 0, 5.5);
  auraLight.position.set(0, 1.1, 0);
  root.add(auraLight);

  enableShadow(root, true, true);
  return {
    root,
    bodyPivot,
    tailFan,
    leftWing,
    rightWing,
    neckGroup,
    wattlePivot,
    scarfTail,
    leftLeg,
    rightLeg,
    auraLight,
  };
}

export function createFarmerRig(outfit, textures) {
  const root = new THREE.Group();
  const isChef = outfit === 'chef';

  const skinMat = new THREE.MeshStandardMaterial({ color: 0xf2b88e, roughness: 0.55 });
  const shirtMat = isChef
    ? new THREE.MeshStandardMaterial({ color: 0xfbf7ef, roughness: 0.48 })
    : new THREE.MeshStandardMaterial({ map: textures.plaid, roughness: 0.65 });
  const apronOrDenimMat = isChef
    ? new THREE.MeshStandardMaterial({ map: textures.gingham, roughness: 0.55 })
    : new THREE.MeshStandardMaterial({ color: 0x2e537d, roughness: 0.65 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: isChef ? 0x28262e : 0x264466, roughness: 0.7 });
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x3b1d0e, roughness: 0.6 });
  const beardMat = new THREE.MeshStandardMaterial({ color: 0x6e2d12, roughness: 0.65 });

  const bodyPivot = new THREE.Group();
  root.add(bodyPivot);

  // Burly barrel torso + overalls/gingham apron
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.62, 1.28, 18), shirtMat);
  torso.position.y = 1.48;
  bodyPivot.add(torso);

  const apron = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.65, 0.92, 18, 1, false, -Math.PI * 0.42, Math.PI * 0.84), apronOrDenimMat);
  apron.position.y = 1.32;
  bodyPivot.add(apron);

  // Sculpted comic head + bushy mustache + angry brows
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 2.42, 0.06);
  bodyPivot.add(headGroup);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 18, 16), skinMat);
  headGroup.add(head);

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), new THREE.MeshStandardMaterial({ color: 0xe36f56, roughness: 0.5 }));
  nose.position.set(0, -0.02, 0.4);
  headGroup.add(nose);

  const mustache = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.14, 0.18), beardMat);
  mustache.position.set(0, -0.14, 0.36);
  headGroup.add(mustache);

  // Eyes & furious angled brows
  const eyeWhite = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x120804 });
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 10), eyeWhite);
    eye.position.set(side * 0.16, 0.08, 0.35);
    headGroup.add(eye);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), pupilMat);
    pupil.position.set(side * 0.16, 0.08, 0.42);
    headGroup.add(pupil);

    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.08), beardMat);
    brow.position.set(side * 0.16, 0.19, 0.38);
    brow.rotation.z = -side * 0.32;
    headGroup.add(brow);
  }

  // Headgear: Tall Pleated Chef Toque OR Wide-Brimmed Straw Farm Hat!
  if (isChef) {
    const toqueMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.41, 0.4, 0.28, 18), toqueMat);
    band.position.y = 0.42;
    headGroup.add(band);
    const crown = new THREE.Mesh(new THREE.SphereGeometry(0.52, 18, 14), toqueMat);
    crown.scale.set(1, 0.85, 1);
    crown.position.y = 0.76;
    headGroup.add(crown);
  } else {
    const strawMat = new THREE.MeshStandardMaterial({ color: 0xe8b548, roughness: 0.65 });
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.82, 0.06, 20), strawMat);
    brim.position.y = 0.32;
    headGroup.add(brim);
    const dome = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.44, 0.34, 18), strawMat);
    dome.position.y = 0.48;
    headGroup.add(dome);
    const ribbon = new THREE.Mesh(new THREE.CylinderGeometry(0.445, 0.445, 0.09, 18), new THREE.MeshStandardMaterial({ color: 0xc4281c }));
    ribbon.position.y = 0.36;
    headGroup.add(ribbon);
  }

  // Right Arm wielding Giant Gleaming 3D Carving Knife!
  const rightArm = new THREE.Group();
  rightArm.position.set(-0.68, 1.95, 0.1);
  const rSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.15, 0.72, 12), shirtMat);
  rSleeve.position.y = -0.3;
  rSleeve.rotation.x = 0.85;
  rightArm.add(rSleeve);
  const giantKnife = createCarvingKnifeMesh(1.45);
  giantKnife.position.set(0, -0.52, 0.52);
  giantKnife.rotation.set(0.25, Math.PI * 0.5, 0);
  rightArm.add(giantKnife);
  bodyPivot.add(rightArm);

  // Left Arm holding Glowing Searchlight Lantern (Farmhand) OR Roasting Fork (Chef)!
  const leftArm = new THREE.Group();
  leftArm.position.set(0.68, 1.95, 0.1);
  const lSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.15, 0.68, 12), shirtMat);
  lSleeve.position.y = -0.28;
  lSleeve.rotation.x = 0.65;
  leftArm.add(lSleeve);

  const lanternGlow = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.14, 0.28, 12),
    new THREE.MeshStandardMaterial({ color: 0xffe484, emissive: 0xffa824, emissiveIntensity: 1.8 }),
  );
  lanternGlow.position.set(0, -0.56, 0.36);
  leftArm.add(lanternGlow);
  bodyPivot.add(leftArm);

  // Heavy stomping legs & boots
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.28, 0.85, 0);
  const lPant = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.18, 0.65, 12), pantsMat);
  lPant.position.y = -0.32;
  const lBoot = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.26, 0.52), bootMat);
  lBoot.position.set(0, -0.72, 0.08);
  leftLeg.add(lPant, lBoot);
  root.add(leftLeg);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.28, 0.85, 0);
  const rPant = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.18, 0.65, 12), pantsMat);
  rPant.position.y = -0.32;
  const rBoot = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.26, 0.52), bootMat);
  rBoot.position.set(0, -0.72, 0.08);
  rightLeg.add(rPant, rBoot);
  root.add(rightLeg);

  // Real 3D Volumetric Vision / Threat Cone projected on the floor!
  const coneGeo = new THREE.ConeGeometry(2.6, 6.2, 24, 1, true);
  coneGeo.rotateX(Math.PI * 0.5);
  coneGeo.translate(0, 0.08, 3.2);
  const coneMat = new THREE.MeshBasicMaterial({
    color: 0xff451f,
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const threatCone = new THREE.Mesh(coneGeo, coneMat);
  root.add(threatCone);

  enableShadow(root, true, true);
  threatCone.castShadow = false;
  threatCone.receiveShadow = false;

  return { root, bodyPivot, headGroup, head, skinMat, rightArm, leftArm, leftLeg, rightLeg, threatCone, coneMat };
}

export function createRoastingOvenMesh(facingDir = 1) {
  const group = new THREE.Group();

  const ironMat = new THREE.MeshStandardMaterial({ color: 0x262224, roughness: 0.42, metalness: 0.68 });
  const copperMat = new THREE.MeshStandardMaterial({ color: 0xd97a36, roughness: 0.28, metalness: 0.78 });
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xf5ba3d, roughness: 0.25, metalness: 0.82 });
  const fireCoreMat = new THREE.MeshBasicMaterial({ color: 0xfff08a });
  const dialMat = new THREE.MeshStandardMaterial({ color: 0xe62e17, emissive: 0xb81d0a, emissiveIntensity: 0.85 });

  // Heavy cast-iron stove body
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.35, 2.1), ironMat);
  chassis.position.y = 1.24;
  group.add(chassis);

  // Polished copper mantle top & chimney pipe
  const mantle = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.2, 2.3), copperMat);
  mantle.position.y = 2.45;
  group.add(mantle);

  const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 1.35, 14), ironMat);
  chimney.position.set(-facingDir * 0.55, 3.12, -0.45);
  group.add(chimney);

  // Red 450°F dial plaque & brass burner knobs
  const plaque = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.34, 0.82), dialMat);
  plaque.position.set(facingDir * 1.14, 2.08, -0.32);
  group.add(plaque);

  for (const kz of [0.36, 0.7]) {
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.14, 12), brassMat);
    knob.rotation.z = Math.PI * 0.5;
    knob.position.set(facingDir * 1.16, 2.08, kz);
    group.add(knob);
  }

  // Glowing interior firebox cavity + red-hot heating coils
  const firebox = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.18, 1.48), fireCoreMat);
  firebox.position.set(facingDir * 1.08, 1.06, 0);
  group.add(firebox);

  const coilMat = new THREE.MeshBasicMaterial({ color: 0xff3b0a });
  for (const cy of [0.76, 1.06, 1.34]) {
    const coil = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.08, 1.38), coilMat);
    coil.position.set(facingDir * 1.1, cy, 0);
    group.add(coil);
  }

  // Hinged 3D Cast-Iron Door with brass handle bar (swings downward when blasting!)
  const doorPivot = new THREE.Group();
  doorPivot.position.set(facingDir * 1.16, 0.48, 0);
  const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.18, 1.54), ironMat);
  doorMesh.position.y = 0.59;
  const doorHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.18, 10), brassMat);
  doorHandle.rotation.x = Math.PI * 0.5;
  doorHandle.position.set(facingDir * 0.1, 1.02, 0);
  doorPivot.add(doorMesh, doorHandle);
  group.add(doorPivot);

  // Multi-Layered Volumetric 3D Roaring Flame Jet Cones!
  const flameGroup = new THREE.Group();
  flameGroup.position.set(facingDir * 1.18, 1.05, 0);

  const outerFlameGeo = new THREE.ConeGeometry(0.76, 4.5, 16);
  outerFlameGeo.rotateZ(-facingDir * Math.PI * 0.5);
  outerFlameGeo.translate(facingDir * 2.25, 0, 0);
  const outerFlameMat = new THREE.MeshBasicMaterial({
    color: 0xff3d08,
    transparent: true,
    opacity: 0.78,
  });
  const outerFlame = new THREE.Mesh(outerFlameGeo, outerFlameMat);

  const midFlameGeo = new THREE.ConeGeometry(0.54, 3.6, 14);
  midFlameGeo.rotateZ(-facingDir * Math.PI * 0.5);
  midFlameGeo.translate(facingDir * 1.8, 0.04, 0);
  const midFlame = new THREE.Mesh(
    midFlameGeo,
    new THREE.MeshBasicMaterial({ color: 0xff941a, transparent: true, opacity: 0.88 }),
  );

  const innerFlameGeo = new THREE.ConeGeometry(0.32, 2.55, 12);
  innerFlameGeo.rotateZ(-facingDir * Math.PI * 0.5);
  innerFlameGeo.translate(facingDir * 1.28, 0.06, 0);
  const innerFlameMat = new THREE.MeshBasicMaterial({
    color: 0xfff8b8,
    transparent: true,
    opacity: 0.96,
  });
  const innerFlame = new THREE.Mesh(innerFlameGeo, innerFlameMat);

  // Side flame tongues for organic fiery silhouette
  for (const sideZ of [-0.36, 0.36]) {
    const tGeo = new THREE.ConeGeometry(0.28, 2.7, 10);
    tGeo.rotateZ(-facingDir * Math.PI * 0.5);
    tGeo.translate(facingDir * 1.45, -0.05, sideZ);
    const tongue = new THREE.Mesh(
      tGeo,
      new THREE.MeshBasicMaterial({ color: 0xff6e14, transparent: true, opacity: 0.82 }),
    );
    tongue.rotation.y = sideZ * facingDir * 0.14;
    flameGroup.add(tongue);
  }

  flameGroup.add(outerFlame, midFlame, innerFlame);
  flameGroup.visible = false;
  group.add(flameGroup);

  // Dynamic warm firelight PointLight illuminating the surrounding 3D tiles & characters!
  const fireLight = new THREE.PointLight(0xff771c, 2.2, 11);
  fireLight.position.set(facingDir * 1.8, 1.3, 0);
  group.add(fireLight);

  enableShadow(group, true, true);
  flameGroup.traverse((m) => {
    if (m.isMesh) {
      m.castShadow = false;
      m.receiveShadow = false;
    }
  });

  return { group, doorPivot, flameGroup, outerFlame, innerFlame, fireLight };
}

export function createCarvingKnifeMesh(scale = 1) {
  const group = new THREE.Group();

  const handleMat = new THREE.MeshStandardMaterial({ color: 0x4d1e0a, roughness: 0.5 });
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xf5be42, metalness: 0.86, roughness: 0.22 });
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xf4f9ff,
    metalness: 0.86,
    roughness: 0.12,
    emissive: 0x3b4f66,
    emissiveIntensity: 0.42,
  });
  const edgeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  // Ergonomic walnut handle + 3 brass rivets
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.15, 0.1), handleMat);
  handle.position.x = -0.46;
  group.add(handle);

  for (const rx of [-0.62, -0.46, -0.3]) {
    const rivet = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.115, 8), brassMat);
    rivet.rotation.x = Math.PI * 0.5;
    rivet.position.set(rx, 0.01, 0);
    group.add(rivet);
  }

  // Forged brass finger bolster
  const bolster = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.28, 0.13), brassMat);
  bolster.position.x = -0.14;
  group.add(bolster);

  // True forged chef's carving blade silhouette (straight spine + sweeping curved razor belly to needle point!)
  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(-0.1, 0.12);
  bladeShape.lineTo(1.36, 0.07);
  bladeShape.quadraticCurveTo(0.88, -0.15, -0.1, -0.17);
  bladeShape.closePath();

  const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, {
    depth: 0.028,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.01,
    bevelSegments: 2,
  });
  bladeGeo.translate(0, 0, -0.014);
  const blade = new THREE.Mesh(bladeGeo, steelMat);
  group.add(blade);

  // Gleaming white razor-edge glint strip
  const glint = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.028, 0.048), edgeMat);
  glint.position.set(0.58, -0.08, 0);
  glint.rotation.z = 0.11;
  group.add(glint);

  group.scale.setScalar(scale);
  enableShadow(group, true, false);
  glint.castShadow = false;
  return group;
}

export function createCleaverPendulumMesh(height = 5.4) {
  const root = new THREE.Group();
  const pivot = new THREE.Group();
  pivot.position.y = height;
  root.add(pivot);

  const chainMat = new THREE.MeshStandardMaterial({ color: 0x38302e, metalness: 0.75, roughness: 0.4 });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0xeaf2fa, metalness: 0.9, roughness: 0.14 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x6b2f14, roughness: 0.55 });

  const rodLen = height - 1.35;
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, rodLen, 10), chainMat);
  rod.position.y = -rodLen * 0.5;
  pivot.add(rod);

  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.65, 10), woodMat);
  handle.position.set(0, -rodLen - 0.1, -0.55);
  handle.rotation.x = Math.PI * 0.5;
  pivot.add(handle);

  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.15, 1.55), steelMat);
  blade.position.set(0, -rodLen - 0.35, 0.25);
  pivot.add(blade);

  enableShadow(root, true, false);
  return { root, pivot, bobLocalY: -rodLen - 0.35 };
}

export function createCoverPropMesh(kind, textures) {
  const group = new THREE.Group();
  if (kind === 'haystack') {
    const mat = new THREE.MeshStandardMaterial({ map: textures.hayWeave, roughness: 0.85 });
    const mound = new THREE.Mesh(new THREE.ConeGeometry(1.42, 1.68, 16), mat);
    mound.position.y = 0.84;
    const base = new THREE.Mesh(new THREE.SphereGeometry(1.36, 16, 12), mat);
    base.scale.set(1, 0.62, 1);
    base.position.y = 0.52;
    group.add(mound, base);
  } else if (kind === 'pumpkinPatch') {
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x3b6922, roughness: 0.74 });
    const leafLightMat = new THREE.MeshStandardMaterial({ color: 0x52822c, roughness: 0.72 });
    for (const [lx, ly, lz, rx, ry, rz, lite] of [
      [0, 0.48, 0, 0.92, 0.52, 0.88, false],
      [-0.62, 0.38, -0.25, 0.68, 0.45, 0.65, true],
      [0.64, 0.4, -0.18, 0.66, 0.46, 0.62, true],
      [0.05, 0.36, -0.58, 0.72, 0.42, 0.58, false],
    ]) {
      const tuft = new THREE.Mesh(new THREE.SphereGeometry(1.0, 12, 10), lite ? leafLightMat : leafMat);
      tuft.scale.set(rx, ry, rz);
      tuft.position.set(lx, ly, lz);
      group.add(tuft);
    }
    for (const [px, pz, s] of [[-0.68, 0.52, 0.52], [0.68, 0.46, 0.46], [0.02, 0.72, 0.58], [-0.15, -0.45, 0.44]]) {
      const p = createKickPropMesh('pumpkin');
      p.scale.setScalar(s / 0.46);
      p.position.set(px, 0, pz);
      group.add(p);
    }
  } else if (kind === 'flourBarrel') {
    const oakMat = new THREE.MeshStandardMaterial({ map: textures.woodPlank, roughness: 0.65 });
    const bandMat = new THREE.MeshStandardMaterial({ color: 0x2e2624, metalness: 0.7, roughness: 0.4 });
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.86, 1.65, 16), oakMat);
    barrel.position.y = 0.82;
    const b1 = new THREE.Mesh(new THREE.TorusGeometry(0.84, 0.05, 8, 20), bandMat);
    b1.rotation.x = Math.PI * 0.5;
    b1.position.y = 1.32;
    const b2 = b1.clone();
    b2.position.y = 0.36;
    group.add(barrel, b1, b2);
  } else {
    // Festive Gingham Thanksgiving Kitchen Table topped with a Golden Pumpkin Pie!
    const clothMat = new THREE.MeshStandardMaterial({ map: textures.gingham, roughness: 0.62 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x6e3516, roughness: 0.55 });
    const top = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.22, 1.85), woodMat);
    top.position.y = 1.54;
    const drape = new THREE.Mesh(new THREE.BoxGeometry(2.42, 1.32, 1.78), clothMat);
    drape.position.y = 0.82;
    // Pumpkin pie on top!
    const pieCrust = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.38, 0.16, 16), new THREE.MeshStandardMaterial({ color: 0xd98a2b }));
    pieCrust.position.set(0, 1.72, 0);
    const cream = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), new THREE.MeshStandardMaterial({ color: 0xfff9eb }));
    cream.position.set(0, 1.84, 0);
    group.add(top, drape, pieCrust, cream);
  }
  enableShadow(group, true, true);
  return group;
}

export function createKickPropMesh(kind) {
  const group = new THREE.Group();
  if (kind === 'flourSack') {
    const sackMat = new THREE.MeshStandardMaterial({ color: 0xf7eedc, roughness: 0.78 });
    const tieMat = new THREE.MeshStandardMaterial({ color: 0xc93322, roughness: 0.5 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.52, 14, 12), sackMat);
    body.scale.set(0.95, 1.12, 0.88);
    body.position.y = 0.52;
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.16, 0.22, 12), tieMat);
    neck.position.y = 1.05;
    group.add(body, neck);
  } else if (kind === 'copperPot') {
    const copMat = new THREE.MeshStandardMaterial({ color: 0xe07b34, metalness: 0.78, roughness: 0.24 });
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.46, 0.72, 16), copMat);
    pot.position.y = 0.36;
    group.add(pot);
  } else {
    // Plump Harvest Pumpkin
    const pMat = new THREE.MeshStandardMaterial({ color: 0xeb6e1a, roughness: 0.46 });
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x4d6e24, roughness: 0.7 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 12), pMat);
    body.scale.set(1.08, 0.86, 1.08);
    body.position.y = 0.43;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.24, 8), stemMat);
    stem.position.y = 0.88;
    group.add(body, stem);
  }
  enableShadow(group, true, true);
  return group;
}

export function createPickupMesh(kind) {
  const group = new THREE.Group();
  if (kind === 'corn') {
    const cob = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.13, 0.28, 8, 12),
      new THREE.MeshStandardMaterial({ color: 0xffcf33, roughness: 0.3, emissive: 0x5c3d00 }),
    );
    const huskMat = new THREE.MeshStandardMaterial({ color: 0x4e8c28, roughness: 0.58 });
    for (const angle of [-0.42, 0.42]) {
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.32, 7), huskMat);
      leaf.position.set(Math.sin(angle) * 0.1, -0.1, 0);
      leaf.rotation.z = angle;
      group.add(leaf);
    }
    group.add(cob);
    group.rotation.z = 0.22;
  } else if (kind === 'cranberry') {
    const mat = new THREE.MeshStandardMaterial({ color: 0xe61e32, roughness: 0.18, metalness: 0.15, emissive: 0x4a040c });
    for (const [x, y, z] of [[-0.14, 0, 0], [0.14, 0, 0], [0, 0.18, 0.06]]) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), mat);
      b.position.set(x, y, z);
      group.add(b);
    }
  } else {
    // Radiant Golden Turkey Feather!
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffe052,
      roughness: 0.22,
      metalness: 0.45,
      emissive: 0x996300,
    });
    const plume = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.82, 0.06), mat);
    group.add(plume);
  }
  enableShadow(group, true, false);
  return group;
}

export function createExitGateMesh(isFinalFreedom, textures) {
  const group = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ map: textures.woodPlank, roughness: 0.6 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xffcb47, metalness: 0.75, roughness: 0.25, emissive: 0x664200 });

  const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(0.65, 4.6, 0.65), woodMat);
  leftPillar.position.set(-2.3, 2.3, 0);
  const rightPillar = leftPillar.clone();
  rightPillar.position.x = 2.3;
  const arch = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.72, 0.85), isFinalFreedom ? goldMat : woodMat);
  arch.position.set(0, 4.65, 0);

  const portalMat = new THREE.MeshBasicMaterial({
    color: isFinalFreedom ? 0x9eff82 : 0xffd466,
    transparent: true,
    opacity: 0.46,
    side: THREE.DoubleSide,
  });
  const portal = new THREE.Mesh(new THREE.PlaneGeometry(3.95, 4.3), portalMat);
  portal.position.set(0, 2.15, 0);

  const gateLight = new THREE.PointLight(isFinalFreedom ? 0xa8ff78 : 0xffcb52, 3.2, 14);
  gateLight.position.set(0, 2.6, -1.2);

  group.add(leftPillar, rightPillar, arch, portal, gateLight);
  enableShadow(group, true, true);
  portal.castShadow = false;
  return group;
}
