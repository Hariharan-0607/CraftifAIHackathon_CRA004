#!/usr/bin/env bash
# ==============================================================================
# CRAFTIFAI PIPEGEN v0.5.1 - STAGE 4: TENSORRT ENGINE COMPILATION & BENCHMARK
# Run this on your NVIDIA GPU Linux machine or NVIDIA Jetson (JetPack 6)
# ==============================================================================

set -e

MODELS_DIR="/home/${USER:-nvidia}/models"
ONNX_FILE="${MODELS_DIR}/yolov8s_ppe_640.onnx"
FP16_ENGINE="${MODELS_DIR}/yolov8s_ppe_640_fp16.engine"
INT8_ENGINE="${MODELS_DIR}/yolov8s_ppe_640_int8.engine"
REPORT_DIR="./submission/evidence"

mkdir -p "${MODELS_DIR}"
mkdir -p "${REPORT_DIR}"

echo "=================================================================="
echo " [PipeGen Compiler] Stage 4: Compiling Model to TensorRT Engine..."
echo " Target Architecture: NVIDIA Ampere / Ada / Orin Tensor Cores"
echo "=================================================================="

# Check if trtexec exists
if ! command -v trtexec &> /dev/null; then
    if [ -f "/usr/src/tensorrt/bin/trtexec" ]; then
        export PATH="/usr/src/tensorrt/bin:${PATH}"
    else
        echo "[WARNING] trtexec not found in PATH or /usr/src/tensorrt/bin."
        echo "PipeGen GUI can compile automatically via the Compiler tab."
    fi
fi

echo "[1/3] Compiling FP16 TensorRT Engine..."
if command -v trtexec &> /dev/null; then
    trtexec \
        --onnx="${ONNX_FILE}" \
        --saveEngine="${FP16_ENGINE}" \
        --fp16 \
        --workspace=2048 \
        --shapes=images:1x3x640x640 \
        --avgRuns=100 \
        --exportTimes="${REPORT_DIR}/fp16_benchmark_times.json" \
        --exportProfile="${REPORT_DIR}/fp16_benchmark_profile.json" \
        | tee "${REPORT_DIR}/tensorrt_fp16_speed_report.txt"

    echo ">>> FP16 Engine compiled successfully: ${FP16_ENGINE}"
    echo ">>> Speed report exported to: ${REPORT_DIR}/tensorrt_fp16_speed_report.txt"
else
    echo "Run through PipeGen GUI: Navigate to 'Compiler' -> Select 'FP16' -> Click 'Build Engine'."
fi

echo "------------------------------------------------------------------"
echo "[2/3] (Bonus) Compiling INT8 Quantized Engine for Edge Jetson..."
if command -v trtexec &> /dev/null; then
    trtexec \
        --onnx="${ONNX_FILE}" \
        --saveEngine="${INT8_ENGINE}" \
        --int8 \
        --best \
        --workspace=2048 \
        --shapes=images:1x3x640x640 \
        --avgRuns=100 \
        --exportTimes="${REPORT_DIR}/int8_benchmark_times.json" \
        | tee "${REPORT_DIR}/tensorrt_int8_speed_report.txt"

    echo ">>> INT8 Engine compiled successfully: ${INT8_ENGINE}"
    echo ">>> Speed report exported to: ${REPORT_DIR}/tensorrt_int8_speed_report.txt"
fi

echo "=================================================================="
echo " [PipeGen Compiler] Complete! Take a screenshot of the speed report"
echo " and save to submission/evidence/ as required by the hackathon rules."
echo "=================================================================="
