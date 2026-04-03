import os
import time
import json
import requests
from openai import OpenAI

API_URL = os.environ.get("OPENENV_API_URL", "http://localhost:8000")

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    print("Error: OPENAI_API_KEY environment variable not set. Please set it in your .env file.")
    exit(1)

client = OpenAI(api_key=OPENAI_API_KEY)

USE_HEURISTIC_FALLBACK = False

def run_task(task_name: str):
    global USE_HEURISTIC_FALLBACK
    print(f"\n--- Running Baseline for Task: {task_name} ---")
    
    res = requests.post(f"{API_URL}/reset", json={"task_name": task_name})
    if res.status_code != 200:
        print(f"Failed to reset: {res.text}")
        return 0.0
    
    state_data = res.json()
    state = state_data.get("observation", state_data)
    
    system_prompt = """
    You are an AI assistant in an office environment. 
    You manage emails, a calendar, support tickets, and pending tasks.
    Perform the pending tasks by choosing the appropriate action.
    Valid actions (choose exactly ONE and output AS JSON ONLY): 
    - {"action_type": "classify_email", "email_id": "str", "target_folder": "str"}
    - {"action_type": "schedule_meeting", "time": "str", "title": "str", "participants": ["str"]}
    - {"action_type": "respond_ticket", "ticket_id": "str", "response": "str"}
    - {"action_type": "clean_data", "target_system": "str", "record_id": "str", "action": "str"}
    
    Output ONLY a valid JSON object. No other text, markdown, or chat formatting.
    """

    max_steps = 5
    for step_num in range(max_steps):
        print(f"Step {step_num + 1}...")
        
        state_str = json.dumps(state, indent=2)
        
        action = None
        from heuristic_agent import get_heuristic_action
        
        if USE_HEURISTIC_FALLBACK:
            action = get_heuristic_action(state, task_name)
            time.sleep(1.5)  # Visual pacing for the fallback UI
            print(f"Action (Heuristic Fallback): {action.get('action_type', 'unknown')}")
        else:
            for attempt in range(5):
                try:
                    response = client.chat.completions.create(
                        model="gpt-4o-mini",
                        messages=[
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": f"Current State:\n{state_str}\n\nWhat is your next action?"}
                        ],
                        response_format={"type": "json_object"}
                    )
                    action_text = response.choices[0].message.content.strip()
                    import re
                    match = re.search(r'(\{.*\})', action_text, re.DOTALL)
                    if match:
                        action_text = match.group(1)
                        
                    action = json.loads(action_text)
                    break
                except Exception as e:
                    print(f"Error calling OpenAI API: {e}")
                    if "insufficient_quota" in str(e) or "429" in str(e) or "401" in str(e):
                        print("API Quota Reached! Switching seamlessly to Rule-Based Heuristic Fallback...")
                        USE_HEURISTIC_FALLBACK = True
                        action = get_heuristic_action(state, task_name)
                        break
                    
                    if attempt < 4:
                        print("Retrying after 5 seconds...")
                        time.sleep(5)
                    else:
                        print("Max retries reached. Switching to Heuristic Fallback...")
                        USE_HEURISTIC_FALLBACK = True
                        action = get_heuristic_action(state, task_name)
                        break
        
        if not action:
            break
            
        try:
            print(f"Agent Action: {action.get('action_type', 'Unknown')}")
            
            step_res = requests.post(f"{API_URL}/step", json={"action": action})
            if step_res.status_code != 200:
                print(f"Action failed: {step_res.text}")
                break
                
            reward_data = step_res.json()
            is_done = reward_data.get("is_done", False)
            if is_done:
                print("Task marked as done by environment.")
                break
                
            new_state_data = requests.get(f"{API_URL}/state").json()
            state = new_state_data.get("observation", new_state_data)
            
        except Exception as e:
            print(f"Error during baseline run: {e}")
            break
            
    score_res = requests.get(f"{API_URL}/grader")
    if score_res.status_code == 200:
        score = score_res.json().get("score", 0.0)
        print(f"Final Score for {task_name}: {score}")
        return score
    else:
        print(f"Failed to get score: {score_res.text}")
        return 0.0

if __name__ == "__main__":
    try:
        requests.get(f"{API_URL}/tasks")
    except requests.exceptions.ConnectionError:
        print(f"Error: API server is not running at {API_URL}.")
        print("Start it with: python -m uvicorn main:app --port 8000")
        exit(1)

    tasks_to_run = ["email_triage", "meeting_scheduling", "customer_support"]
    scores = {}
    
    for task in tasks_to_run:
        scores[task] = run_task(task)
        
    print("\n=== Baseline Results ===")
    for t, s in scores.items():
        print(f"{t}: {s}")
