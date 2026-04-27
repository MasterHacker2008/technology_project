from machine import Pin
import time

Trig = Pin(3, Pin.OUT)
Echo = Pin(2, Pin.IN)

sound_timeout = 30000  # microseconds

def getDistance():
    # Send trigger pulse
    Trig.value(0)
    time.sleep_us(2)
    Trig.value(1)
    time.sleep_us(10)
    Trig.value(0)

    # Wait for echo start
    start = time.ticks_us()
    while not Echo.value():
        if time.ticks_diff(time.ticks_us(), start) > sound_timeout:
            return None

    pingStart = time.ticks_us()

    # Wait for echo end
    while Echo.value():
        if time.ticks_diff(time.ticks_us(), pingStart) > sound_timeout:
            return None

    pingStop = time.ticks_us()

    # Calculate distance (cm)
    duration = time.ticks_diff(pingStop, pingStart)
    distance = duration // 58

    return distance

#Testing

# while True:
#     time.sleep(1)
#     print(getDistance())