import sys
sys.path.append('.')
from scripts.core.generate_video_script import create_new_scene
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv(".env.local")
genai.configure(api_key=os.getenv("GOOGLE_GENERATIVE_AI_API_KEY"))

model = genai.GenerativeModel("gemini-2.5-flash", tools=[create_new_scene])
chat = model.start_chat(enable_automatic_function_calling=True)

print("Sending message...")
chat.send_message("Create a new scene with id 'scene_test', background 'bg_room', location 'room', time_of_day 'night', lighting 'dim'.")

print("\n--- RAW HISTORY ---")
for message in chat.history:
    print(message)
    print("---")