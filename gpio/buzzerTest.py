import json
import time

import RPi.GPIO as GPIO

# Buzzer configuration
BUZZER_PIN = 18
GPIO.setmode(GPIO.BCM)
GPIO.setup(BUZZER_PIN, GPIO.OUT)

# Define Happy Birthday notes
notes = {
    "B4": 494,
    "C5": 522,
    "D5": 587,
    "E5": 659,
    "F5": 700,
    "G5": 784,
    "A5": 880,
    "X": 0,
}

song = [
    ("G5", 0.5), ("E5", 0.5), ("E5", 1),
    ("F5", 0.5), ("D5", 0.5), ("D5", 1),
    ("C5", 0.5), ("D5", 0.5), ("E5", 0.5), ("F5", 0.5),
    ("G5", 0.5),("G5", 0.5),("G5", 1),

    ("G5", 0.5), ("E5", 0.5), ("E5", 1),
    ("F5", 0.5), ("D5", 0.5), ("D5", 1),
    ("C5", 0.5), ("E5", 0.5), ("G5", 0.5), ("G5", 0.5),
    ("X",2), ("C5", 2)
]

# Function to play a note
def play_buzzer(note, duration):
    frequency = notes.get(note, 0)
    if frequency > 0:
        buzzer = GPIO.PWM(BUZZER_PIN, frequency)
        buzzer.start(70)  # 50% duty cycle
        time.sleep(duration)
        buzzer.stop()
    else:
        time.sleep(duration)

# Path to the data file
data_file_path = "../backend/data.json"

def read_timer_state():
    """Read mode and timeLeft from the data.json file."""
    with open(data_file_path, "r") as file:
        data = json.load(file)
    return data.get("mode", "Work"), data.get("timeLeft", 0)

try:
    while True:
        # Read timer state
        mode, time_left = read_timer_state()

        # Display on LCD (reuse your existing LCD code here)

        # Check if time has reached 0
        if time_left == 0:
            print("Time's up! Playing Happy Birthday...")
            for note, duration in song:
                play_buzzer(note, duration)
            time.sleep(4)  # Prevent retriggering immediately

        time.sleep(1)

except KeyboardInterrupt:
    GPIO.cleanup()
    print("Exiting...")

