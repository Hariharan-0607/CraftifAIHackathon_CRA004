# Evidence Collection Guide for Hackathon Submission

The judges strictly mandate two pieces of evidence for Track A:
1. **Pipeline IR Node Graph Screenshot** (from PipeGen Stage 2)
2. **TensorRT Speed Report Screenshot** (from PipeGen Stage 4 or `trtexec`)

---

## 1. Capturing Evidence #1: Pipeline IR Node Graph
1. Open CraftifAI PipeGen v0.5.1 on the NVIDIA machine.
2. Advance through **Stage 1 (Requirement)** using the prompt in `pipegen/01_requirement_prompt.txt`.
3. In **Stage 2 (Pipeline IR)**, wait for PipeGen to generate the visual node graph.
4. The graph should display:
   - Source node (`v4l2src` or `filesrc`)
   - Muxer node (`nvstreammux`)
   - Inference node (`nvinfer` / `primary-gie`)
   - Tracker node (`nvtracker`)
   - Custom probe (`safety_analytics_probe`)
   - OSD node (`nvdsosd`)
   - Sinks (`nveglglessink` + `mqtt_message_broker` + `json_incident_logger`)
5. Take a clear screenshot of this entire screen and save as:
   `submission/evidence/01_pipeline_ir_graph.png`

---

## 2. Capturing Evidence #2: TensorRT Speed Report
1. In PipeGen **Stage 4 (Compiler)**, build the engine or run:
   ```bash
   ./pipegen/04_tensorrt_compile.sh
   ```
2. The terminal output or GUI panel will display:
   - Compute latency (mean / median in milliseconds)
   - Throughput (FPS)
   - GPU memory footprint (MB)
   - Speed comparison vs FP32
3. Take a screenshot of the speed metrics and save as:
   `submission/evidence/02_tensorrt_speed_report.png`

---

## 3. Capturing Live Hardware Demo Proof
1. Run `./pipegen/05_deepstream_run.sh` with the USB camera pointed at someone wearing/not wearing a helmet.
2. Take a 10-second video clip or screenshot of the terminal and dashboard updating in real time.
3. Save in `submission/evidence/03_live_run.png`.
