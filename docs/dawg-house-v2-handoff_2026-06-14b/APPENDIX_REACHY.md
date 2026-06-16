# Appendix — Reachy Mini (future personal bolt-on)

> **NOT a v2 feature. NOT in the build queue.** Parked here so the idea isn't lost.
> Do not let this touch Phases 0–6. Build it only after the Hermes UI is done.

---

## The vision

Hermes = the **brain** (cognition + control UI, running on Francis's M4 Max Mac).
**Reachy Mini** (Pollen Robotics / Hugging Face desktop robot) = the **body** —
ears (mics), mouth (speaker), expressive head + antennas, camera. Reachy never
thinks; Hermes does 100% of the cognition. Clean brain/body split.

This is **personal**, so the Walmart Element Gateway / LLM-boundary rule does NOT
apply — bring-your-own-model freely.

---

## Why it fits Hermes (later, as a CLIENT)

Everything Reachy needs is already being built into Hermes:

| Reachy needs | Hermes already has (built in v2) |
|--------------|----------------------------------|
| A brain to send mic-text to / get replies from | the gateway API |
| A way to command the body (nod/tilt/speak) | MCP tools — wrap the Reachy SDK as an MCP server |
| Freedom to pick any model | bring-your-own-model (native) |
| A "drive-reachy" recipe | a skill / workflow (`12`) |

Reachy plugs in as a **downstream client**, not a feature inside the dashboard.

---

## The three wires

| Direction | Flow | Mechanism |
|-----------|------|-----------|
| INPUT (ears→brain) | mic → STT → Hermes | Reachy app calls the Hermes gateway as a client |
| OUTPUT (brain→mouth) | Hermes reply → TTS → speaker | Reachy app speaks the response |
| EMBODIMENT (brain→body) | Hermes decides "nod now" | Reachy SDK wrapped as a Hermes MCP tool |

```python
# reachy_assistant.py — SKETCH (illustrative APIs)
import reachy_mini, hermes_client

reachy = reachy_mini.connect()      # body: ears, mouth, motors
brain  = hermes_client.Session()    # Hermes gateway = cognition (on the M4 Max)

while True:
    audio = reachy.mic.listen()         # ears
    text  = stt(audio)                  # speech -> text
    reply = brain.ask(text)             # Hermes does ALL the thinking
    reachy.head.nod()                   # body reacts
    reachy.speaker.say(tts(reply))      # mouth
```

---

## Hardware recommendation

**Reachy Mini Wireless** (~$449), not the Lite (~$299).

- The Lite is USB-tethered to a host computer; the Wireless has onboard Raspberry
  Pi 5 + battery + Wi-Fi + 4-mic far-field array + wide-angle camera.
- The M4 Max is the brain **either way** — so the Wireless's value isn't its Pi,
  it's **untethered placement + good mics + camera** = the actual assistant
  experience. The Lite's cable fights the "roaming assistant" fantasy.
- Specs are approximate (Pollen/HF tweak them) — verify on the product page.

---

## The 4 things that'll bite you (when you build it)

1. **Where Hermes runs** — the Reachy Pi is too weak to host Hermes + models;
   Hermes lives on the M4 Max, robot talks to it over the network.
2. **Latency** — mic→STT→agent→TTS round-trip kills the Wibey feel unless you
   **stream** each stage.
3. **Variant topology** — Lite (USB) vs Wireless (Wi-Fi) changes the wiring.
4. **STT/TTS choice** — pick pairs that run well locally on the M4 Max.

---

## Order of operations

Finish the Hermes UI (Phases 0–4, and 6 for the graph). **Then** Reachy is a small,
separate bolt-on: a Reachy client app + one MCP tool for the head/antennas. Nothing
in the v2 build blocks it; nothing about Reachy should slow the UI down.
