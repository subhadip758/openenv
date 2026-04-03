from typing import List, Dict, Any, Tuple
from models import Observation, Email, CalendarEvent, Ticket, PendingTask, Action

class TaskBase:
    name: str

    def generate_scenario(self) -> Observation:
        raise NotImplementedError

    def grade(self, state: Observation, action_history: List[Action]) -> float:
        raise NotImplementedError

    def get_step_reward(self, old_state: Observation, action: Action, new_state: Observation) -> float:
        return 0.0

class EmailTriageTask(TaskBase):
    name = "email_triage"

    def generate_scenario(self) -> Observation:
        return Observation(
            emails=[
                Email(id="e1", sender="boss@company.com", subject="Project Update", body="Need the report by EOD.", folder="inbox"),
                Email(id="e2", sender="lottery@spam.com", subject="You Won!", body="Click here for 1M dollars.", folder="inbox"),
                Email(id="e3", sender="mom@home.com", subject="Dinner", body="Are we still on for Sunday?", folder="inbox")
            ],
            calendar=[],
            tickets=[],
            pending_tasks=[
                PendingTask(id="pt1", description="Sort all emails in inbox to work, personal, or spam folders.", priority="high")
            ]
        )

    def grade(self, state: Observation, action_history: List[Action]) -> float:
        score = 0.0
        target_folders = {"e1": "work", "e2": "spam", "e3": "personal"}
        for email in state.emails:
            if email.id in target_folders and email.folder == target_folders[email.id]:
                score += 1.0 / len(target_folders)
        
        # Penalties for redundant actions
        redundant_penalty = max(0, (len(action_history) - len(target_folders)) * 0.1)
        return max(0.0, score - redundant_penalty)

    def get_step_reward(self, old_state: Observation, action: Action, new_state: Observation) -> float:
        if action.action_type == "classify_email":
            old_email = next((e for e in old_state.emails if e.id == action.email_id), None)
            new_email = next((e for e in new_state.emails if e.id == action.email_id), None)
            target_folders = {"e1": "work", "e2": "spam", "e3": "personal"}
            
            if new_email and new_email.folder == target_folders.get(action.email_id):
                if old_email and old_email.folder != new_email.folder:
                    return 0.33 # Partial reward
            return -0.1 # Penalty for wrong classification
        return -0.05 # Small penalty for irrelevant actions

class MeetingSchedulingTask(TaskBase):
    name = "meeting_scheduling"

    def generate_scenario(self) -> Observation:
        return Observation(
            emails=[],
            calendar=[
                CalendarEvent(id="c1", time="2026-03-25T10:00:00Z", title="Sync with Bob", participants=["Bob"]),
                CalendarEvent(id="c2", time="2026-03-25T13:00:00Z", title="Lunch with Alice", participants=["Alice"])
            ],
            tickets=[],
            pending_tasks=[
                PendingTask(id="pt2", description="Schedule a 1-hour meeting with Alice and Bob on 2026-03-25. Must not conflict with existing events.", priority="medium")
            ]
        )

    def grade(self, state: Observation, action_history: List[Action]) -> float:
        has_meeting = False
        valid_slots = ["2026-03-25T11:00:00Z", "2026-03-25T12:00:00Z", "2026-03-25T14:00:00Z", "2026-03-25T15:00:00Z"]
        for action in action_history:
            if action.action_type == "schedule_meeting":
                if "Alice" in action.participants and "Bob" in action.participants:
                    if action.time in valid_slots:
                        has_meeting = True

        score = 1.0 if has_meeting else 0.0
        penalty = max(0, (len([a for a in action_history if a.action_type == "schedule_meeting"]) - 1) * 0.2)
        return max(0.0, score - penalty)

    def get_step_reward(self, old_state: Observation, action: Action, new_state: Observation) -> float:
        if action.action_type == "schedule_meeting":
            valid_slots = ["2026-03-25T11:00:00Z", "2026-03-25T12:00:00Z", "2026-03-25T14:00:00Z", "2026-03-25T15:00:00Z"]
            if "Alice" in action.participants and "Bob" in action.participants and action.time in valid_slots:
                return 1.0
            return -0.5 # Penalty for conflict or wrong participants
        return -0.05

class CustomerSupportTask(TaskBase):
    name = "customer_support"

    def generate_scenario(self) -> Observation:
        return Observation(
            emails=[],
            calendar=[],
            tickets=[
                Ticket(id="t1", customer="John Doe", issue="Update my billing address to '123 New St'.", status="open")
            ],
            pending_tasks=[
                PendingTask(id="pt3", description="Update user database and respond to the ticket.", priority="high")
            ]
        )

    def grade(self, state: Observation, action_history: List[Action]) -> float:
        cleaned_data = False
        responded = False
        
        for action in action_history:
            if action.action_type == "clean_data" and action.target_system == "billing" and "123 New St" in action.action:
                cleaned_data = True
            if action.action_type == "respond_ticket" and action.ticket_id == "t1":
                responded = True

        score = 0.0
        if cleaned_data:
            score += 0.5
        if responded and cleaned_data:
            score += 0.5
        
        return score

    def get_step_reward(self, old_state: Observation, action: Action, new_state: Observation) -> float:
        if action.action_type == "clean_data" and action.target_system == "billing" and "123 New St" in action.action:
            return 0.5
        if action.action_type == "respond_ticket" and action.ticket_id == "t1":
            return 0.5
        return -0.1

tasks_dict = {
    EmailTriageTask.name: EmailTriageTask(),
    MeetingSchedulingTask.name: MeetingSchedulingTask(),
    CustomerSupportTask.name: CustomerSupportTask()
}
