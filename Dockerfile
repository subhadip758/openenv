# Stage 1: Build React App
FROM node:20 AS build-stage
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve with Python/FastAPI
FROM python:3.11-slim
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code first (so Stage 2 exists for Stage 1 to copy from or vice versa)
COPY . .

# Copy built frontend from Stage 1 (specifically the dist folder)
COPY --from=build-stage /app/dist ./dist

# Hugging Face Spaces port
EXPOSE 7860

# Run with uvicorn on port 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
