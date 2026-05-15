# ARCE Quick Start Guide

Get ARCE up and running in 5 minutes! 🚀

## Prerequisites Checklist

Before you begin, make sure you have:

- [ ] **Python 3.8 or higher** installed
  - Check: `python --version`
  - Download: https://www.python.org/downloads/

- [ ] **Node.js 18 or higher** (for Playwright)
  - Check: `node --version`
  - Download: https://nodejs.org/

- [ ] **Git** installed
  - Check: `git --version`
  - Download: https://git-scm.com/downloads

- [ ] **Bob IDE** installed and running
  - Provided by IBM for the hackathon

- [ ] **GitHub CLI** (optional, for PR creation)
  - Install: `winget install GitHub.cli`
  - Authenticate: `gh auth login`

## Setup in 3 Steps

### Step 1: Clone and Setup (2 minutes)

Open PowerShell and run:

```powershell
# Clone the repository
git clone https://github.com/yashchandnani07/ARCE.git
cd ARCE

# Run the automated setup script
.\setup-mcp.ps1
```

The script will:
- ✅ Verify Python installation
- ✅ Create virtual environment
- ✅ Install all dependencies
- ✅ Validate everything works

**Expected output:**
```
========================================
  Setup Complete!
========================================

Installed versions:
  fastmcp: 2.14.7
  pytest: 8.0.0
  flask: 3.0.0
  pyyaml: 6.0.2
```

### Step 2: Get Your Python Path (30 seconds)

Copy your virtual environment Python path:

```powershell
# Windows PowerShell
(Get-Item .\venv\Scripts\python.exe).FullName
```

**Example output:**
```
d:/Projects/ARCE/venv/Scripts/python.exe
```

📋 **Copy this path** - you'll need it in the next step!

### Step 3: Configure Bob IDE (2 minutes)

1. **Open Bob IDE Settings**
   - Click gear icon (⚙️) in bottom left
   - Select "Settings"
   - Search for "MCP"

2. **Add MCP Configuration**
   - Click "Edit in settings.json"
   - Add this configuration (replace `YOUR_PYTHON_PATH`):

```json
{
  "mcpServers": {
    "arce-tools": {
      "command": "YOUR_PYTHON_PATH",
      "args": ["arce/mcp_server.py"],
      "alwaysAllow": [
        "check_reachability",
        "run_tests",
        "generate_audit_trail",
        "create_governed_pr"
      ]
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"],
      "alwaysAllow": [
        "browser_navigate",
        "browser_snapshot",
        "browser_take_screenshot",
        "browser_close",
        "browser_console_messages"
      ]
    }
  }
}
```

3. **Save and Restart Bob IDE**

4. **Verify Connection**
   - Look for MCP icon in bottom right
   - Should show green checkmarks for:
     - ✅ `arce-tools`
     - ✅ `playwright`

## Test Your Setup

### Quick Test

In Bob IDE, paste this prompt:

```
Use the check_reachability tool to analyze the demo-app directory for the yaml package.
```

**Expected response:**
```
"reachable"
```

This means the MCP server is working! 🎉

### Full Pipeline Test

1. **Scan for vulnerabilities:**
   ```powershell
   .\venv\Scripts\pip-audit.exe --format json -r demo-app/requirements.txt
   ```

2. **Copy the JSON output**

3. **In Bob IDE, switch to "ARCE Compliance Remediator" mode**

4. **Paste this prompt with the JSON:**
   ```
   I have scanned the demo-app directory with pip-audit and found vulnerabilities.
   Here is the output: [PASTE JSON HERE]
   Please execute the full remediation pipeline on the demo-app/ directory.
   ```

5. **Watch ARCE work autonomously!** 🤖
   - Checks reachability
   - Upgrades dependencies
   - Runs tests
   - Self-corrects code
   - Verifies with Playwright
   - Generates audit trail
   - Creates governed PR

## Common Issues

### "Script execution policy" error

**Fix:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### MCP server shows red X

**Fix:**
1. Verify Python path is correct
2. Make sure it points to `venv\Scripts\python.exe`
3. Check Bob IDE's Output panel for errors

### "Module 'fastmcp' not found"

**Fix:**
```powershell
.\venv\Scripts\Activate.ps1
pip install fastmcp pytest pip-audit flask pyyaml streamlit
```

### Playwright not working

**Fix:**
```powershell
npx playwright install
```

## What's Next?

### Run the Dashboard

```powershell
cd dashboard
streamlit run streamlit_app.py
```

### Explore the Tools

ARCE provides 4 custom MCP tools:

1. **check_reachability** - AST-based vulnerability analysis
2. **run_tests** - Automated pytest execution
3. **generate_audit_trail** - Compliance documentation
4. **create_governed_pr** - GitHub PR with audit evidence

### Read the Docs

- 📖 [README.md](README.md) - Full documentation
- 🔧 [MCP-CONFIGURATION-GUIDE.md](MCP-CONFIGURATION-GUIDE.md) - Detailed config guide
- 🐛 [MCP-Server-Troubleshooting.md](Project-context/MCP-Server-Troubleshooting.md) - Error solutions

## Need Help?

1. Check the troubleshooting guides
2. Review the MCP output logs in Bob IDE
3. Test the MCP server manually:
   ```powershell
   .\venv\Scripts\python.exe arce/mcp_server.py
   ```

## Success Checklist

- [ ] Setup script completed without errors
- [ ] Bob IDE shows green checkmarks for both MCP servers
- [ ] Test prompt returns "reachable" result
- [ ] Can run full remediation pipeline
- [ ] Dashboard loads successfully

If all boxes are checked, you're ready to use ARCE! 🎉

---

**Setup Time:** ~5 minutes  
**Difficulty:** Beginner-friendly  
**Support:** See troubleshooting guides for help