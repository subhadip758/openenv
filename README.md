---
title: OfficeOpsEnv - AI Office Simulator
emoji: 🏢
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
app_port: 7860
---

# OfficeOpsEnv - OpenEnv AI Office Simulator

OfficeOpsEnv is a complete OpenEnv-compatible environment simulating real-world office operations. It features an email inbox, a calendar scheduling system, a customer support ticket system, and a pending tasks list. The environment challenges AI agents to classify emails, schedule meetings without conflicts, respond to tickets, and clean database records.

## Features
- **Pydantic Models**: Strongly typed definitions for State, Action, and Reward.
- **REST API**: FastAPI server for interacting with the environment (`/reset`, `/step`, `/state`, `/tasks`, `/grader`).
- **Multiple Tasks**: 
  - *Email Triage* (Easy): Classify incoming emails into folders.
  - *Meeting Scheduling* (Medium): Schedule a meeting without conflicts.
  - *Customer Support* (Hard): Read tickets, clean data in mock target systems, and respond correctly.

## Motivation
Office operations represent a massive sector of digital labor that can be automated by modern LLMs. By simulating email management, complex scheduling, and CRM/ticketing software interactions, OfficeOpsEnv provides an agentic benchmarking standard to evaluate how safely and effectively an agent can manipulate corporate digital assets.

## Spaces
**Observation Space**: Passed as a JSON string containing fully typed Pydantic models for `Email`, `CalendarEvent`, `Ticket`, and `Task`.
**Action Space**: Free-form JSON adhering to the `Action` schema, typically utilizing:
- `classify_email`: `email_id` and `target_folder`
- `schedule_meeting`: `title`, `time`, `participants`
- `respond_ticket`: `ticket_id`, `response`
- `clean_data`: `target_system`, `record_id`, `action`

## Baseline Scores
Using the default OpenAI `gpt-4o-mini` API evaluation script across all test suites yields reproducible convergence:
- **email_triage**: 1.0 / 1.0 (Easy)
- **meeting_scheduling**: 1.0 / 1.0 (Medium)
- **customer_support**: 1.0 / 1.0 (Hard)

## Setup and Run locally

1. **Install requirements:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the API server:**
   ```bash
   uvicorn main:app --port 8000
   ```

3. **Run the baseline evaluation script:** Ensure you have your `OPENAI_API_KEY` set.
   ```bash
   export OPENAI_API_KEY="sk-..."
   python baseline.py
   ```

## Docker Setup

You can build and run the OfficeOpsEnv directly using Docker:

1. **Build the image:**
   ```bash
   docker build -t officeopsenv .
   ```

2. **Run the container:**
   ```bash
   docker run -d -p 8000:8000 officeopsenv
   ```

## OpenEnv Spec

This environment includes an `openenv.yaml` that adheres to the OpenEnv specification, outlining the environment, available tasks, and container instructions.
