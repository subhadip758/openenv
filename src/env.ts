import { v4 as uuidv4 } from 'uuid';
import { 
  Observation, Action, ActionType, State, Email, Meeting, Ticket, Task, 
  EmailCategory, TicketStatus 
} from './models';

export class OfficeOpsEnv {
  private emails: Email[] = [];
  private calendar: Meeting[] = [];
  private tickets: Ticket[] = [];
  private tasks: Task[] = [];
  private step_count: number = 0;
  private max_steps: number;
  private done: boolean = false;

  constructor(max_steps: number = 10) {
    this.max_steps = max_steps;
    this.reset();
  }

  reset(scenario?: any): Observation {
    if (scenario) {
      this.emails = scenario.emails || [];
      this.calendar = scenario.calendar || [];
      this.tickets = scenario.tickets || [];
      this.tasks = scenario.tasks || [];
    } else {
      this.emails = [];
      this.calendar = [];
      this.tickets = [];
      this.tasks = [];
    }
    
    this.step_count = 0;
    this.done = false;
    return this.getObservation();
  }

  getObservation(): Observation {
    return {
      emails: this.emails,
      calendar: this.calendar,
      tickets: this.tickets,
      pending_tasks: this.tasks.filter(t => !t.completed),
      step_count: this.step_count,
      max_steps: this.max_steps
    };
  }

  step(action: Action): [Observation, number, boolean, any] {
    if (this.done) {
      return [this.getObservation(), 0, true, { error: "Environment already done" }];
    }

    this.step_count++;
    let rewardValue = 0;
    let reason = "Action processed";

    switch (action.type) {
      case ActionType.CLASSIFY_EMAIL: {
        const { email_id, category } = action.parameters;
        const email = this.emails.find(e => e.id === email_id);
        if (email) {
          if (!email.category) {
            email.category = category as EmailCategory;
            rewardValue = 1.0;
            reason = `Classified email ${email_id}`;
          } else {
            rewardValue = -0.5;
            reason = `Email ${email_id} already classified`;
          }
        } else {
          rewardValue = -1.0;
          reason = `Email ${email_id} not found`;
        }
        break;
      }

      case ActionType.SCHEDULE_MEETING: {
        const meetingData = action.parameters;
        const newMeeting: Meeting = {
          id: uuidv4(),
          title: meetingData.title || "Untitled",
          start_time: meetingData.start_time,
          end_time: meetingData.end_time,
          attendees: meetingData.attendees || []
        };
        
        const overlap = this.calendar.some(m => m.start_time === newMeeting.start_time);
        
        if (!overlap) {
          this.calendar.push(newMeeting);
          rewardValue = 2.0;
          reason = "Meeting scheduled successfully";
        } else {
          rewardValue = -1.0;
          reason = "Meeting overlap detected";
        }
        break;
      }

      case ActionType.RESPOND_TICKET: {
        const { ticket_id, response } = action.parameters;
        const ticket = this.tickets.find(t => t.id === ticket_id);
        if (ticket) {
          if (ticket.status === TicketStatus.OPEN) {
            ticket.status = TicketStatus.CLOSED;
            ticket.response = response;
            rewardValue = 3.0;
            reason = `Responded to ticket ${ticket_id}`;
          } else {
            rewardValue = -0.5;
            reason = `Ticket ${ticket_id} already closed`;
          }
        } else {
          rewardValue = -1.0;
          reason = `Ticket ${ticket_id} not found`;
        }
        break;
      }

      case ActionType.CLEAN_DATA: {
        let cleaned = 0;
        this.tasks.forEach(task => {
          if (task.description.toLowerCase().includes("clean") && !task.completed) {
            task.completed = true;
            cleaned++;
          }
        });
        
        if (cleaned > 0) {
          rewardValue = 1.5 * cleaned;
          reason = `Cleaned ${cleaned} data entries`;
        } else {
          rewardValue = -0.5;
          reason = "No data to clean";
        }
        break;
      }
    }

    if (this.step_count >= this.max_steps) {
      this.done = true;
    }

    return [this.getObservation(), rewardValue, this.done, { reason }];
  }

  state(): State {
    return {
      observation: this.getObservation(),
      done: this.done,
      info: {}
    };
  }
}
