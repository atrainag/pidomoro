import json
import time

import smbus

# LCD configuration
I2C_ADDRESS = 0x27  # Your LCD's I2C address
LCD_WIDTH = 16      # LCD width in characters
LCD_CHR = 1         # Sending data
LCD_CMD = 0         # Sending command

# LCD commands
LCD_CLEAR = 0x01  # Command to clear display
LCD_HOME = 0x02   # Command to return cursor to home
LCD_LINE_1 = 0x80  # LCD RAM address for the 1st line
LCD_LINE_2 = 0xC0  # LCD RAM address for the 2nd line

# Timing constants
E_PULSE = 0.0005
E_DELAY = 0.0005

# Initialize SMBus
bus = smbus.SMBus(1)  # Use SMBus(1) for Raspberry Pi

def lcd_send_byte(data, mode):
    """Send a byte to the LCD."""
    try:
        high_bits = mode | (data & 0xF0) | 0x08
        low_bits = mode | ((data << 4) & 0xF0) | 0x08

        # Write high bits
        bus.write_byte(I2C_ADDRESS, high_bits)
        lcd_toggle_enable(high_bits)

        # Write low bits
        bus.write_byte(I2C_ADDRESS, low_bits)
        lcd_toggle_enable(low_bits)
    except Exception as e:
        print(f"Error sending byte to LCD: {e}")

def lcd_toggle_enable(data):
    """Toggle enable pin on LCD."""
    time.sleep(E_DELAY)
    bus.write_byte(I2C_ADDRESS, data | 0x04)  # Enable high
    time.sleep(E_PULSE)
    bus.write_byte(I2C_ADDRESS, data & ~0x04)  # Enable low
    time.sleep(E_DELAY)

def lcd_clear():
    """Clear the LCD display."""
    lcd_send_byte(LCD_CLEAR, LCD_CMD)
    time.sleep(0.002)  # Delay to process the clear command

def lcd_init():
    """Initialize the LCD."""
    lcd_send_byte(0x33, LCD_CMD)  # Initialize to 8-bit mode
    lcd_send_byte(0x32, LCD_CMD)  # Switch to 4-bit mode
    lcd_send_byte(0x28, LCD_CMD)  # 2-line, 5x7 matrix
    lcd_send_byte(0x0C, LCD_CMD)  # Turn display on, no cursor
    lcd_send_byte(0x06, LCD_CMD)  # Increment cursor
    lcd_send_byte(LCD_CLEAR, LCD_CMD)  # Clear display

def lcd_message(message, line):
    """Display a message on the LCD."""
    if line == 1:
        lcd_send_byte(LCD_LINE_1, LCD_CMD)
    elif line == 2:
        lcd_send_byte(LCD_LINE_2, LCD_CMD)

    # Write each character to the LCD
    for char in message.ljust(LCD_WIDTH):
        lcd_send_byte(ord(char), LCD_CHR)

# Path to the data file
data_file_path = "../backend/data.json"

def read_timer_state():
    """Read mode and timeLeft from the data.json file."""
    try:
        with open(data_file_path, "r") as file:
            data = json.load(file)
        return data.get("mode", "Work"), data.get("timeLeft", 0)
    except FileNotFoundError:
        print("Data file not found. Using default values.")
        return "Work", 0

def format_time(seconds):
    """Convert seconds to MM:SS format."""
    minutes = seconds // 60
    seconds = seconds % 60
    return f"{minutes:02}:{seconds:02}"

# Initialize the LCD
print("Initializing LCD...")
lcd_init()
print("LCD Initialized!")
lcd_clear()

prevTime ="-1:-1" 
prevMode ="Sleep" 
try:
    while True:
        # Read timer state
        mode, time_left = read_timer_state()

        # Debugging print
        print(f"Mode: {mode}, Time Left: {time_left}")

        # Format time left
        formatted_time = format_time(time_left)

        # Display on LCD
        print(f"Previous on LCD: Mode: {prevMode}, Time: {prevTime}")
        if(mode != prevMode):
            lcd_message(f"Mode: {mode}", 1)
        if(formatted_time!= prevTime):
            lcd_message(f"Time: {formatted_time}", 2)
        prevMode = mode
        prevTime = formatted_time
        # Debugging print
        print(f"Displayed on LCD: Mode: {mode}, Time: {formatted_time}")

        # Wait before refreshing
        time.sleep(1)

except KeyboardInterrupt:
    lcd_clear()
    print("Exiting...")

