// 3D arena-corridor dimensions, physics tuning, 4 escalating Thanksgiving stages, and Escape Perks.

export const VIEWPORT = {
  width: 1280,
  height: 720,
};

export const WORLD = {
  laneHalfWidth: 6.8,   // Playable X range: -6.8 .. +6.8 (13.6m wide 3D courtyard/kitchen!)
  wallX: 7.6,
};

export const PHYSICS = {
  gravity: 28.0,
  flutterGravity: 5.4,
  maxFallSpeed: 16.5,
  maxFlutterFall: 2.6,
  accel: 54.0,
  airAccel: 34.0,
  friction: 36.0,
  maxRunSpeed: 10.8,
  jumpVelocity: 12.2,
  coyoteTime: 0.13,
  jumpBufferTime: 0.14,
  dashSpeed: 21.5,
  dashDuration: 0.24,
  dashCooldown: 0.62,
  dashCost: 32,
  flutterDrainPerSec: 34,
  staminaMax: 100,
  staminaRegenPerSec: 32,
  invulnDuration: 1.45,
  kickRange: 3.1,
  kickCooldown: 0.45,
  gobbleCooldown: 1.5,
  closeShaveDist: 1.85,
  closeShaveCooldown: 0.72,
};

export const SCORE_VALUES = {
  corn: 50,
  cranberry: 85,
  goldenFeather: 220,
  closeShave: 150,
  ambushSlip: 200,
  farmerStun: 250,
  flourBlind: 320,
  stageClear: 650,
  freedomBonus: 1600,
  lifeBonus: 400,
};

export const PALETTE = {
  ink: '#240e06',
  cream: '#fff7e2',
  parchment: '#f6e4be',
  gold: '#ffca45',
  amber: '#eb7b22',
  crimson: '#cf2a1e',
};

export const PERK_DEFS = [
  {
    id: 'cranberry_dash',
    name: 'Cranberry Turbo',
    short: 'TURBO DASH',
    desc: '+25% Dash speed & -30% stamina cost',
    color: '#ff5263',
  },
  {
    id: 'tailwind_flutter',
    name: 'Golden Wing Lift',
    short: 'HIGH FLUTTER',
    desc: 'Higher jump & slower Flutter glide descent',
    color: '#ffd24d',
  },
  {
    id: 'flour_blast',
    name: 'Super Flour Bomb',
    short: 'MEGA STUN',
    desc: '+50% stun duration & wider Gobble knife deflect',
    color: '#9be858',
  },
  {
    id: 'extra_plumage',
    name: 'Iron Tail Plume',
    short: '+1 FEATHER LIFE',
    desc: 'Restores +1 Feather Life & +25 max stamina',
    color: '#ffa336',
  },
];

export const STAGE_DEFS = [
  {
    id: 'farmyard',
    index: 0,
    name: 'Autumn Farmyard',
    shortName: 'FARMYARD',
    subtitle: 'Outrun Farmer Jeb past the red barn, haystacks & smokehouse ovens!',
    length: 118,
    theme: 'farmyard',
    farmerOutfit: 'farmhand',
    farmerSpeed: 9.2,
    farmerKnifeInterval: 3.0,
    volleyInterval: 2.6,
    skyColor: 0xd96b27,
    fogColor: 0xc9682b,
    fogDensity: 0.011,
    sunColor: 0xffe29a,
    sunIntensity: 2.5,
  },
  {
    id: 'barn',
    index: 1,
    name: 'Harvest Timber Barn',
    shortName: 'BARN',
    subtitle: 'Weave under swinging butcher cleavers, kick flour sacks & hide in hay!',
    length: 126,
    theme: 'barn',
    farmerOutfit: 'farmhand',
    farmerSpeed: 9.75,
    farmerKnifeInterval: 2.55,
    volleyInterval: 2.25,
    skyColor: 0x3b1a0d,
    fogColor: 0x4a2211,
    fogDensity: 0.014,
    sunColor: 0xffc966,
    sunIntensity: 2.1,
  },
  {
    id: 'kitchen',
    index: 2,
    name: '450°F Roasting Kitchen',
    shortName: 'KITCHEN',
    subtitle: 'Chef Jeb is armed! Dodge roaring 450°F cast-iron ovens & carving knives!',
    length: 134,
    theme: 'kitchen',
    farmerOutfit: 'chef',
    farmerSpeed: 10.25,
    farmerKnifeInterval: 2.15,
    volleyInterval: 1.9,
    skyColor: 0x421b12,
    fogColor: 0x522316,
    fogDensity: 0.012,
    sunColor: 0xffd28a,
    sunIntensity: 2.25,
  },
  {
    id: 'banquet',
    index: 3,
    name: 'Grand Banquet Escape',
    shortName: 'BANQUET',
    subtitle: 'Final sprint past the feast tables to smash out the Freedom Gate!',
    length: 132,
    theme: 'banquet',
    farmerOutfit: 'chef',
    farmerSpeed: 10.65,
    farmerKnifeInterval: 1.85,
    volleyInterval: 1.65,
    skyColor: 0x1a1c36,
    fogColor: 0x2c1b29,
    fogDensity: 0.012,
    sunColor: 0xffe6a8,
    sunIntensity: 2.35,
  },
];

export const STORAGE_KEYS = {
  bestScore: 'gobble_break_3d_best_v1',
};
