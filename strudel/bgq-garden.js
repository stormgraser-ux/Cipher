// BGQ Garden Theme v2 — F major, ~95 BPM
// AABA form: 16-bar loop (~40 seconds)
// A: Fmaj7 → Am7 → Bbmaj7 → Cmaj7
// B: Dm7 → Gm7 → Bbmaj7 → C7 (gentle departure, resolves home)
// Phase mapping: roll=pad+bass, pick=+melody+shaker, play=+bells+kick
setcps(95/60/4)

// A section (plays 3x)
let padA  = "[F3,C4,E4,A4] [A2,E3,G3,C4] [Bb2,F3,A3,D4] [C3,G3,B3,E4]"
let bassA = "F2 A2 Bb2 C3"
let melA  = "[C5 A4 ~ F4 ~ A4 C5 E5] [E5 C5 ~ A4 ~ G4 A4 C5] [D5 Bb4 ~ F4 ~ A4 Bb4 D5] [E5 C5 ~ G4 ~ B4 C5 E5]"
let bellA = "[~ ~ ~ ~ F5 ~ ~ ~] [~ ~ ~ ~ ~ ~ E5 ~] [~ ~ A5 ~ ~ ~ ~ ~] [~ ~ ~ ~ ~ G5 ~ ~]"

// B section (plays 1x — the bridge)
let padB  = "[D3,A3,C4,F4] [G2,D3,F3,Bb3] [Bb2,F3,A3,D4] [C3,G3,Bb3,E4]"
let bassB = "D2 G2 Bb2 C3"
let melB  = "[A4 F4 ~ D4 ~ F4 A4 C5] [D5 Bb4 ~ G4 ~ F4 G4 Bb4] [D5 Bb4 ~ F4 ~ A4 Bb4 D5] [E5 C5 ~ G4 ~ Bb4 C5 E5]"
let bellB = "[~ ~ ~ ~ D5 ~ ~ ~] [~ ~ ~ ~ ~ ~ Bb4 ~] [~ ~ A5 ~ ~ ~ ~ ~] [~ ~ ~ ~ ~ E5 ~ ~]"

stack(
  // PAD — warm chords, filter breathes over full 16-bar cycle
  note(`<${padA} ${padA} ${padA} ${padB}>`)
    .s("sawtooth")
    .lpf(sine.range(600,1000).slow(16))
    .lpq(1)
    .attack(0.5).decay(0.3).sustain(0.5).release(2)
    .gain(0.14)
    .room(0.5).size(0.9),

  // BASS — gentle, round
  note(`<${bassA} ${bassA} ${bassA} ${bassB}>`)
    .s("triangle")
    .lpf(320)
    .attack(0.06).decay(0.2).sustain(0.35).release(0.4)
    .gain(0.22),

  // MELODY — plucky music box, dotted 8th delay
  note(`<${melA} ${melA} ${melA} ${melB}>`)
    .s("triangle")
    .lpf(2800)
    .attack(0.001).decay(0.1).sustain(0.01).release(0.25)
    .gain(0.16)
    .delay(0.3).delaytime(3/16).delayfeedback(0.3)
    .room(0.3),

  // BELLS — sparse ethereal accents
  note(`<${bellA} ${bellA} ${bellA} ${bellB}>`)
    .s("sine")
    .lpf(4000)
    .attack(0.001).decay(0.25).sustain(0.01).release(0.6)
    .gain(0.07)
    .room(0.6).size(0.95)
    .delay(0.4).delaytime(3/16).delayfeedback(0.35),

  // SHAKER — gentle 8th note pulse
  s("hh*8")
    .gain(".09 .04 .07 .04 .09 .04 .07 .05")
    .lpf(6000).hpf(4500)
    .room(0.2),

  // SOFT KICK — pillowy
  s("bd ~ ~ ~ bd ~ ~ ~")
    .gain(0.12)
    .lpf(150)
    .room(0.15)
)
