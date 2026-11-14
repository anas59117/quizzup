"""Compose QuizzUp's original, soft feedback cues as PCM WAV; no third-party audio."""
import math
import sys
import wave
from array import array
from pathlib import Path

RATE = 44100

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
    save(directory, 'wrong', 0.18, [(0, 0.18, 330, 1, 255)], 0.11)
    save(directory, 'victory', 0.82, [
        (0, 0.25, 392, 0.62, 392),
        (0.12, 0.28, 523.251, 0.70, 523.251),
        (0.24, 0.58, 659.255, 0.72, 659.255),
        (0.24, 0.52, 261.626, 0.30, 261.626),
        (0.24, 0.52, 391.995, 0.25, 391.995),
    ], 0.14)

if __name__ == '__main__':
    main()
