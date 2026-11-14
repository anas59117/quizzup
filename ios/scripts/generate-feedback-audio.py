"""Compose QuizzUp's original, soft feedback cues as PCM WAV; no third-party audio."""
import math
import random
import sys
import wave
from array import array
from pathlib import Path

RATE = 44100

def save_wrong(directory):
    # Approved audition 1: a dry, damped tap. The app's gain is 0.5, so
    # doubling the quantized audition samples preserves its exact level.
    duration = 0.085
    rng = random.Random(614)
    samples = []
    low = 0.0
    for i in range(round(RATE * duration)):
        t = i / RATE
        low = 0.85 * low + 0.15 * rng.uniform(-1, 1)
        envelope = (1 - math.exp(-t / 0.0025)) * math.exp(-t / 0.012)
        value = envelope * (0.8 * math.sin(2 * math.pi * 180 * t)
                            + 0.23 * math.sin(2 * math.pi * 475 * t))
        value += 0.06 * low * (1 - math.exp(-t / 0.002)) * math.exp(-t / 0.01)
        value *= min(1, (duration - t) / 0.012) ** 2
        samples.append(value)
    rms = math.sqrt(sum(v * v for v in samples) / len(samples))
    gain = min(0.025 / rms, 0.085 / max(map(abs, samples)))
    pcm = array('h', (2 * round(v * gain * 32767) for v in samples))
    if sys.byteorder != 'little':
        pcm.byteswap()
    directory.mkdir(parents=True, exist_ok=True)
    with wave.open(str(directory / 'wrong.wav'), 'wb') as out:
        out.setparams((1, 2, RATE, len(pcm), 'NONE', 'not compressed'))
        out.writeframes(pcm.tobytes())
    print('wrong: 85 ms, approved dry tap, playback gain 0.5')


def save(directory, name, duration, tones, peak):
    samples = []
    for i in range(round(duration * RATE)):
        t = i / RATE
        value = 0.0
        for start, length, frequency, amplitude, end_frequency in tones:
            u = t - start
            if not 0 <= u < length:
                continue
            attack = min(1.0, u / 0.014)
            release = min(1.0, (length - u) / 0.035)
            envelope = math.sin(attack * math.pi / 2) ** 2 * release ** 2 * math.exp(-3.4 * u / length)
            phase = 2 * math.pi * (frequency * u + (end_frequency - frequency) * u * u / (2 * length))
            value += amplitude * envelope * (math.sin(phase) + 0.12 * math.sin(2 * phase))
        samples.append(value)
    scale = peak / max(map(abs, samples))
    pcm = array('h', (round(v * scale * 32767) for v in samples))
    if sys.byteorder != 'little':
        pcm.byteswap()
    directory.mkdir(parents=True, exist_ok=True)
    with wave.open(str(directory / (name + '.wav')), 'wb') as out:
        out.setparams((1, 2, RATE, len(pcm), 'NONE', 'not compressed'))
        out.writeframes(pcm.tobytes())
    rms = math.sqrt(sum((v * scale) ** 2 for v in samples) / len(samples))
    print(f'{name}: {duration:.2f}s, peak {20*math.log10(peak):.1f} dBFS, RMS {20*math.log10(rms):.1f} dBFS')

def main():
    directory = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parents[1] / 'Sources/QuizzUp/Resources/Audio'
    save_wrong(directory)
    save(directory, 'victory', 0.82, [
        (0, 0.25, 392, 0.62, 392),
        (0.12, 0.28, 523.251, 0.70, 523.251),
        (0.24, 0.58, 659.255, 0.72, 659.255),
        (0.24, 0.52, 261.626, 0.30, 261.626),
        (0.24, 0.52, 391.995, 0.25, 391.995),
    ], 0.14)

if __name__ == '__main__':
    main()
