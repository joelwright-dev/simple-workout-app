// The seed program. This is the one file to edit to add/reorder rungs or
// tweak ranges — the engine and UI are fully data-driven from here.
//
// To add a rung: insert a Rung object into the slot's `ladder` array at the
// right difficulty position (index 0 = easiest). Give it a `searchTerm` and run
// `npm run resolve-media` to (re)generate data/media.json.

import type { SessionDef, Slot } from "@/lib/types";

const DEFAULT_RANGE: [number, number] = [5, 12];

export const SLOTS: Slot[] = [
  {
    id: "squat",
    pattern: "Knee-dominant squat",
    sets: 3,
    unit: "reps",
    range: DEFAULT_RANGE,
    perSide: false,
    ladder: [
      {
        name: "Assisted squat",
        cues: ["Hold a table/door frame", "Sit straight down", "Drive through heels"],
        searchTerm: "assisted bodyweight squat",
      },
      {
        name: "Bodyweight squat",
        cues: ["Feet shoulder-width", "Hips back", "Chest tall"],
        searchTerm: "bodyweight squat",
      },
      {
        name: "Tempo squat",
        cues: ["3 seconds down", "No bounce at the bottom"],
        searchTerm: "tempo squat",
      },
      {
        name: "Paused squat",
        cues: ["2-second pause at the bottom", "Stay tight"],
        searchTerm: "pause squat",
      },
      {
        name: "Split squat",
        cues: ["Long stance", "Drop the back knee", "Torso upright"],
        searchTerm: "split squat",
      },
      {
        name: "Skater squat",
        cues: ["Balance on one leg", "Reach back knee toward floor"],
        searchTerm: "skater squat",
      },
      {
        name: "Pistol progression",
        cues: ["One leg to a chair", "Work toward full depth"],
        searchTerm: "pistol squat",
      },
    ],
  },
  {
    id: "singleleg",
    pattern: "Single-leg / split squat",
    sets: 3,
    unit: "reps",
    range: DEFAULT_RANGE,
    perSide: true,
    ladder: [
      {
        name: "Reverse lunge",
        cues: ["Step back", "Lower the back knee", "Push through front heel"],
        searchTerm: "bodyweight reverse lunge",
      },
      {
        name: "Walking lunge",
        cues: ["Step forward into a lunge", "Push up and bring the back leg through", "Torso tall"],
        searchTerm: "bodyweight walking lunge",
      },
      {
        name: "Split squat",
        cues: ["Static stance", "Controlled depth"],
        searchTerm: "split squat",
      },
      {
        name: "Bulgarian split squat",
        cues: ["Rear foot on a chair", "Weight on the front leg"],
        searchTerm: "bulgarian split squat",
      },
      {
        name: "Deficit Bulgarian split squat",
        cues: ["Front foot raised", "Deeper stretch"],
        searchTerm: "deficit bulgarian split squat",
      },
      {
        name: "Shrimp squat",
        cues: ["Hold rear foot", "Lower the trailing knee toward the floor"],
        searchTerm: "shrimp squat",
      },
    ],
  },
  {
    id: "hpush",
    pattern: "Horizontal push",
    sets: 3,
    unit: "reps",
    range: DEFAULT_RANGE,
    perSide: false,
    ladder: [
      {
        name: "Wall push-up",
        cues: ["Hands on wall", "Body in a straight line"],
        searchTerm: "wall push up",
      },
      {
        name: "Incline push-up",
        cues: ["Hands on a table", "Higher is easier"],
        searchTerm: "incline push up",
      },
      {
        name: "Knee push-up",
        cues: ["Knees down", "Straight line knees-to-head"],
        searchTerm: "kneeling push up",
      },
      {
        name: "Full push-up",
        cues: ["Rigid body", "Elbows ~45° from torso"],
        searchTerm: "push up",
      },
      {
        name: "Feet-elevated push-up",
        cues: ["Feet on a chair", "More load forward"],
        searchTerm: "decline push up",
      },
      {
        name: "Diamond push-up",
        cues: ["Hands together under the chest"],
        searchTerm: "diamond push up",
      },
      {
        name: "Archer push-up",
        cues: ["Shift weight onto one arm", "Other arm straight"],
        searchTerm: "archer push up",
      },
      {
        name: "One-arm push-up progression",
        cues: ["Wide stance", "Work toward one arm"],
        searchTerm: "one arm push up",
      },
    ],
  },
  {
    id: "vpush",
    pattern: "Vertical push (shoulders)",
    sets: 3,
    unit: "reps",
    range: DEFAULT_RANGE,
    perSide: false,
    ladder: [
      {
        name: "Incline pike push-up",
        cues: ["Hands elevated", "Hips piked high"],
        searchTerm: "incline pike push up",
      },
      {
        name: "Floor pike push-up",
        cues: ["Hips high", "Lower the crown of head toward floor"],
        searchTerm: "pike push up",
      },
      {
        name: "Feet-elevated pike push-up",
        cues: ["Feet on a chair", "Torso more vertical"],
        searchTerm: "elevated pike push up",
      },
      {
        name: "Wall handstand negative",
        cues: ["Kick to wall", "Lower slowly under control"],
        searchTerm: "wall handstand push up negative",
      },
      {
        name: "Wall handstand push-up",
        cues: ["Press back up against the wall"],
        searchTerm: "wall handstand push up",
      },
    ],
  },
  {
    id: "hpull",
    pattern: "Horizontal pull",
    sets: 3,
    unit: "reps",
    range: DEFAULT_RANGE,
    perSide: false,
    ladder: [
      {
        name: "Upright door/towel row",
        cues: ["Towel round both door handles", "Lean back slightly", "Pull chest in"],
        searchTerm: "towel door row",
      },
      {
        name: "Inclined door row",
        cues: ["Walk feet forward", "More horizontal angle"],
        searchTerm: "inverted row",
      },
      {
        name: "Table row, knees bent",
        cues: ["Lie under a sturdy table", "Grip the edge", "Pull chest up"],
        searchTerm: "inverted row",
      },
      {
        name: "Table row, legs straight",
        cues: ["Body in one straight line", "Heels on floor"],
        searchTerm: "inverted row",
      },
      {
        name: "Feet-elevated table row",
        cues: ["Feet on a chair", "Harder angle"],
        searchTerm: "feet elevated inverted row",
      },
      {
        name: "Archer row",
        cues: ["Pull toward one hand", "Other arm straightens"],
        searchTerm: "archer inverted row",
      },
      {
        name: "One-arm row progression",
        cues: ["Work toward pulling with a single arm"],
        searchTerm: "one arm inverted row",
      },
    ],
  },
  {
    id: "hinge",
    pattern: "Hip hinge / glutes",
    sets: 3,
    unit: "reps",
    range: DEFAULT_RANGE,
    perSide: false,
    ladder: [
      {
        name: "Glute bridge",
        cues: ["Drive hips up", "Squeeze glutes hard at the top"],
        searchTerm: "glute bridge",
      },
      {
        name: "Feet-elevated glute bridge",
        cues: ["Heels on a chair", "Bigger range"],
        searchTerm: "elevated glute bridge",
      },
      {
        name: "Single-leg glute bridge",
        cues: ["One foot down", "Keep hips level (alternate sides)"],
        searchTerm: "single leg glute bridge",
      },
      {
        name: "Long-lever bridge",
        cues: ["Heels further out", "Harder lever"],
        searchTerm: "glute bridge",
      },
    ],
  },
  {
    id: "hamstring",
    pattern: "Hamstring (posterior chain)",
    sets: 3,
    unit: "reps",
    range: [3, 8],
    perSide: false,
    ladder: [
      {
        name: "Anchored Nordic negative",
        cues: ["Feet hooked under a couch", "Lower slowly", "Push back up with hands"],
        searchTerm: "nordic hamstring curl",
      },
      {
        name: "Assisted Nordic",
        cues: ["Push off the floor less", "Control the descent"],
        searchTerm: "nordic hamstring curl",
      },
      {
        name: "Full Nordic curl",
        cues: ["Lower and pull back up unassisted"],
        searchTerm: "nordic hamstring curl",
      },
    ],
  },
  {
    id: "coreA",
    pattern: "Anti-extension core",
    sets: 3,
    unit: "seconds",
    range: [20, 45],
    perSide: false,
    ladder: [
      {
        name: "Plank",
        cues: ["Straight line head-to-heels", "Brace the abs"],
        searchTerm: "plank",
      },
      {
        name: "Long-lever plank",
        cues: ["Elbows forward of the shoulders"],
        searchTerm: "long lever plank",
      },
      {
        name: "RKC plank",
        cues: ["Maximum full-body tension", "Glutes + abs squeezed"],
        searchTerm: "rkc plank",
      },
      {
        name: "Hollow hold",
        cues: ["Low back pressed to floor", "Arms and legs extended"],
        searchTerm: "hollow body hold",
      },
      {
        name: "Hollow rocks",
        cues: ["Hold the hollow shape", "Rock gently (time the set)"],
        searchTerm: "hollow rock",
      },
    ],
  },
  {
    id: "coreB",
    pattern: "Anti-rotation core",
    sets: 3,
    unit: "seconds",
    range: [20, 45],
    perSide: true,
    ladder: [
      {
        name: "Side plank",
        cues: ["Stack the hips", "Straight line", "Don't let hips drop"],
        searchTerm: "side plank",
      },
      {
        name: "Side plank with reach",
        cues: ["Thread the top arm under and back out"],
        searchTerm: "side plank rotation",
      },
      {
        name: "Copenhagen plank",
        cues: ["Top foot on a chair", "Lift the bottom leg"],
        searchTerm: "copenhagen plank",
      },
    ],
  },
  {
    id: "bwsquat",
    pattern: "Bodyweight squat",
    sets: 3,
    unit: "reps",
    range: DEFAULT_RANGE,
    perSide: false,
    ladder: [
      {
        name: "Bodyweight squat",
        cues: ["Feet shoulder-width", "Hips back", "Chest tall"],
        searchTerm: "bodyweight squat",
      },
      {
        name: "Tempo squat",
        cues: ["3 seconds down", "No bounce at the bottom"],
        searchTerm: "tempo squat",
      },
      {
        name: "Paused squat",
        cues: ["2-second pause at the bottom", "Stay tight"],
        searchTerm: "pause squat",
      },
    ],
  },
  {
    id: "pushup",
    pattern: "Push-up",
    sets: 3,
    unit: "reps",
    range: DEFAULT_RANGE,
    perSide: false,
    ladder: [
      {
        name: "Push-up",
        cues: ["Rigid body", "Elbows ~45° from torso", "Full range"],
        searchTerm: "push up",
      },
      {
        name: "Diamond push-up",
        cues: ["Hands together under the chest"],
        searchTerm: "diamond push up",
      },
      {
        name: "Archer push-up",
        cues: ["Shift weight onto one arm", "Other arm straight"],
        searchTerm: "archer push up",
      },
    ],
  },
  {
    id: "walkinglunge",
    pattern: "Walking lunge",
    sets: 3,
    unit: "reps",
    range: DEFAULT_RANGE,
    perSide: true,
    ladder: [
      {
        name: "Walking lunge",
        cues: ["Step forward into a lunge", "Push up and bring the back leg through", "Torso tall"],
        searchTerm: "bodyweight walking lunge",
      },
      {
        name: "Bulgarian split squat",
        cues: ["Rear foot on a chair", "Weight on the front leg"],
        searchTerm: "bulgarian split squat",
      },
    ],
  },
];

export const SLOTS_BY_ID: Record<string, Slot> = Object.fromEntries(
  SLOTS.map((s) => [s.id, s]),
);

export const SESSIONS: SessionDef[] = [
  {
    id: "A",
    name: "Session A",
    slotIds: ["bwsquat", "pushup", "squat", "hpush", "hpull", "hinge", "coreA"],
  },
  {
    id: "B",
    name: "Session B",
    slotIds: ["walkinglunge", "singleleg", "vpush", "hpull", "hamstring", "coreB"],
  },
  {
    id: "RECOVERY",
    name: "Recovery / mobility",
    slotIds: [], // fixed list, see RECOVERY_ITEMS — not progressed
  },
];

export const SESSIONS_BY_ID: Record<string, SessionDef> = Object.fromEntries(
  SESSIONS.map((s) => [s.id, s]),
);

/** Recovery / mobility — a fixed, un-progressed list shown with cues only. */
export interface RecoveryItem {
  name: string;
  cue: string;
}

export const RECOVERY_ITEMS: RecoveryItem[] = [
  { name: "20-minute walk", cue: "Easy pace, nose breathing, get outside if you can" },
  { name: "Cat-cow", cue: "Slow spinal flexion/extension, 8–10 cycles" },
  { name: "Hip flexor stretch", cue: "Half-kneeling, tuck the pelvis, 30s/side" },
  { name: "Thoracic rotations", cue: "Open-book on the floor, follow the hand, 8/side" },
  { name: "Superman holds", cue: "Lift chest + thighs, squeeze, 3 × 10s" },
  { name: "Reverse snow-angels", cue: "Face down, sweep arms, pinch shoulder blades, 2 × 10" },
];
