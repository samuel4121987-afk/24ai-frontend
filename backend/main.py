"""
Backend API Server for AI Control Assistant
Handles authentication, WebSocket connections, and ChatGPT API integration
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import openai
import json
import asyncio
from typing import Dict, Set
import os
from datetime import datetime
import zipfile
import tempfile
from pathlib import Path

app = FastAPI(title="AI Control API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://24ai.org.es", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store active connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.agent_connections: Dict[str, WebSocket] = {}
    
    async def connect_web(self, access_code: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[access_code] = websocket
    
    async def connect_agent(self, access_code: str, websocket: WebSocket):
        await websocket.accept()
        self.agent_connections[access_code] = websocket
    
    def disconnect_web(self, access_code: str):
        if access_code in self.active_connections:
            del self.active_connections[access_code]
    
    def disconnect_agent(self, access_code: str):
        if access_code in self.agent_connections:
            del self.agent_connections[access_code]
    
    async def send_to_agent(self, access_code: str, message: dict):
        if access_code in self.agent_connections:
            await self.agent_connections[access_code].send_json(message)
    
    async def send_to_web(self, access_code: str, message: dict):
        if access_code in self.active_connections:
            await self.active_connections[access_code].send_json(message)

manager = ConnectionManager()

# Models
class AccessRequest(BaseModel):
    email: str
    use_case: str
    message: str = ""

class CommandRequest(BaseModel):
    command: str
    access_code: str

# Routes
@app.post("/api/access-request")
async def request_access(request: AccessRequest):
    """Handle access request and send email to admin"""
    print(f"Access request from {request.email}")
    print(f"Use case: {request.use_case}")
    print(f"Message: {request.message}")
    
    return {
        "status": "success",
        "message": "Access request submitted. You'll receive your code within 24 hours."
    }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, code: str, client_type: str = "web"):
    """WebSocket endpoint for real-time communication"""
    
    if client_type == "web":
        await manager.connect_web(code, websocket)
    else:
        await manager.connect_agent(code, websocket)
    
    try:
        while True:
            data = await websocket.receive_json()
            
            if client_type == "agent":
                # Forward screen frames and results to web client
                await manager.send_to_web(code, data)
            else:
                # Handle command from web client
                if data.get('type') == 'command':
                    command_text = data.get('command')
                    
                    # Get API key from environment variable
                    api_key = os.getenv('OPENAI_API_KEY')
                    
                    if not api_key or not api_key.startswith('sk-'):
                        await websocket.send_json({
                            'type': 'error',
                            'message': 'OpenAI API key not configured on server. Please contact administrator.'
                        })
                        continue
                    
                    try:
                        # Use OpenAI to process the command intelligently
                        client = openai.OpenAI(api_key=api_key)
                        
                        response = client.chat.completions.create(
                            model="gpt-4o",
                            messages=[
                                {
                                    "role": "system",
                                    "content": """You are an expert AI assistant that controls computers through natural language commands. You can:

1. **Browser Control**: Open browsers, navigate URLs, search
2. **Application Control**: Open/close apps, switch windows
3. **Mouse & Keyboard**: Click, type, move cursor, keyboard shortcuts
4. **File Operations**: Create, edit, save files
5. **Coding Tasks**: Write code, debug, create projects
6. **Problem Solving**: Research, analyze, execute complex multi-step tasks

For EVERY command, break it down into atomic actions and return a JSON array of steps.

Available action types:
- open_url: {url: "https://..."} - Opens URL in default browser
- open_app: {app: "Safari"/"Chrome"/"VSCode"/"Terminal"/etc} - Opens application
- keyboard_type: {text: "text to type"} - Types text
- keyboard_press: {key: "enter"/"tab"/"cmd+c"/etc} - Presses key/shortcut
- mouse_click: {x: 100, y: 200} - Clicks at coordinates (requires screen analysis)
- mouse_move: {x: 100, y: 200} - Moves mouse
- scroll: {amount: 3} - Scrolls (positive=down, negative=up)
- wait: {seconds: 2} - Waits before next action

For complex tasks like "open YouTube and search for sad music":
1. open_url with YouTube URL
2. wait for page load
3. mouse_click on search box (estimate coordinates)
4. keyboard_type the search query
5. keyboard_press enter

Return ONLY valid JSON array: [{"type": "action_type", "params": {...}}, ...]

Be intelligent and break down ANY task into executable steps."""
                                },
                                {
                                    "role": "user",
                                    "content": command_text
                                }
                            ],
                            temperature=0.7
                        )
                        
                        # Parse the AI response
                        ai_response = response.choices[0].message.content.strip()
                        
                        # Try to extract JSON from the response
                        if '```json' in ai_response:
                            ai_response = ai_response.split('```json')[1].split('```')[0].strip()
                        elif '```' in ai_response:
                            ai_response = ai_response.split('```')[1].split('```')[0].strip()
                        
                        actions = json.loads(ai_response)
                        
                        # Ensure it's a list
                        if not isinstance(actions, list):
                            actions = [actions]
                        
                        # Send actions to agent
                        await manager.send_to_agent(code, {
                            "type": "execute_sequence",
                            "actions": actions
                        })
                        
                        # Notify web client
                        await websocket.send_json({
                            'type': 'command_processing',
                            'message': f'Executing {len(actions)} actions...',
                            'actions': actions
                        })
                        
                    except json.JSONDecodeError as e:
                        await websocket.send_json({
                            'type': 'error',
                            'message': f'Failed to parse AI response: {str(e)}'
                        })
                    except Exception as e:
                        await websocket.send_json({
                            'type': 'error',
                            'message': f'Error processing command: {str(e)}'
                        })
                else:
                    # Forward other messages to agent
                    await manager.send_to_agent(code, data)
                
    except WebSocketDisconnect:
        if client_type == "web":
            manager.disconnect_web(code)
        else:
            manager.disconnect_agent(code)

@app.get("/api/download-agent")
async def download_agent():
    """Generate and serve the desktop agent package as a zip file"""
    try:
        # Get the desktop-agent directory path
        backend_dir = Path(__file__).parent
        project_root = backend_dir.parent
        agent_dir = project_root / "desktop-agent"
        
        if not agent_dir.exists():
            raise HTTPException(status_code=404, detail="Desktop agent files not found")
        
        # Create a temporary zip file
        temp_dir = tempfile.gettempdir()
        zip_path = os.path.join(temp_dir, "24ai-desktop-agent.zip")
        
        # Create the zip file
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            # Add agent.py
            agent_py = agent_dir / "agent.py"
            if agent_py.exists():
                zipf.write(agent_py, "24ai-desktop-agent/agent.py")
            
            # Add requirements.txt
            requirements = agent_dir / "requirements.txt"
            if requirements.exists():
                zipf.write(requirements, "24ai-desktop-agent/requirements.txt")
            
            # Add install.py
            install_py = agent_dir / "install.py"
            if install_py.exists():
                zipf.write(install_py, "24ai-desktop-agent/install.py")
            
            # Create a simple installer script for Mac/Linux
            installer_script = """#!/bin/bash
# 24/7 AI Control Assistant Installer

echo "Installing 24/7 AI Control Assistant..."
echo "======================================"

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is required but not installed."
    echo "Please install Python 3 and try again."
    exit 1
fi

# Install Python dependencies
echo "Installing dependencies..."
python3 -m pip install -r requirements.txt

# Run the installer
echo "Running installer..."
python3 install.py

echo ""
echo "Installation complete!"
echo "You can now run the agent with: python3 agent.py"
"""
            zipf.writestr("24ai-desktop-agent/24ai-installer.command", installer_script)
        
        # Return the zip file
        return FileResponse(
            path=zip_path,
            media_type="application/zip",
            filename="24ai-desktop-agent.zip"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating package: {str(e)}")

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "active_connections": len(manager.active_connections),
        "active_agents": len(manager.agent_connections)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
