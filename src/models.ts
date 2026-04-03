export enum EmailCategory {
  URGENT = "urgent",
  ROUTINE = "routine",
  SPAM = "spam",
  SOCIAL = "social"
}

export interface Email {
  id: string;
  sender: string;
  subject: string;
  body: string;
  category?: EmailCategory;
}

export interface Meeting {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  attendees: string[];
}

export enum TicketStatus {
  OPEN = "open",
  IN_PROGRESS = "in_progress",
  CLOSED = "closed"
}

export interface Ticket {
  id: string;
  customer: string;
  issue: string;
  priority: number;
  status: TicketStatus;
  response?: string;
}

export interface Task {
  id: string;
  description: string;
  priority: number;
  completed: boolean;
}

export interface Observation {
  emails: Email[];
  calendar: Meeting[];
  tickets: Ticket[];
  pending_tasks: Task[];
  step_count: number;
  max_steps: number;
}

export enum ActionType {
  CLASSIFY_EMAIL = "classify_email",
  SCHEDULE_MEETING = "schedule_meeting",
  RESPOND_TICKET = "respond_ticket",
  CLEAN_DATA = "clean_data"
}

export interface Action {
  type: ActionType;
  parameters: Record<string, any>;
}

export interface Reward {
  value: number;
  reason: string;
}

export interface State {
  observation: Observation;
  done: boolean;
  info: Record<string, any>;
}
