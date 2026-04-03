import { EmailCategory, TicketStatus, Observation } from './models';

export const Task1EmailTriage = {
  generate: () => ({
    emails: [
      { id: "e1", sender: "boss@company.com", subject: "URGENT: Report", body: "Need the report by 5 PM." },
      { id: "e2", sender: "newsletter@tech.com", subject: "Weekly Tech News", body: "Here is your weekly update." },
      { id: "e3", sender: "friend@gmail.com", subject: "Lunch?", body: "Are you free for lunch tomorrow?" },
      { id: "e4", sender: "spam@offers.com", subject: "Win a Prize!", body: "Click here to win a million dollars." }
    ],
    calendar: [],
    tickets: [],
    tasks: []
  }),
  grade: (observation: Observation) => {
    let correct = 0;
    const total = 4;
    const mapping: Record<string, EmailCategory> = {
      "e1": EmailCategory.URGENT,
      "e2": EmailCategory.ROUTINE,
      "e3": EmailCategory.SOCIAL,
      "e4": EmailCategory.SPAM
    };
    observation.emails.forEach(email => {
      if (mapping[email.id] && email.category === mapping[email.id]) {
        correct++;
      }
    });
    return correct / total;
  }
};

export const Task2MeetingScheduling = {
  generate: () => ({
    emails: [],
    calendar: [
      { id: "m1", title: "Morning Standup", start_time: "09:00", end_time: "09:30", attendees: ["team"] }
    ],
    tickets: [],
    tasks: [
      { id: "t1", description: "Schedule meeting with HR at 10:00", priority: 1, completed: false }
    ]
  }),
  grade: (observation: Observation) => {
    const scheduled = observation.calendar.some(m => m.start_time === "10:00" && m.title.includes("HR"));
    return scheduled ? 1.0 : 0.0;
  }
};

export const Task3CustomerSupport = {
  generate: () => ({
    emails: [],
    calendar: [],
    tickets: [
      { id: "tk1", customer: "Alice", issue: "Cannot login", priority: 3, status: TicketStatus.OPEN },
      { id: "tk2", customer: "Bob", issue: "Billing error", priority: 2, status: TicketStatus.OPEN }
    ],
    tasks: []
  }),
  grade: (observation: Observation) => {
    const closed = observation.tickets.filter(t => t.status === TicketStatus.CLOSED).length;
    return closed / 2.0;
  }
};

export const TASKS: Record<string, any> = {
  "1": Task1EmailTriage,
  "2": Task2MeetingScheduling,
  "3": Task3CustomerSupport
};
