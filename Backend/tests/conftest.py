from __future__ import annotations

import sys
import os

# Ensure Backend/ is on sys.path when running pytest from that directory
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
