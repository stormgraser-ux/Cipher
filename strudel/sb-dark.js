// $B Dark Trap v3 — C#m, 140 BPM half-time
// Sub bass drone (never stops) + 808 accents on top
// Snare instead of clap. Foot on the gas.
setcps(140/60/4)

stack(
  // DARK MELODY — eerie pluck, minimal C#m
  note("<[~ C#4 ~ ~ B3 ~ ~ ~] [~ C#4 ~ ~ A3 ~ ~ ~]>")
    .s("sawtooth")
    .lpf(900).lpq(5)
    .attack(0.005).decay(0.15).sustain(0.03).release(0.35)
    .gain(0.13)
    .room(0.5).size(0.8)
    .delay(0.3).delaytime(3/16).delayfeedback(0.35),

  // SUB BASS — continuous drone, never lets up
  // Clean sine on the root. This IS the low end.
  note("<C#1 C#1>")
    .s("sine")
    .attack(0.001).decay(0).sustain(1).release(0.5)
    .gain(0.28)
    .lpf(80),

  // 808 ACCENTS — distorted punch on top of the sub
  // These are rhythmic hits, not the foundation
  note("<[C#1 ~ ~ ~ C#1 ~ ~ ~] [D#1 ~ ~ ~ C#1 ~ B0 ~]>")
    .s("sine")
    .penv(12).pdecay(0.06)
    .decay(0.2).sustain(0.15).release(0.08)
    .gain(0.3)
    .distort("5:.3")
    .lpf(200),

  // KICK — beat 1, ghost kick end of bar 1
  s("<[bd ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ bd] [bd ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~]>")
    .bank("RolandTR808")
    .gain(0.6),

  // SNARE — beat 3, tight and digital
  s("[~ ~ ~ ~ ~ ~ ~ ~ sd ~ ~ ~ ~ ~ ~ ~]")
    .bank("RolandTR808")
    .gain(0.45)
    .room(0.15),

  // CLOSED HI-HATS — trap 16ths
  s("hh*16")
    .bank("RolandTR808")
    .gain(".08 .03 .06 .03 .08 .03 .06 .03 .08 .03 .06 .03 .08 .03 .06 .03")
    .lpf(7000).hpf(3500),

  // OPEN HAT — end of bar 2
  s("<[~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~] [~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ oh ~]>")
    .bank("RolandTR808")
    .gain(0.09),

  // DARK PAD — C#m chord, barely audible
  note("[C#3,E3,G#3]")
    .s("sawtooth")
    .lpf(sine.range(250,450).slow(16))
    .attack(1).decay(0.3).sustain(0.3).release(2)
    .gain(0.05)
    .room(0.7).size(0.9)
)
