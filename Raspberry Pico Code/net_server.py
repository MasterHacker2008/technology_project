import network
import time
import ujson as json
import uwebsockets
import asyncio


#WEBSOCKET_URL = "wss://flood-barrier-server.onrender.com"
WEBSOCKET_URL = "ws://192.168.1.1:3000/ws"

# net_server.py
current_level = 2  # default level trigger
sensor_status = True

ws = None   # GLOBAL websocket


def connect_wifi(ssid, password):
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    wlan.connect(ssid, password)
    
    while wlan.isconnected() == False:
        print('Waiting for connection...')
        time.sleep(1)
    ip = wlan.ifconfig()[0]
    print(f'Connected on {ip}')


def safe_send(payload):
    """Safely send data only if WebSocket is connected"""
    global ws
    try:
        if ws:
            ws.send(json.dumps(payload))
    except:
        pass
        print("Send failed — will wait for reconnection")
        

def initialSend(barrier_state, sensor_state):
    safe_send({"type": "init", "barrier": barrier_state, "sensor": sensor_state})
    

def sendStatus(state):
    safe_send({"type": "status", "barrier": state})


def sendLevel(distance):
    safe_send({"type": "water_level", "distance": distance})


def connect_ws():
    global ws
    url = WEBSOCKET_URL
    print("Connecting to:", url)
    ws = uwebsockets.connect(url)
    return ws


def start_websocket():
    """Runs in a thread."""
    global ws
    while True:
        try:
            #print("Connecting to WebSocket server...")
            ws = connect_ws()

            ws.send(json.dumps({"type": "pico_hello"}))
            #print("Connected to server.")
            
            

            while True:
                msg = ws.recv()
        
                if msg:
                    data = json.loads(msg)
                    print("Received:", data)

                    # Only import here to prevent circular import
                    from barrier import barrier_open, barrier_close, barrier_state

                    action = data.get("action")
                    if action == "deploy":
                        barrier_open()

                    elif action == "retract":
                        barrier_close()

                            
                    elif action == "sensorStatus": 
                        # update the main.py 'level' variable
                        status = data.get("value")
                        if status is not None:
                            global sensor_status
                            sensor_status = status
                            print("Updated sensor status to:", sensor_status)
                    
                    elif action == "init":
                        initialSend(barrier_state, sensor_status)
                    

                time.sleep(0.05)

        except Exception as e:
            print("WebSocket error:", e)
            ws = None
            print("Reconnecting in 5 seconds...")
            time.sleep(5)
            
            

