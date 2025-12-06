
import sys
from gtts import gTTS
import os

def generate_tts(text, output_path):
    try:
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Generate TTS
        # lang='uz' is supported by Google Translate
        tts = gTTS(text=text, lang='uz', slow=False)
        tts.save(output_path)
        
        print(f"SUCCESS: {output_path}")
        return True
    except Exception as e:
        print(f"ERROR: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python tts.py <text> <output_path>")
        sys.exit(1)
        
    text = sys.argv[1]
    output_path = sys.argv[2]
    
    generate_tts(text, output_path)
