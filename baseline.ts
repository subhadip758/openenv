import axios from 'axios';
import { GoogleGenAI } from '@google/genai';

const API_URL = "http://localhost:3000";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

async function runTask(taskId: string) {
  console.log(`\n--- Running Task ${taskId} ---`);
  const resetRes = await axios.post(`${API_URL}/reset?task_id=${taskId}`);
  let obs = resetRes.data;
  
  let done = false;
  let totalReward = 0;
  
  while (!done) {
    const prompt = `
      You are an office assistant. 
      Current Observation: ${JSON.stringify(obs)}
      Available Actions: classify_email, schedule_meeting, respond_ticket, clean_data.
      
      Choose one action and return it as JSON in the format:
      {"type": "action_type", "parameters": {...}}
      Only return the JSON.
    `;

    let action;
    if (!GEMINI_API_KEY || GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
      // Heuristic baseline if no key
      if (taskId === "1") {
        const unclassified = obs.emails.find((e: any) => !e.category);
        if (unclassified) {
          action = { type: "classify_email", parameters: { email_id: unclassified.id, category: "urgent" } };
        } else {
          action = { type: "clean_data", parameters: {} };
        }
      } else if (taskId === "2") {
        action = { type: "schedule_meeting", parameters: { title: "HR Meeting", start_time: "10:00", end_time: "11:00" } };
      } else if (taskId === "3") {
        const openTicket = obs.tickets.find((t: any) => t.status === "open");
        if (openTicket) {
          action = { type: "respond_ticket", parameters: { ticket_id: openTicket.id, response: "Fixed" } };
        } else {
          action = { type: "clean_data", parameters: {} };
        }
      } else {
        action = { type: "clean_data", parameters: {} };
      }
    } else {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      action = JSON.parse(response.text || "{}");
    }

    console.log(`Action: ${JSON.stringify(action)}`);
    await new Promise(r => setTimeout(r, 1500)); // Artificial delay to watch the UI!
    const stepRes = await axios.post(`${API_URL}/step`, action);
    const stepData = stepRes.data;
    obs = stepData.observation;
    totalReward += stepData.reward;
    done = stepData.done;
    
    if (stepData.info?.reason) {
      console.log(`Result: ${stepData.info.reason}`);
    }
  }

  const gradeRes = await axios.get(`${API_URL}/grader`);
  console.log(`Final Score: ${gradeRes.data.score}`);
  return gradeRes.data.score;
}

async function main() {
  const scores: Record<string, number> = {};
  for (const tid of ["1", "2", "3"]) {
    try {
      scores[tid] = await runTask(tid);
    } catch (e) {
      console.error(`Error running task ${tid}:`, e);
    }
  }
  
  console.log("\n--- Summary ---");
  Object.entries(scores).forEach(([tid, score]) => {
    console.log(`Task ${tid}: ${score}`);
  });
}

main();
