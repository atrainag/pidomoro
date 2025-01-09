import json
import time

import RPi.GPIO as GPIO

# Setup GPIO
GPIO.setmode(GPIO.BCM)

# Define GPIO pins for both sensors
TRIG1 = 23  # Player 1 Trigger pin
ECHO1 = 24  # Player 1 Echo pin

TRIG2 = 17  # Player 2 Trigger pin
ECHO2 = 27  # Player 2 Echo pin

# Set up GPIO pins for both sensors
GPIO.setup(TRIG1, GPIO.OUT)
GPIO.setup(ECHO1, GPIO.IN)

GPIO.setup(TRIG2, GPIO.OUT)
GPIO.setup(ECHO2, GPIO.IN)

filePath = "../backend/paddle.json"

# Load game state from data2.json
def load_game_state():
    try:
        with open(filePath, 'r') as file:
            game_state = json.load(file)
        return game_state
    except FileNotFoundError:
        # If file doesn't exist, return a default game state
        return {
            "left": 50, "right": 50
        }

# Save the updated game state to data2.json
def save_game_state(game_state):
    with open(filePath, 'w') as file:
        json.dump(game_state, file, indent=1)

def get_distance(TRIG, ECHO):
    """Measure distance using ultrasonic sensor."""
    GPIO.output(TRIG, GPIO.LOW)
    time.sleep(0.1)  # Wait for the sensor to settle
    GPIO.output(TRIG, GPIO.HIGH)
    time.sleep(0.00001)  # 10 microseconds pulse
    GPIO.output(TRIG, GPIO.LOW)

    pulse_start = 0
    pulse_end = 0
    # Measure the pulse width on Echo pin
    while GPIO.input(ECHO) == GPIO.LOW:
        pulse_start = time.time()

    while GPIO.input(ECHO) == GPIO.HIGH:
        pulse_end = time.time()

    # Calculate distance (in cm)
    pulse_duration = pulse_end - pulse_start
    distance = pulse_duration * 17150  # Speed of sound is 343 m/s, or 17150 cm/s
    distance = round(distance, 2)

    return distance

def update_paddle_position(game_state, player, distance):
    """Update paddle position based on sensor distance."""
    if distance <= 30:  # Only update if the sensor reading is valid (<= 30 cm)
        paddle_position = -10 + (distance / 30) * 100  # Map distance to a percentage (0-100)
        if player == 1:
            game_state["left"] = paddle_position
        elif player == 2:
            game_state["right"] = paddle_position
    # No update if distance > 30, paddle stays the same

try:

    game_state = load_game_state()  # Load the current game state
    while True:
        # Get the distance for both players
        distance_player1 = get_distance(TRIG1, ECHO1)
        distance_player2 = get_distance(TRIG2, ECHO2)

        # Update the paddle positions based on the distance readings
        update_paddle_position(game_state, 1, distance_player1)
        update_paddle_position(game_state, 2, distance_player2)

        # Print the updated paddle positions for debugging
        print(f"Player 1 Distance: {distance_player1} cm, Paddle Position: {game_state['left']}")
        print(f"Player 2 Distance: {distance_player2} cm, Paddle Position: {game_state['right']}")

        # Save the updated game state to data2.json
        save_game_state(game_state)

        time.sleep(0.1)  # Delay to ensure close to real-time response

except KeyboardInterrupt:
    print("Measurement stopped by user")
finally:

    GPIO.cleanup()  # Clean up GPIO settings

