import io
import base64
import numpy as np
import tensorflow as tf
from PIL import Image, ImageDraw
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Load model
MODEL_PATH = "best_float32.tflite"
interpreter = tf.lite.Interpreter(model_path=MODEL_PATH)
interpreter.allocate_tensors()

input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

input_shape = input_details[0]['shape']  # [1, 3, 1024, 1024]
input_height = input_shape[2]
input_width = input_shape[3]

def nms(boxes, scores, iou_threshold):
    if len(boxes) == 0:
        return []
    boxes = np.array(boxes)
    scores = np.array(scores)
    
    x1 = boxes[:, 0]
    y1 = boxes[:, 1]
    x2 = boxes[:, 2]
    y2 = boxes[:, 3]
    
    areas = (x2 - x1) * (y2 - y1)
    order = scores.argsort()[::-1]
    
    keep = []
    while order.size > 0:
        i = order[0]
        keep.append(i)
        
        xx1 = np.maximum(x1[i], x1[order[1:]])
        yy1 = np.maximum(y1[i], y1[order[1:]])
        xx2 = np.minimum(x2[i], x2[order[1:]])
        yy2 = np.minimum(y2[i], y2[order[1:]])
        
        w = np.maximum(0.0, xx2 - xx1)
        h = np.maximum(0.0, yy2 - yy1)
        inter = w * h
        
        ovr = inter / (areas[i] + areas[order[1:]] - inter)
        inds = np.where(ovr <= iou_threshold)[0]
        order = order[inds + 1]
        
    return keep

@app.route('/predict', methods=['POST'])
def predict():
    if 'scan' not in request.files:
        return jsonify({"success": False, "error": "No scan file uploaded"}), 400
        
    file = request.files['scan']
    pid = request.form.get('pid', '')
    email = request.form.get('email', '')
    
    # Load image
    try:
        img_bytes = file.read()
        image = Image.open(io.BytesIO(img_bytes)).convert('RGB')
    except Exception as e:
        return jsonify({"success": False, "error": f"Invalid image file: {str(e)}"}), 400
        
    orig_w, orig_h = image.size
    
    # Preprocess: Resize to model input dimensions and normalize to [0, 1]
    resized = image.resize((input_width, input_height), Image.Resampling.BILINEAR)
    img_data = np.array(resized).astype(np.float32) / 255.0
    
    # Transpose from HWC (Height, Width, Channel) to CHW (Channel, Height, Width)
    img_data = np.transpose(img_data, (2, 0, 1))
    img_data = np.expand_dims(img_data, axis=0)
    
    # Run model inference
    interpreter.set_tensor(input_details[0]['index'], img_data)
    interpreter.invoke()
    output_data = interpreter.get_tensor(output_details[0]['index'])
    
    # Output shape: [1, 6, 21504] -> squeeze to [6, 21504]
    output = np.squeeze(output_data, axis=0)
    anchors_count = output.shape[1]
    
    candidates = []
    score_threshold = 0.25
    
    for i in range(anchors_count):
        cx = output[0, i]
        cy = output[1, i]
        w = output[2, i]
        h = output[3, i]
        conf_class0 = output[4, i]
        conf_class1 = output[5, i]
        
        # Class 0 represents the primary kidney stone/calculi class
        score = conf_class0
        if score < score_threshold:
            continue
            
        # Check if coordinates are normalized
        is_normalized = (0.0 <= cx <= 1.0) and (0.0 <= cy <= 1.0) and (0.0 <= w <= 1.0) and (0.0 <= h <= 1.0)
        
        if is_normalized:
            cx_pix = cx * input_width
            cy_pix = cy * input_height
            w_pix = w * input_width
            h_pix = h * input_height
        else:
            cx_pix = cx
            cy_pix = cy
            w_pix = w
            h_pix = h
            
        x_min = cx_pix - w_pix / 2.0
        y_min = cy_pix - h_pix / 2.0
        x_max = cx_pix + w_pix / 2.0
        y_max = cy_pix + h_pix / 2.0
        
        if (x_max - x_min) >= 2.0 and (y_max - y_min) >= 2.0:
            candidates.append({
                "box": [x_min, y_min, x_max, y_max],
                "score": float(score)
            })
            
    # Apply Non-Maximum Suppression
    boxes = [c["box"] for c in candidates]
    scores = [c["score"] for c in candidates]
    kept_indices = nms(boxes, scores, iou_threshold=0.45)
    
    stone_count = len(kept_indices)
    stone_sizes = []
    stone_locations = []
    
    # Create copy of image to draw annotations
    annotated_image = image.copy()
    draw = ImageDraw.Draw(annotated_image)
    
    scale_x = orig_w / float(input_width)
    scale_y = orig_h / float(input_height)
    
    # Assuming 1 pixel is ~0.5mm based on CT imaging resolution configuration
    mm_per_pixel = 0.5
    
    for idx in kept_indices:
        box = boxes[idx]
        score = scores[idx]
        
        # Scale bounding box back to original size
        orig_x_min = box[0] * scale_x
        orig_y_min = box[1] * scale_y
        orig_x_max = box[2] * scale_x
        orig_y_max = box[3] * scale_y
        
        box_w = orig_x_max - orig_x_min
        box_h = orig_y_max - orig_y_min
        
        # Draw bounding boxes and confidence label
        draw.rectangle([orig_x_min, orig_y_min, orig_x_max, orig_y_max], outline="red", width=4)
        label_text = f"Calculi: {score:.1%}"
        draw.text((orig_x_min + 4, max(4, orig_y_min - 18)), label_text, fill="red")
        
        # Compute stone diameter size (maximum dimension)
        size_px = max(box_w, box_h)
        size_mm = size_px * mm_per_pixel
        stone_sizes.append(f"{size_mm:.1f} mm")
        
        # Compute location
        mid_x = (orig_x_min + orig_x_max) / 2.0
        location = "Right Kidney" if mid_x > (orig_w / 2.0) else "Left Kidney"
        stone_locations.append(location)
        
    # Base64 encode the annotated image
    buffered = io.BytesIO()
    annotated_image.save(buffered, format="JPEG")
    img_str = base64.b64encode(buffered.getvalue()).decode('utf-8')
    annotated_base64 = f"data:image/jpeg;base64,{img_str}"
    
    status = "Calculi Found" if stone_count > 0 else "No Calculi Found"
    confidence = f"{np.max(scores) * 100:.1f}%" if stone_count > 0 else "0.0%"
    
    return jsonify({
        "success": True,
        "source": "tflite-model",
        "status": status,
        "confidence": confidence,
        "stone_count": stone_count,
        "stone_sizes": stone_sizes,
        "stone_locations": stone_locations,
        "annotated_image": annotated_base64,
        "message": "Predictions successfully processed using trained best_float32.tflite model."
    })

if __name__ == '__main__':
    print("Serving model on port 5000...")
    app.run(host='0.0.0.0', port=5000)
