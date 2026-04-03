import requests
import time
import os

API_URL = os.environ.get("OPENENV_API_URL", "http://localhost:8080")

def get_heuristic_action(state, task_name):
    """
    Programmatically decides the next action based on the current environment state,
    without requiring any external AI API.
    """
    observation = state.get("observation", state)
    
    if task_name == "email_triage":
        # Find the first email that is still in the "inbox"
        for email in observation.get("emails", []):
            if email.get("folder") == "inbox":
                # A simple rule-based classification based on the sender or subject
                target = "work"
                if "spam" in email.get("sender", ""):
                    target = "spam"
                elif "home" in email.get("sender", "") or "friend" in email.get("sender", ""):
                    target = "personal"
                    
                return {
                    "action_type": "classify_email", 
                    "email_id": email["id"], 
                    "target_folder": target
                }
                
    elif task_name == "meeting_scheduling":
        # Naively schedule the meeting requested in the pending_tasks
        return {
            "action_type": "schedule_meeting",
            "time": "2026-03-25T11:00:00Z", # A known free slot
            "title": "Sync Meeting",
            "participants": ["Alice", "Bob"]
        }
        
    elif task_name == "customer_support":
        # Find any open tickets and respond to them, while also cleaning data if needed
        for ticket in observation.get("tickets", []):
            if ticket.get("status") == "open":
                # First we must clean the data as required by the task
                # We can just issue the clean_data action first
                if not any(t.get("completed") for t in observation.get("pending_tasks", []) if "database" in t.get("description", "").lower()):
                    return {
                        "action_type": "clean_data",
                        "target_system": "billing",
                        "record_id": ticket["customer"],
                        "action": "Update address to 123 New St"
                    }
                
                # Then respond to the actual ticket
                return {
                    "action_type": "respond_ticket",
                    "ticket_id": ticket["id"],
                    "response": "Your billing address has been updated successfully!"
                }

    # Fallback action if nothing matches
    return {"action_type": "unknown"}

def run_heuristic_task(task_name: str):
    print(f"\n--- Running Heuristic Agent for Task: {task_name} ---")
    
    res = requests.post(f"{API_URL}/reset", json={"task_name": task_name})
    if res.status_code != 200:
        print(f"Failed to reset: {res.text}")
        return 0.0
    
    state = res.json().get("observation", res.json())
    
    max_steps = 5
    for step_num in range(max_steps):
        print(f"Step {step_num + 1}...")
        time.sleep(1.5) # Add a small visual delay for the UI
        
        action = get_heuristic_action(state, task_name)
        print(f"Heuristic Action: {action.get('action_type', 'Unknown')}")
        
        step_res = requests.post(f"{API_URL}/step", json={"action": action})
        if step_res.status_code != 200:
            print(f"Action failed: {step_res.text}")
            break
            
        reward_data = step_res.json()
        if reward_data.get("is_done", False):
            print("Task marked as done by environment.")
            break
            
        new_state_data = requests.get(f"{API_URL}/state").json()
        state = new_state_data.get("observation", new_state_data)
        
    score_res = requests.get(f"{API_URL}/grader")
    if score_res.status_code == 200:
        score = score_res.json().get("score", 0.0)
        print(f"Final Score for {task_name}: {score}")
        return score
    return 0.0

if __name__ == "__main__":
    try:
        requests.get(f"{API_URL}/tasks")
    except requests.exceptions.ConnectionError:
        print(f"Error: API server is not running at {API_URL}.")
        exit(1)

    tasks_to_run = ["email_triage", "meeting_scheduling", "customer_support"]
    scores = {}
    
    for task in tasks_to_run:
        scores[task] = run_heuristic_task(task)
        
    print("\n=== Heuristic Results ===")
    for t, s in scores.items():
        print(f"{t}: {s}")
