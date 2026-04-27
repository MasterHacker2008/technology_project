from machine import Pin, PWM
import time

barrier_state = False  # False = closed

class Servo:
    def __init__(self, pin=2, hz=50):
        self._servo = PWM(Pin(pin))
        self._servo.freq(hz)

    def ServoAngle(self, pos):
        pos = max(0, min(180, pos))
        duty = int((pos / 180) * 6552) + 1638
        self._servo.duty_u16(duty)

servo = Servo(pin=9)
red_led = Pin(13, Pin.OUT)
green_led = Pin(12, Pin.OUT)


def barrier_open():
    global barrier_state
    servo.ServoAngle(0)
    green_led.value(1)
    red_led.value(0)
    barrier_state = True
    print("Barrier opened")

    # late import to avoid circular dependency
    from net_server import sendStatus
    sendStatus(True)


def barrier_close():
    global barrier_state
    servo.ServoAngle(90)
    green_led.value(0)
    red_led.value(1)
    barrier_state = False
    print("Barrier closed")

    from net_server import sendStatus
    sendStatus(False)


def toggle_barrier():
    if barrier_state:
        barrier_close()
    else:
        barrier_open()
        
        



