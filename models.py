from typing import List, Literal, Optional, Dict, Any, Union
from pydantic import BaseModel, Field

class Email(BaseModel):
    id: str
    sender: str
    subject: str
    body: str
    folder: str = "inbox"  # inbox, trash, work, personal, spam

class CalendarEvent(BaseModel):
    id: str
    time: str
    title: str
    participants: List[str]

class Ticket(BaseModel):
    id: str
    customer: str
    issue: str
    status: str = "open"  # open, resolved

class PendingTask(BaseModel):
    id: str
    description: str
    priority: Literal["low", "medium", "high"]

class Observation(BaseModel):
    emails: List[Email]
    calendar: List[CalendarEvent]
    tickets: List[Ticket]
    pending_tasks: List[PendingTask]

# Action Models
class ClassifyEmailAction(BaseModel):
    action_type: Literal["classify_email"] = "classify_email"
    email_id: str
    target_folder: str

class ScheduleMeetingAction(BaseModel):
    action_type: Literal["schedule_meeting"] = "schedule_meeting"
    time: str
    title: str
    participants: List[str]

class RespondTicketAction(BaseModel):
    action_type: Literal["respond_ticket"] = "respond_ticket"
    ticket_id: str
    response: str

class CleanDataAction(BaseModel):
    action_type: Literal["clean_data"] = "clean_data"
    target_system: str
    record_id: str
    action: str

Action = Union[
    ClassifyEmailAction,
    ScheduleMeetingAction,
    RespondTicketAction,
    CleanDataAction
]

class Reward(BaseModel):
    score: float
    is_done: bool
    metrics: Dict[str, Any]
