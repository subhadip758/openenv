from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from typing import Dict, Any, List, Optional

from environment import OfficeOpsEnv
from tasks import tasks_dict

app = FastAPI(title="OfficeOpsEnv API")
env = OfficeOpsEnv()

class ActionRequest(BaseModel):
    action: dict

class ResetRequest(BaseModel):
    task_name: Optional[str] = None

@app.post("/reset")
def reset(task_id: Optional[str] = Query(None), req: Optional[ResetRequest] = None):
    try:
        task_name = "email_triage"
        if task_id:
            task_name = task_id
        elif req and req.task_name:
            task_name = req.task_name
            
        obs = env.reset(task_name)
        obs_dict = obs.dict()
        obs_dict["step_count"] = len(env.action_history)
        obs_dict["max_steps"] = 10
        return {
            "observation": obs_dict,
            "done": False,
            "info": {}
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/step")
def step(req: ActionRequest):
    try:
        reward = env.step(req.action)
        return reward
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/state")
def state():
    try:
        obs = env.state()
        score = env.task.grade(env.state_data, env.action_history) if env.task else 0
        done = len(env.action_history) >= 10 or score >= 1.0
        
        obs_dict = obs.dict()
        obs_dict["step_count"] = len(env.action_history)
        obs_dict["max_steps"] = 10
        
        return {
            "observation": obs_dict,
            "done": done,
            "info": {}
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

from models import Action
from pydantic import TypeAdapter

@app.get("/tasks")
def tasks():
    return {
        "tasks": list(tasks_dict.keys()),
        "action_schema": TypeAdapter(Action).json_schema()
    }

@app.get("/grader")
def grader():
    if not env.task or not env.state_data:
        raise HTTPException(status_code=400, detail="Environment not initialized.")
    score = env.task.grade(env.state_data, env.action_history)
    return {"score": score}

import subprocess
import re

@app.post("/baseline")
def run_baseline_endpoint():
    try:
        process = subprocess.run(["python", "baseline.py"], capture_output=True, text=True)
        output = process.stdout
        
        scores = {}
        for task in tasks_dict.keys():
            match = re.search(fr"{task}:\s*([0-9.]+)", output)
            if match:
                scores[task] = float(match.group(1))
            else:
                scores[task] = 0.0
                
        return {
            "status": "success",
            "scores": scores,
            "logs": output[-1000:] if output else ""
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
