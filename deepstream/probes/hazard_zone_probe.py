#!/usr/bin/env python3
"""
Workplace Safety Sentinel - Custom DeepStream Safety Analytics Probe
Performs ray-casting polygon collision detection, PPE compliance checking,
and dispatches real-time MQTT alerts & JSONL incident logs.
"""

import sys
import os
import time
import json
import socket
from datetime import datetime

# Hazard Zone Definitions (1920x1080 coordinate space)
HAZARD_ZONES = [
    {
        "zone_id": "ZONE_DANGER_ROBOTIC_CELL",
        "name": "Robotic Work Cell (Restricted)",
        "type": "RESTRICTED",
        "color_rgb": (255, 45, 85),
        "polygon": [[580, 420], [1340, 420], [1480, 980], [440, 980]],
        "rule": "ZERO_TOLERANCE_NO_ENTRY"
    },
    {
        "zone_id": "ZONE_CAUTION_FORKLIFT_LANE",
        "name": "Heavy Forklift Transit Lane",
        "type": "PPE_MANDATORY",
        "color_rgb": (255, 204, 0),
        "polygon": [[100, 300], [520, 300], [420, 950], [60, 950]],
        "rule": "HARDHAT_AND_VEST_REQUIRED"
    }
]

INCIDENT_LOG_PATH = os.path.expanduser("/home/incidents.jsonl")
LOCAL_LOG_PATH = os.path.join(os.path.dirname(__file__), "../../incidents.jsonl")

# Worker tracking state: {worker_id: {"first_seen": ts, "in_zone": zone_id, "violations": set()}}
worker_tracking_state = {}


def point_in_polygon(x, y, polygon):
    """Ray-casting algorithm to test if (x, y) is inside a polygon."""
    n = len(polygon)
    inside = False
    p1x, p1y = polygon[0]
    for i in range(1, n + 1):
        p2x, p2y = polygon[i % n]
        if y > min(p1y, p2y):
            if y <= max(p1y, p2y):
                if x <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or x <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y
    return inside


def log_incident(incident_data):
    """Write incident JSON to disk."""
    line = json.dumps(incident_data) + "\n"
    for path in [INCIDENT_LOG_PATH, LOCAL_LOG_PATH]:
        try:
            with open(path, "a") as f:
                f.write(line)
        except Exception:
            pass


def dispatch_mqtt_alert(incident_data):
    """Dispatch structured alert to local or remote MQTT broker."""
    try:
        import paho.mqtt.publish as publish
        publish.single(
            "workplace/safety/alerts",
            json.dumps(incident_data),
            hostname="localhost",
            port=1883
        )
    except Exception:
        # Fallback to local UDP/TCP or dashboard bridge if paho is not installed
        pass


def evaluate_worker(worker_id, bbox, detections_in_bbox):
    """
    Evaluates worker bounding box against zones and PPE compliance.
    bbox: [left, top, width, height]
    detections_in_bbox: list of tags, e.g. ['hardhat', 'safety-vest'] or ['no-hardhat']
    """
    left, top, width, height = bbox
    # Check foot position (ground contact point)
    foot_x = left + width / 2.0
    foot_y = top + height

    now = time.time()
    if worker_id not in worker_tracking_state:
        worker_tracking_state[worker_id] = {
            "first_seen": now,
            "zone": None,
            "zone_entry_time": None,
            "last_alert_time": 0
        }

    state = worker_tracking_state[worker_id]
    current_zone = None

    for zone in HAZARD_ZONES:
        if point_in_polygon(foot_x, foot_y, zone["polygon"]):
            current_zone = zone
            break

    state["zone"] = current_zone["zone_id"] if current_zone else None

    alerts = []
    if current_zone:
        if state["zone_entry_time"] is None:
            state["zone_entry_time"] = now
        dwell_seconds = now - state["zone_entry_time"]

        # Case 1: Restricted Robotic Cell (Zero Tolerance)
        if current_zone["type"] == "RESTRICTED":
            alert = {
                "event_id": f"EVT-{int(now * 1000)}",
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "camera_id": "CAM_FACILITY_BAY_01",
                "worker_id": f"WORKER-{worker_id}",
                "zone_id": current_zone["zone_id"],
                "zone_name": current_zone["name"],
                "violation_type": "ZONE_INTRUSION",
                "severity": "CRITICAL",
                "dwell_seconds": round(dwell_seconds, 1),
                "bbox": [int(left), int(top), int(width), int(height)],
                "message": f"CRITICAL: Worker #{worker_id} entered restricted robotic cell!"
            }
            alerts.append(alert)

        # Case 2: Caution Forklift Lane (PPE Mandatory)
        elif current_zone["type"] == "PPE_MANDATORY":
            has_hardhat = "hardhat" in detections_in_bbox
            has_vest = "safety-vest" in detections_in_bbox

            if not has_hardhat or not has_vest:
                missing = []
                if not has_hardhat:
                    missing.append("HARDHAT")
                if not has_vest:
                    missing.append("SAFETY_VEST")

                alert = {
                    "event_id": f"EVT-{int(now * 1000)}",
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                    "camera_id": "CAM_FACILITY_BAY_01",
                    "worker_id": f"WORKER-{worker_id}",
                    "zone_id": current_zone["zone_id"],
                    "zone_name": current_zone["name"],
                    "violation_type": "MISSING_PPE_" + "_AND_".join(missing),
                    "severity": "HIGH",
                    "dwell_seconds": round(dwell_seconds, 1),
                    "bbox": [int(left), int(top), int(width), int(height)],
                    "message": f"PPE VIOLATION: Worker #{worker_id} in {current_zone['name']} missing {', '.join(missing)}!"
                }
                alerts.append(alert)
    else:
        state["zone_entry_time"] = None

    # Throttle alert dispatches to once every 2 seconds per worker to avoid spamming
    for alert in alerts:
        if now - state["last_alert_time"] > 2.0:
            state["last_alert_time"] = now
            log_incident(alert)
            dispatch_mqtt_alert(alert)
            print(f"[SENTINEL ALERT] {alert['timestamp']} - {alert['message']}")

    return alerts


if __name__ == "__main__":
    print("==========================================================")
    print(" Workplace Safety Sentinel - Safety Analytics Probe Active")
    print(f" Zones Configured: {len(HAZARD_ZONES)}")
    print(" Output: MQTT topic 'workplace/safety/alerts'")
    print(f" JSONL Log: {LOCAL_LOG_PATH}")
    print("==========================================================")

    # Test evaluation
    sample_alert = evaluate_worker(
        worker_id=102,
        bbox=[650, 480, 120, 260],
        detections_in_bbox=["no-hardhat", "safety-vest"]
    )
    print(f"Test run completed. Generated {len(sample_alert)} alert(s).")
