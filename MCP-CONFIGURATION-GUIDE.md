# MCP Configuration Guide for Bob IDE

This guide explains how to configure Bob IDE to use the ARCE MCP server.

## About the Wrapper Script

The ARCE MCP server uses a wrapper script (`run_mcp_server.py`) that suppresses stderr output to eliminate false error indicators in Bob IDE. FastMCP writes informational messages (banner, version warnings) to stderr, which Bob IDE interprets as errors and displays with red indicators. The wrapper redirects stderr to devnull while keeping stdout intact for MCP protocol communication, ensuring a clean error-free experience.

## Quick Start

1. **Find your Python path** (from the ARCE directory):
   ```powershell
   # Windows PowerShell
   (Get-Command python).Source
   # Or if using the virtual environment:
   .\venv\Scripts\python.exe
   ```

2. **Get the absolute path** to your ARCE directory:
   ```powershell
   # Windows PowerShell
   (Get-Location).Path
   ```

3. **Open Bob IDE Settings**:
   - Click the gear icon (⚙️) in the bottom left
   - Select "Settings"
   - Search for "MCP" or navigate to Extensions → MCP

4. **Edit MCP Configuration**:
   - Click "Edit in settings.json" or find the MCP configuration section
   - Add the configuration from `mcp-config-template.json`

## Configuration Template

Copy the content from `mcp-config-template.json` and replace the placeholder:

```json
{
  "mcpServers": {
    "arce-tools": {
      "command": "REPLACE_WITH_YOUR_PYTHON_PATH",
      "args": ["arce/run_mcp_server.py"],
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

## Example Configurations

### Windows with Virtual Environment

```json
{
  "mcpServers": {
    "arce-tools": {
      "command": "d:/Projects/ARCE/venv/Scripts/python.exe",
      "args": ["arce/run_mcp_server.py"],
      "alwaysAllow": [
        "check_reachability",
        "run_tests",
        "generate_audit_trail",
        "create_governed_pr"
      ]
    }
  }
}
```

### Windows with System Python

```json
{
  "mcpServers": {
    "arce-tools": {
      "command": "C:/Users/YourUsername/AppData/Local/Programs/Python/Python312/python.exe",
      "args": ["arce/run_mcp_server.py"],
      "alwaysAllow": [
        "check_reachability",
        "run_tests",
        "generate_audit_trail",
        "create_governed_pr"
      ]
    }
  }
}
```

## Configuration Options Explained

### `command`
The full path to your Python executable. Must be the Python installation where fastmcp is installed.

**How to find it:**
```powershell
# If using virtual environment (recommended):
.\venv\Scripts\python.exe

# If using system Python:
(Get-Command python).Source
```

### `args`
The arguments passed to the Python command. This should always be `["arce/run_mcp_server.py"]` to run the wrapper script that launches the MCP server with stderr suppression.

### `alwaysAllow`
List of MCP tools that Bob IDE can use without asking for permission each time. The ARCE tools are:

- **`check_reachability`**: Analyzes if a vulnerable package is actually used in the code
- **`run_tests`**: Executes pytest tests and returns results
- **`generate_audit_trail`**: Creates a compliance-ready audit document
- **`create_governed_pr`**: Creates a GitHub Pull Request with audit evidence

## Verifying the Configuration

### Step 1: Check MCP Server Status

1. Open Bob IDE
2. Look for the MCP icon in the status bar (bottom right)
3. Click it to see connected servers
4. You should see:
   - ✅ `arce-tools` (green checkmark)
   - ✅ `playwright` (green checkmark)

### Step 2: Test the Connection

In Bob IDE, try this prompt:
```
Use the check_reachability tool to analyze the demo-app directory for the yaml package.
```

If configured correctly, Bob will execute the tool and return results.

### Step 3: Check Server Logs

If there are issues, check the MCP server logs:
1. In Bob IDE, open the Output panel (View → Output)
2. Select "MCP: arce-tools" from the dropdown
3. Look for error messages

## Common Issues and Solutions

### Issue: "Command not found" or "Python not recognized"

**Solution:** Use the full absolute path to python.exe, not just "python"

```json
// ❌ Wrong
"command": "python"

// ✅ Correct
"command": "d:/Projects/ARCE/venv/Scripts/python.exe"
```

### Issue: "Module 'fastmcp' not found"

**Solution:** The Python path points to a Python installation without fastmcp. Use the virtual environment Python:

```powershell
# Install dependencies in the venv
.\venv\Scripts\Activate.ps1
pip install fastmcp pytest pip-audit flask pyyaml
```

Then use `.\venv\Scripts\python.exe` as the command.

### Issue: "Cannot find arce/run_mcp_server.py"

**Solution:** The MCP server runs from the ARCE root directory. Make sure:
1. Bob IDE's workspace is set to the ARCE directory
2. The `args` path is relative: `["arce/run_mcp_server.py"]`

### Issue: MCP server shows red X or disconnected

**Solution:** 
1. Check the Output panel for error messages
2. Verify Python path is correct
3. Test the server manually:
   ```powershell
   .\venv\Scripts\python.exe arce/run_mcp_server.py
   ```
4. If it runs without errors, the configuration is correct
5. Note: You won't see any red error indicators with the wrapper script

### Issue: "Permission denied" when running tools

**Solution:** Add the tool names to the `alwaysAllow` array in the configuration.

## Advanced Configuration

### Custom Working Directory

If you need to run the MCP server from a different directory:

```json
{
  "mcpServers": {
    "arce-tools": {
      "command": "d:/Projects/ARCE/venv/Scripts/python.exe",
      "args": ["arce/run_mcp_server.py"],
      "cwd": "d:/Projects/ARCE",
      "alwaysAllow": ["check_reachability", "run_tests", "generate_audit_trail", "create_governed_pr"]
    }
  }
}
```

### Environment Variables

To pass environment variables to the MCP server:

```json
{
  "mcpServers": {
    "arce-tools": {
      "command": "d:/Projects/ARCE/venv/Scripts/python.exe",
      "args": ["arce/run_mcp_server.py"],
      "env": {
        "PYTHONPATH": "d:/Projects/ARCE",
        "DEBUG": "true"
      },
      "alwaysAllow": ["check_reachability", "run_tests", "generate_audit_trail", "create_governed_pr"]
    }
  }
}
```

## Playwright MCP Server

The Playwright server is simpler to configure as it uses npx:

```json
{
  "mcpServers": {
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

**Prerequisites:**
- Node.js 18+ installed
- npx available in PATH

**Test it:**
```powershell
npx -y @playwright/mcp@latest --version
```

## Troubleshooting Checklist

- [ ] Python 3.8+ is installed
- [ ] Virtual environment is created and activated
- [ ] All dependencies are installed (fastmcp, pytest, etc.)
- [ ] Python path in config is absolute and correct
- [ ] Bob IDE workspace is set to ARCE directory
- [ ] MCP servers show green checkmarks in Bob IDE
- [ ] No errors in MCP output logs

## Getting Help

If you're still having issues:

1. Check the [MCP Server Troubleshooting Guide](Project-context/MCP-Server-Troubleshooting.md)
2. Review the [README.md](README.md) setup instructions
3. Test the MCP server manually to isolate the issue
4. Check Bob IDE's MCP output logs for specific error messages

## Next Steps

Once configured:
1. Switch to "ARCE Compliance Remediator" mode in Bob IDE
2. Run a vulnerability scan with pip-audit
3. Paste the results and let ARCE autonomously remediate!

---

**Last Updated:** 2026-05-15  
**ARCE Version:** 1.0  
**Compatible with:** Bob IDE with MCP support