import os
import tempfile
import subprocess
from flask import Flask, request, jsonify

app = Flask(__name__)

MODEL_SIZE = os.environ.get("WHISPER_MODEL", "base")

model = None

def get_model():
    global model
    if model is None:
        from faster_whisper import WhisperModel
        model = WhisperModel(MODEL_SIZE, device="cpu", compute_type="int8")
    return model


@app.route("/inference", methods=["POST"])
def inference():
    audio_data = request.get_data()
    if not audio_data:
        return jsonify({"error": "No audio data"}), 400

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".webm")
    try:
        tmp.write(audio_data)
        tmp.close()

        wav = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
        wav.close()

        subprocess.run(
            ["ffmpeg", "-y", "-i", tmp.name, "-ar", "16000", "-ac", "1",
             "-sample_fmt", "s16", wav.name],
            capture_output=True, timeout=30, check=True
        )

        segments, _ = get_model().transcribe(wav.name, beam_size=5, language="es")
        text = " ".join(seg.text for seg in segments)

        return jsonify({"text": text.strip()})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        os.unlink(tmp.name)
        if "wav" in dir():
            try:
                os.unlink(wav.name)
            except Exception:
                pass


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=9000)
