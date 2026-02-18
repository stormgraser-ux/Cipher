"""
Generate vocal-like melodic phrases as WAV for RVC voice conversion.

Usage:
    python render-wav.py output.wav [--bpm 70] [--repeat 2]

v2: Legato phrasing with portamento between notes. Reduced vibrato.
    Formant-like harmonics. Breath noise before phrases.
    Designed to give RVC smooth, voice-like input.
"""

import argparse
import struct
import math
import wave
import random

SAMPLE_RATE = 44100

# Note frequencies (A4 = 440Hz)
NOTE_FREQ = {}
NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
for octave in range(1, 7):
    for i, note in enumerate(NOTES):
        midi = (octave + 1) * 12 + i
        NOTE_FREQ[f"{note}{octave}"] = 440.0 * (2 ** ((midi - 69) / 12.0))
        if '#' in note:
            flat_name = NOTES[(i + 1) % 12] + 'b'
            NOTE_FREQ[f"{flat_name}{octave}"] = NOTE_FREQ[f"{note}{octave}"]


def lerp(a, b, t):
    """Linear interpolation."""
    return a + (b - a) * t


def smoothstep(t):
    """Smooth S-curve interpolation."""
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def generate_breath(duration=0.12, sample_rate=SAMPLE_RATE):
    """Generate a subtle breath noise before a phrase."""
    n = int(duration * sample_rate)
    samples = []
    for i in range(n):
        t = i / n
        # Fade in then out
        env = math.sin(math.pi * t) * 0.06
        # Filtered noise (band-limited)
        noise = random.gauss(0, 1)
        samples.append(env * noise)
    return samples


def generate_legato_phrase(events, bpm, sample_rate=SAMPLE_RATE):
    """
    Generate a complete phrase with legato transitions between notes.

    events: list of (note_name_or_None, beats)
    Adjacent pitched notes get smooth portamento glides.
    Rests (None) create actual silence with gentle fade.
    """
    samples = []
    phase = 0.0  # continuous oscillator phase

    # Pre-resolve frequencies
    resolved = []
    for note, beats in events:
        freq = NOTE_FREQ[note] if note else 0.0
        dur = beats * 60.0 / bpm
        resolved.append((freq, dur, note is not None))

    for idx, (freq, dur, is_note) in enumerate(resolved):
        n_samples = int(dur * sample_rate)

        if not is_note:
            # Rest — gentle silence
            for i in range(n_samples):
                samples.append(0.0)
            phase = 0.0  # reset phase on rest
            continue

        # Find previous and next frequencies for portamento
        prev_freq = 0.0
        for j in range(idx - 1, -1, -1):
            if resolved[j][2]:  # is_note
                prev_freq = resolved[j][0]
                break

        next_freq = 0.0
        for j in range(idx + 1, len(resolved)):
            if resolved[j][2]:
                next_freq = resolved[j][0]
                break

        # Portamento duration (in samples) — smooth glide into this note
        glide_in_samples = int(0.06 * sample_rate) if prev_freq > 0 else 0
        # Portamento out — glide toward next note at the tail
        glide_out_samples = int(0.04 * sample_rate) if next_freq > 0 else 0

        # Check if next event is a rest — if so, fade out instead of glide
        next_is_rest = (idx + 1 < len(resolved) and not resolved[idx + 1][2])
        if next_is_rest:
            glide_out_samples = 0

        for i in range(n_samples):
            t = i / n_samples  # 0→1 over note duration

            # --- Pitch with portamento ---
            current_freq = freq
            if i < glide_in_samples and prev_freq > 0:
                # Glide from previous note's freq to this note's freq
                glide_t = smoothstep(i / glide_in_samples)
                current_freq = lerp(prev_freq, freq, glide_t)
            elif i > n_samples - glide_out_samples and next_freq > 0:
                # Glide toward next note at tail end
                glide_t = smoothstep((i - (n_samples - glide_out_samples)) / glide_out_samples)
                current_freq = lerp(freq, next_freq, glide_t * 0.3)  # only 30% toward next

            # --- Very subtle vibrato (delayed onset, gentle) ---
            vib_onset = smoothstep((t - 0.3) / 0.2)  # vibrato kicks in after 30% of note
            vibrato = vib_onset * math.sin(2 * math.pi * 5.0 * i / sample_rate) * 0.0008 * current_freq

            # --- Envelope: smooth attack, sustained, smooth release ---
            attack_dur = 0.04
            release_dur = 0.08 if next_is_rest else 0.02  # longer release into rests

            if t < attack_dur / dur * n_samples / n_samples:
                env_t = min(1.0, (i / sample_rate) / attack_dur)
                env = smoothstep(env_t)
            elif t > 1.0 - release_dur / dur:
                rel_t = (t - (1.0 - release_dur / dur)) / (release_dur / dur)
                env = 1.0 - smoothstep(rel_t)
                if not next_is_rest:
                    env = max(env, 0.3)  # don't fully fade between legato notes
            else:
                env = 1.0

            # Gentle amplitude variation (simulates breath support)
            breath_variation = 1.0 + 0.03 * math.sin(2 * math.pi * 0.7 * i / sample_rate)
            env *= breath_variation

            # --- Waveform: fundamental + formant-like harmonics ---
            inst_freq = current_freq + vibrato
            phase += inst_freq / sample_rate

            # Fundamental
            sample = 0.7 * math.sin(2 * math.pi * phase)
            # 2nd harmonic (warmth)
            sample += 0.18 * math.sin(2 * math.pi * 2 * phase)
            # 3rd harmonic (nasal character, like a voice)
            sample += 0.08 * math.sin(2 * math.pi * 3 * phase)
            # 4th harmonic (subtle brightness)
            sample += 0.04 * math.sin(2 * math.pi * 4 * phase)

            samples.append(env * sample * 0.75)

    return samples


def build_phrase(bpm=70):
    """
    Build a dark minor melodic hook — v2 with legato phrasing.

    Cm pentatonic: C Eb F G Bb
    Register: C3-Bb3 (mid range)
    Same melodic content as v1 but with connected phrasing.
    """
    events = [
        # Bar 1 — opening motif
        ("G3",  1.5),
        ("Eb3", 0.5),
        (None,  0.25),   # short breath
        ("F3",  1.25),
        (None,  0.5),

        # Bar 2 — descend
        ("Eb3", 1.0),
        ("C3",  1.0),
        (None,  0.25),
        ("C3",  0.75),
        ("Eb3", 1.0),

        # Bar 3 — climb with tension
        ("F3",  1.0),
        ("G3",  0.75),
        ("Bb3", 1.75),
        (None,  0.5),

        # Bar 4 — resolve down
        ("G3",  0.75),
        ("F3",  0.5),
        ("Eb3", 1.0),
        ("C3",  1.75),
    ]

    # Start with a subtle breath
    breath = generate_breath(0.15)
    melody = generate_legato_phrase(events, bpm)

    return breath + melody


def write_wav(filename, samples, sample_rate=SAMPLE_RATE):
    """Write samples to 16-bit mono WAV."""
    peak = max(abs(s) for s in samples) or 1.0
    scale = 0.85 / peak

    with wave.open(filename, 'w') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        for s in samples:
            val = int(s * scale * 32767)
            val = max(-32768, min(32767, val))
            wf.writeframes(struct.pack('<h', val))


def main():
    parser = argparse.ArgumentParser(description="Generate test melody WAV for RVC")
    parser.add_argument("output", help="Output WAV path")
    parser.add_argument("--bpm", type=int, default=70, help="Tempo (default: 70)")
    parser.add_argument("--repeat", type=int, default=2, help="Times to repeat phrase (default: 2)")
    args = parser.parse_args()

    print(f"Generating legato vocal hook @ {args.bpm} BPM (v2)...")
    phrase = build_phrase(args.bpm)

    gap_seconds = 2 * 60.0 / args.bpm
    gap = [0.0] * int(gap_seconds * SAMPLE_RATE)
    full = []
    for i in range(args.repeat):
        if i > 0:
            full.extend(generate_breath(0.2))  # breath between repetitions
        full.extend(phrase)
        if i < args.repeat - 1:
            full.extend(gap)

    write_wav(args.output, full)
    duration = len(full) / SAMPLE_RATE
    print(f"Written: {args.output} ({duration:.1f}s, {SAMPLE_RATE}Hz, 16-bit mono)")


if __name__ == "__main__":
    main()
