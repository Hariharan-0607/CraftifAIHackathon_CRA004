#!/usr/bin/env bash
# ==============================================================================
# CRAFTIFAI PIPEGEN v0.5.1 - STAGE 5: RUN DEEPSTREAM PIPELINE
# Executes on NVIDIA GPU / Jetson in an X11 Desktop Session
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${SCRIPT_DIR}"

echo "=================================================================="
echo " [PipeGen Run] Stage 5: Starting DeepStream Workplace Safety Sentinel"
echo " Date: $(date)"
echo "=================================================================="

# Ensure X11 display is available
if [ -z "${DISPLAY}" ]; then
    export DISPLAY=:0
    echo "[INFO] DISPLAY set to :0"
fi

# Check Mosquitto MQTT Broker
if ! pgrep -x "mosquitto" > /dev/null; then
    echo "[INFO] Starting local MQTT Broker (mosquitto)..."
    mosquitto -d -p 1883 || echo "[WARN] mosquitto already running or needs sudo systemctl start mosquitto"
fi

# Run DeepStream app using PipeGen's generated configuration
CONFIG_FILE="deepstream/configs/deepstream_app_config.txt"

if [ ! -f "${CONFIG_FILE}" ]; then
    echo "[ERROR] DeepStream config not found at: ${CONFIG_FILE}"
    exit 1
fi

echo "[INFO] Launching deepstream-app with config: ${CONFIG_FILE}"
echo "[INFO] Streaming actionable MQTT alerts to 'workplace/safety/alerts'..."
echo "[INFO] Logging incidents to /home/incidents.jsonl..."

if command -v deepstream-app &> /dev/null; then
    deepstream-app -c "${CONFIG_FILE}"
else
    echo "[INFO] deepstream-app binary not found in standard PATH."
    echo "[INFO] Running Python DeepStream pipeline with GStreamer..."
    python3 deepstream/probes/hazard_zone_probe.py
fi
