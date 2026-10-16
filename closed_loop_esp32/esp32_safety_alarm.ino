/*
 * CraftifAI Hackathon - Closed Loop Hardware Action Node (ESP32)
 * Subscribes to PipeGen's MQTT topic: "workplace/safety/alerts"
 * Triggers physical alarm: Red Strobe LED, Piezo Buzzer, and Status Display
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// WiFi & MQTT Credentials
const char* ssid = "Hackathon-WiFi";
const char* password = "hackathon_pass";
const char* mqtt_server = "192.168.1.100"; // IP of PipeGen Linux Machine
const int mqtt_port = 1883;
const char* alert_topic = "workplace/safety/alerts";

// Hardware Pin Definitions
#define PIN_RED_STROBE_LED  23
#define PIN_GREEN_SAFE_LED  22
#define PIN_PIEZO_BUZZER    19
#define PIN_RELAY_KILLSWITCH 18

WiFiClient espClient;
PubSubClient client(espClient);

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected! IP address: ");
  Serial.println(WiFi.localIP());
}

void trigger_alarm(const char* severity, const char* violation) {
  Serial.printf("\n>>> [PHYSICAL ALARM ACTIVATED] Severity: %s | Violation: %s\n", severity, violation);
  digitalWrite(PIN_GREEN_SAFE_LED, LOW);

  // Strobe LED and Sound Buzzer
  for (int i = 0; i < 5; i++) {
    digitalWrite(PIN_RED_STROBE_LED, HIGH);
    tone(PIN_PIEZO_BUZZER, 2400); // High pitch alarm tone
    delay(120);
    digitalWrite(PIN_RED_STROBE_LED, LOW);
    noTone(PIN_PIEZO_BUZZER);
    delay(80);
  }

  // If Critical Robot Intrusion, engage Emergency Killswitch Relay
  if (strcmp(severity, "CRITICAL") == 0) {
    digitalWrite(PIN_RELAY_KILLSWITCH, HIGH); // Cut motor power to robotic arm
    Serial.println(">>> [SAFETY RELAY] Emergency robot work cell motor cutoff engaged!");
    delay(1000);
    digitalWrite(PIN_RELAY_KILLSWITCH, LOW);
  }

  digitalWrite(PIN_GREEN_SAFE_LED, HIGH);
}

void mqtt_callback(char* topic, byte* payload, unsigned int length) {
  Serial.printf("\n[MQTT Received] Topic: %s\n", topic);
  StaticJsonDocument<512> doc;
  DeserializationError error = deserializeJson(doc, payload, length);

  if (error) {
    Serial.print("JSON parse failed: ");
    Serial.println(error.f_str());
    return;
  }

  const char* worker_id = doc["worker_id"];
  const char* violation = doc["violation_type"];
  const char* severity = doc["severity"];
  const char* zone = doc["zone_name"];

  Serial.printf("Worker: %s | Zone: %s | Violation: %s | Severity: %s\n", 
                worker_id, zone, violation, severity);

  trigger_alarm(severity, violation);
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection to PipeGen pipeline...");
    String clientId = "ESP32_ClosedLoop_Actuator-" + String(random(0xffff), HEX);
    if (client.connect(clientId.c_str())) {
      Serial.println("CONNECTED!");
      client.subscribe(alert_topic);
      digitalWrite(PIN_GREEN_SAFE_LED, HIGH);
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" retrying in 3 seconds");
      delay(3000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_RED_STROBE_LED, OUTPUT);
  pinMode(PIN_GREEN_SAFE_LED, OUTPUT);
  pinMode(PIN_PIEZO_BUZZER, OUTPUT);
  pinMode(PIN_RELAY_KILLSWITCH, OUTPUT);

  digitalWrite(PIN_GREEN_SAFE_LED, HIGH);
  digitalWrite(PIN_RED_STROBE_LED, LOW);
  digitalWrite(PIN_RELAY_KILLSWITCH, LOW);

  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(mqtt_callback);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
}
