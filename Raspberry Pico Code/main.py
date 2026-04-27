import _thread
import asyncio
import net_server
from sensor import getDistance
from machine import Pin
from time import sleep, time
from barrier import toggle_barrier, barrier_close, barrier_open

# Connect to WiFi
#ip = net_server.connect_wifi("CBS_Drogheda_iPads", "G3tC0nn3ct3d25!")
    
def start_connection():
     net_server.connect_wifi("Masterwifi", "Masterwifi123")
     net_server.start_websocket()


# Start WebSocket thread
_thread.start_new_thread(start_connection, ())

manual_switch = Pin(4, Pin.IN, Pin.PULL_DOWN)  # active low
barrier_close()

LEVEL_SEND_INTERVAL = 10  # seconds

last_state = manual_switch.value()
last_level_sent = time()  
        
while True:
    #SENSOR CHECK
    try:
        if net_server.sensor_status:
            distance = getDistance()

            # Open barrier if below threshold
            if distance < net_server.current_level:
                barrier_open()
                net_server.sendLevel(distance)

            # Send level every 10 seconds
            if time() - last_level_sent >= LEVEL_SEND_INTERVAL:
                net_server.sendLevel(distance)
                last_level_sent = time()
                
    except:
        print("Send failed — will wait for reconnection")
    

    #MANUAL OVERRIDE
    current_state = manual_switch.value()

    if last_state == 0 and current_state == 1:
        #print("Manual override pressed")
        toggle_barrier()
        sleep(0.3)  # debounce

    last_state = current_state
    sleep(0.5)
    
