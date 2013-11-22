import json

from autobahn.websocket import WebSocketServerFactory, WebSocketServerProtocol

class SpookServerProtocol(WebSocketServerProtocol):
    def onOpen(self):
        self.factory.register(self)
    
    def connectionLost(self, reason):
        WebSocketServerProtocol.connectionLost(self, reason)
        self.factory.unregister(self)
          
class SpookServerFactory(WebSocketServerFactory):
    
    protocol = SpookServerProtocol
    
    def __init__(self, url, debug = False, debugCodePaths = False):
        WebSocketServerFactory.__init__(self, url, debug = debug, debugCodePaths = debugCodePaths)
        self.clients = []
        self.preparedMsg = None
        self.setProtocolOptions(allowHixie76 = True)
        
    def register(self, client):
        if not client in self.clients:
            self.clients.append(client)
            if self.preparedMsg:
                client.sendPreparedMessage(self.preparedMsg)
                
    def unregister(self, client):
        if client in self.clients:
            self.clients.remove(client)
            
    def broadcast(self, msg):
        self.preparedMsg = self.prepareMessage(msg)
        for c in self.clients:
            c.sendPreparedMessage(self.preparedMsg)
            
if __name__ == '__main__':
    from twisted.internet import reactor
    from twisted.internet.task import LoopingCall
    from autobahn.websocket import listenWS
    from pycogworks.crypto import rin2id
    import argparse
    import random
    import names
    import time
    
    parser = argparse.ArgumentParser(formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    parser.add_argument('-p', '--port', type=int, default=7000, help='the port spook will broadcast on')
    args = parser.parse_args()
    
    defaults = {'experiment': random.choice(["Williams","Tetris","FarBack","Dual N-Back"]),
                'subject_name': names.get_full_name(),
                'subject_eid': rin2id(str(random.randint(100000000, 999999999)))[0],
                'trial': [1,random.randint(50,200)],
                'status': random.choice([-1,0,1]),
                'timestamp': time.time()}# + random.randint(0, 60*60*3)}
        
    def broadcast(spook, status):
        if status['trial'][0] > status['trial'][1]:
            reactor.stop()
            return
        status['status'] = random.choice([-1,0,1])
        spook.broadcast(json.dumps(status))
        status['trial'][0] += 1
    
    spook = SpookServerFactory("ws://localhost:%d" % args.port)
    listenWS(spook)
    lc = LoopingCall(broadcast, spook, defaults)
    lc.start(1)
    reactor.run()