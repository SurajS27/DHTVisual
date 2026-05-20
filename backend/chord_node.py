from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

class ChordNode:
    def __init__(self, node_id, pred_id, finger_table):
        self.ID = node_id  # Current node ID
        self.pred = pred_id  # Predecessor ID
        self.finger_table = finger_table  # Finger table of this node

    def in_range(self, start, key, end):
        """Check if key is in the range [start, end) considering modulo-32 arithmetic."""
        if start < end:
            return start < key <= end
        else:
            return start < key or key <= end

    def localSuccNode(self, key):
        """Find the successor node responsible for the key using modulo-32 arithmetic."""
        m = 5  # modulo 2^m where m = 5
        key_mod = key % (2 ** m)  # Normalize the key using modulo-32

        # Step 1: Check if the current node is responsible for the key
        if self.in_range(self.pred, key_mod, self.ID):
            return self.ID  # Current node holds the key

        # Step 2: Check if the successor node is responsible
        if self.in_range(self.ID, key_mod, self.finger_table[0]):
            return self.finger_table[0]  # Successor holds the key

        # Step 3: Search through the finger table to find the closest preceding node
        for i in range(len(self.finger_table) - 1):
            if self.in_range(self.finger_table[i], key_mod, self.finger_table[i + 1]):
                return self.finger_table[i]  # Forward to the next node

        # Step 4: If no node found, forward to the last entry in the finger table
        return self.finger_table[-1]

    def lookup(self, key):
        """Handle lookup requests by using the localSuccNode method."""
        res_node = self.localSuccNode(key)
        responsible_node = res_node%32

        # Build the lookup trail
        trail = [self.ID]  # Start with the current node ID
        if responsible_node != self.ID:
            # If the responsible node is not this node, we need to forward the request
            # Here, we assume a synchronous call for simplicity.
            # In a real-world scenario, you'd make an HTTP request to the responsible node's lookup endpoint.
            trail.append(responsible_node)

        return jsonify({'responsible_node': responsible_node, 'trail': ' -> '.join(map(str, trail))})

# Flask route to handle lookup requests
@app.route('/lookup', methods=['POST'])
def lookup_route():
    data = request.json
    key = data['key']
    return node.lookup(key)

if __name__ == '__main__':
    # Initialize the node with environment variables
    node_id = int(os.environ.get('NODE_ID'))
    pred_id = int(os.environ.get('PRED_ID'))
    finger_table = eval(os.environ.get('FINGER_TABLE'))  # Assuming finger table is passed as a list string
    finger_table = [int(x) for x in finger_table]
    node = ChordNode(node_id, pred_id, finger_table)
    app.run(host='0.0.0.0', port=5000)

