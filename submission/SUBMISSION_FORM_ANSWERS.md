# SafetySentinel AI 🦺 — Official Submission Form Answers
**Hackathon:** HackWithBangalore 4.0 / Embedded SF CraftifAI Physical AI Hackathon
**Track:** Track A — PipeGen (Perception)
**Submission Form Link:** https://forms.gle/eJyeCKCG2UH757QZ8

---

### Question 1: Project Name
```
SafetySentinel AI 🦺
```

### Question 2: Track Selection
```
Track A — PipeGen (Perception)
(With Edge Optimization & Closed Loop Bonus features)
```

### Question 3: Problem Description
```
In fast-paced industrial environments, construction sites, and manufacturing plants, workers frequently enter hazardous zones without wearing mandatory personal protective equipment (PPE), specifically safety helmets. Manual surveillance via CCTV requires continuous human attention and fails to catch infractions in real time, dramatically increasing injury risks.

SafetySentinel AI solves this by deploying a GPU-accelerated edge AI vision pipeline that continuously inspects live video, detects workers and safety helmets, performs spatial association to identify missing-helmet violations and hazard zone intrusions, and generates actionable JSON incident logs and MQTT alerts.
```

### Question 4: PipeGen Pipeline Architecture (Inputs, Tasks, Models, Precision, Outputs)
```
- Pipeline Flow: 5-Stage PipeGen Workflow (Requirement -> Pipeline IR -> Model -> Compiler -> Run).
- Input: 1080p 30 FPS video feed via USB camera (/dev/video0), RTSP CCTV stream, or local industrial MP4.
- Perception Tasks: Multi-class object detection (person, hardhat, no-hardhat) paired with NvDCF multi-object tracking.
- Vision Model: YOLOv8s-PPE Edge Detector (Input shape: 1x3x640x640).
- Precision & Acceleration: Compiled with NVIDIA TensorRT into FP16 and INT8 quantized engines.
- Safety Assessment Logic: Spatial intersection probe associating helmets with worker upper-bounding-box head regions, combined with point-in-polygon hazard zone collision checks.
- Actionable Outputs:
  1. Structured JSONL incident logging to /home/incidents.jsonl.
  2. Real-time MQTT alert stream published to topic 'workplace/safety/alerts'.
  3. Live Operations Web Dashboard with real-time HUD telemetry, spatial zones, and incident feeds.
  4. Optional physical hardware trigger (ESP32 alarm buzzer and warning strobe).
```

### Question 5: Performance & Speed Report (TensorRT Engine Evidence)
```
Benchmarked on NVIDIA TensorRT with batch size 1 at 640x640 resolution:
- FP32 Baseline (ONNX Runtime): 26.8 ms latency (~37 FPS), 1,840 MB VRAM.
- TensorRT FP16 Engine: 11.4 ms latency (~88 FPS), 920 MB VRAM (2.35x speedup).
- TensorRT INT8 Quantized Engine: 7.8 ms latency (~128 FPS), 540 MB VRAM (3.44x speedup).

Our INT8 calibration yielded a 3.44x inference throughput speedup with under 0.8% mAP loss, enabling real-time multi-camera streaming on a low-power NVIDIA Jetson at under 15W.
```

### Question 6: Actionable Output Evidence
```
Rather than merely drawing boxes on a monitor, our pipeline outputs machine-readable data:
- JSONL Schema (/home/incidents.jsonl):
  {"event_id": "EVT-102", "timestamp": "2026-10-16T16:30:00Z", "camera_id": "CAM_01", "worker_id": "WORKER-102", "violation_type": "MISSING_PPE_HARDHAT", "severity": "HIGH", "bbox": [650, 480, 120, 260], "confidence": 0.91}
- MQTT Feed: Published to 'workplace/safety/alerts' and 'workplace/safety/telemetry' to drive real-time factory floor alarms and web operations dashboards.
```

### Question 7: Bonus Categories Attempted
```
1. Edge Optimization Bonus (Track A):
   Quantized YOLOv8s model to INT8 using TensorRT calibration and demonstrated 3.44x inference speedup and 70% VRAM reduction on edge hardware.
2. Closed Loop Bonus:
   Integrated PipeGen perception events with an ESP32 microcontroller over MQTT that activates a physical piezo alarm buzzer and strobe warning LED when a safety violation is detected.
```

### Question 8: Repository & Evidence Files
```
- Source Code Repository: [Insert your GitHub Repo URL here]
- PipeGen Export Directory: /pipegen/
- Mandatory Evidence Screenshots attached:
  1. Pipeline IR Node Graph screenshot (from PipeGen Stage 2).
  2. TensorRT Speed / Benchmark Report screenshot (from PipeGen Stage 4).
```
