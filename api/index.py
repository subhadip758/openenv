import sys
import os

# Add the root directory to the python path so imports in main.py work correctly
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from main import app
