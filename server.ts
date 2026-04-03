import express from 'express';
import { OfficeOpsEnv } from './src/env';
import { TASKS } from './src/tasks';
import { Action } from './src/models';
import path from 'path';

const app = express();
const port = 3000;

app.use(express.json());

const env = new OfficeOpsEnv();
let currentTaskId: string | null = null;

app.post('/reset', (req, res) => {
  const taskId = req.query.task_id as string;
  currentTaskId = taskId;
  let scenario = undefined;
  if (taskId && TASKS[taskId]) {
    scenario = TASKS[taskId].generate();
  }
  const obs = env.reset(scenario);
  res.json(obs);
});

app.post('/step', (req, res) => {
  const action = req.body as Action;
  const [obs, reward, done, info] = env.step(action);
  res.json({
    observation: obs,
    reward,
    done,
    info
  });
});

app.get('/state', (req, res) => {
  res.json(env.state());
});

app.get('/tasks', (req, res) => {
  res.json(Object.keys(TASKS));
});

app.get('/grader', (req, res) => {
  if (currentTaskId && TASKS[currentTaskId]) {
    const score = TASKS[currentTaskId].grade(env.getObservation());
    res.json({ score });
  } else {
    res.status(400).json({ error: "No active task to grade" });
  }
});

app.get('/baseline', (req, res) => {
  res.json({ message: "Run baseline.ts locally to see LLM performance" });
});

// Serve static files from the React app
const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`OfficeOpsEnv API listening at http://0.0.0.0:${port}`);
});
