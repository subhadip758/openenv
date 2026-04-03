import uuid
import copy
from typing import List, Optional, Dict, Any
from models import Observation, Action, Reward, ClassifyEmailAction, ScheduleMeetingAction, RespondTicketAction, CleanDataAction, CalendarEvent
from tasks import TaskBase, tasks_dict

class OfficeOpsEnv:
    def __init__(self):
        self.state_data: Optional[Observation] = None
        self.action_history: List[Action] = []
        self.task: Optional[TaskBase] = None
        self.reset()

    def reset(self, task_name: str = "email_triage") -> Observation:
        if task_name not in tasks_dict:
            raise ValueError(f"Unknown task: {task_name}")
        self.task = tasks_dict[task_name]
        self.state_data = self.task.generate_scenario()
        self.action_history = []
        return self.state_data

    def step(self, dict_action: dict) -> Reward:
        if not self.state_data or not self.task:
            raise ValueError("Environment not initialized. Call reset() first.")
        
        action_type = dict_action.get("action_type")
        action = None
        old_state = copy.deepcopy(self.state_data)

        if action_type == "classify_email":
            action = ClassifyEmailAction(**dict_action)
            for email in self.state_data.emails:
                if email.id == action.email_id:
                    email.folder = action.target_folder

        elif action_type == "schedule_meeting":
            action = ScheduleMeetingAction(**dict_action)
            new_event = CalendarEvent(
                id=str(uuid.uuid4()),
                time=action.time,
                title=action.title,
                participants=action.participants
            )
            self.state_data.calendar.append(new_event)

        elif action_type == "respond_ticket":
            action = RespondTicketAction(**dict_action)
            for ticket in self.state_data.tickets:
                if ticket.id == action.ticket_id:
                    ticket.status = "resolved"

        elif action_type == "clean_data":
            action = CleanDataAction(**dict_action)
            # CleanDataAction abstract effect is verified in grading via history

        else:
            raise ValueError(f"Unknown action type: {action_type}")
        
        self.action_history.append(action)
        step_reward = self.task.get_step_reward(old_state, action, self.state_data)
        
        current_score = self.task.grade(self.state_data, self.action_history)
        is_done = current_score >= 1.0
        if len(self.action_history) >= 10:
            is_done = True
            
        metrics = {
            "score": current_score,
            "step_reward": step_reward,
            "total_actions": len(self.action_history)
        }
        
        return Reward(score=current_score, is_done=is_done, metrics=metrics)

    def state(self) -> Observation:
        if not self.state_data:
            raise ValueError("Environment not initialized. Call reset() first.")
        return self.state_data
