import tensorflow as tf

def test_model():
    interpreter = tf.lite.Interpreter(model_path="best_float32.tflite")
    interpreter.allocate_tensors()
    
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()
    
    print("INPUT DETAILS:")
    for idx, detail in enumerate(input_details):
        print(f"  Input {idx}: Name='{detail['name']}', Shape={detail['shape']}, Type={detail['dtype']}")
        
    print("\nOUTPUT DETAILS:")
    for idx, detail in enumerate(output_details):
        print(f"  Output {idx}: Name='{detail['name']}', Shape={detail['shape']}, Type={detail['dtype']}")

if __name__ == "__main__":
    test_model()
