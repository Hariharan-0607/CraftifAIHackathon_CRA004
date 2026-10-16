# SafetySentinel AI 🦺
### AI-Powered Industrial Worker Safety Monitoring System
**Hackathon:** HackWithBangalore 4.0 | **Track:** PipeGen (Perception)

---

## 1. Project Overview

SafetySentinel AI is a real-time computer vision system designed to improve workplace safety in factories, construction sites, and industrial environments. It uses AI-powered video analysis to detect workers and safety helmets, identify potential helmet violations, and generate automated safety alerts with incident records.

The project uses **CraftifAI PipeGen v0.5.1** to build an edge AI vision pipeline that processes video using NVIDIA GPU acceleration, compiles the selected model into a TensorRT engine, and produces actionable safety information beyond simply displaying detection boxes.

---

## 2. Problem Statement

In many industrial workplaces, workers may enter hazardous areas without wearing essential personal protective equipment (PPE), particularly safety helmets. Manual monitoring through CCTV cameras requires continuous human attention, making it difficult to identify every violation promptly.

Delayed detection can increase the risk of workplace injuries and accidents. There is a need for an automated, scalable, and efficient system that continuously monitors video footage and flags potential safety violations for human review.

---

## 3. Proposed Solution

SafetySentinel AI analyzes video footage from a CCTV camera, USB camera, or recorded industrial video. The vision pipeline detects people and safety helmets, then evaluates whether a visible worker appears to be missing a helmet.

When a potential violation is identified, the system generates a structured incident record containing relevant information such as the timestamp, event type, detection confidence, and available detection details.

The system displays annotated video, exports incident information as JSONL, and dispatches real-time MQTT notifications to an operations dashboard and optional downstream physical actuators (e.g. ESP32 warning strobe).

---

## 4. Key Features

1. **Real-Time Worker Detection:** Identify workers appearing in the video stream.
2. **Safety Helmet Detection:** Detect visible safety helmets using an edge vision model.
3. **Association & Violation Assessment:** Spatial intersection between detected worker bounding boxes and helmet head-regions to flag missing-helmet violations.
4. **Visual Monitoring:** Display the video with bounding boxes, class labels, and detection confidence.
5. **Automated Incident Logging:** Generate structured JSON records for potential safety violations saved to `/home/incidents.jsonl`.
6. **Edge AI Acceleration:** Compile model into a high-throughput TensorRT engine and report speed/latency.
7. **Actionable Safety Output:** Publish structured MQTT telemetry and alerts to `workplace/safety/alerts` consumed by a live operations dashboard.
8. **Performance Evaluation:** Report actual pipeline speed (FPS, latency, memory) across FP32, FP16, and INT8.

---

## 5. System Workflow

```
[Video Input] (Camera / RTSP / MP4)
      │
      ▼
[PipeGen Vision Pipeline] (GStreamer / nvstreammux)
      │
      ▼
[AI Model Inference] (TensorRT-accelerated YOLO)
      │
      ▼
[Worker & Helmet Detection] (Bounding boxes + labels)
      │
      ▼
[Violation Assessment Probe] (Worker-Helmet Spatial Association)
      │
      ├──► [Annotated Video Display] (nvdsosd + EGL sink)
      ├──► [JSON Incident Output] (/home/incidents.jsonl)
      └──► [Actionable MQTT Stream] (workplace/safety/alerts -> Live Dashboard)
```

---

## 6. Technology Stack

* **AI Pipeline Orchestration:** CraftifAI PipeGen v0.5.1
* **Computer Vision Model:** YOLOv8s-PPE (Person & Safety Helmet detection)
* **Inference Engine Acceleration:** NVIDIA TensorRT (FP16 / INT8)
* **Streaming Framework:** NVIDIA DeepStream 6.4 / 7.0
* **Target Hardware:** NVIDIA GPU-equipped PC (RTX/GTX) or NVIDIA Jetson (JetPack 6)
* **Input Sources:** CCTV RTSP stream, USB camera (`/dev/video0`), or industrial MP4 video
* **Actionable Outputs:** 
  * Real-time MQTT stream (`workplace/safety/alerts`)
  * Local rotating JSONL logs (`/home/incidents.jsonl`)
  * Live Operations Web Dashboard (`http://localhost:3000`)
* **Version Control:** Git & GitHub

---

## 7. PipeGen 5-Stage Implementation

| Stage | Purpose | File in Repository |
| :--- | :--- | :--- |
| **Stage 1: Requirement** | Natural language prompt defining safety constraints, models, and outputs | [`pipegen/01_requirement_prompt.txt`](file:///Users/hariharan/Hack/pipegen/01_requirement_prompt.txt) |
| **Stage 2: Pipeline IR** | Formal node graph specification linking source, muxer, inference, probe, and sinks | [`pipegen/02_pipeline_ir_spec.json`](file:///Users/hariharan/Hack/pipegen/02_pipeline_ir_spec.json) |
| **Stage 3: Model** | ONNX detection model configuration (classes: person, hardhat, no-hardhat) | [`pipegen/03_model_config.txt`](file:///Users/hariharan/Hack/pipegen/03_model_config.txt) |
| **Stage 4: Compiler** | Script compiling ONNX to TensorRT FP16 / INT8 engine with speed reporting | [`pipegen/04_tensorrt_compile.sh`](file:///Users/hariharan/Hack/pipegen/04_tensorrt_compile.sh) |
| **Stage 5: Run** | DeepStream application launcher with GStreamer probe and MQTT broker | [`pipegen/05_deepstream_run.sh`](file:///Users/hariharan/Hack/pipegen/05_deepstream_run.sh) |

---

## 8. Hand-off Guide: Running on Your Teammate's NVIDIA Laptop

If you prepared this on macOS and your teammate has the Linux/NVIDIA PC or Jetson:

### 1. Copy the Repository
Clone or copy the folder onto the NVIDIA laptop:
```bash
git clone <repo-url>
cd Hack
```

### 2. Launch PipeGen v0.5.1
1. Verify version:
   ```bash
   pipegen --version
   # Expected output: 0.5.1
   ```
2. In PipeGen **Stage 1 (Requirement)**, paste the text from:
   [`pipegen/01_requirement_prompt.txt`](file:///Users/hariharan/Hack/pipegen/01_requirement_prompt.txt)
3. In **Stage 2 (Pipeline IR)**, inspect the generated node graph. **Take a screenshot for your submission!**
4. In **Stage 4 (Compiler)**, compile the TensorRT engine:
   ```bash
   chmod +x pipegen/04_tensorrt_compile.sh
   ./pipegen/04_tensorrt_compile.sh
   ```
   **Save a screenshot of the speed report!**

### 3. Run the DeepStream Pipeline
```bash
chmod +x pipegen/05_deepstream_run.sh
./pipegen/05_deepstream_run.sh
```

### 4. View the Live Operations Dashboard
On either laptop (or your Mac over local network):
```bash
node dashboard/server.js
```
Open `http://localhost:3000` to show judges live real-time incident cards, telemetry graphs, and spatial zones!
