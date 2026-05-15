#!/usr/bin/env python3
"""
ARCE MCP Server Wrapper - Suppresses stderr to eliminate red error indicators in Bob IDE

This wrapper redirects stderr to devnull before importing and running the MCP server.
FastMCP writes informational messages (banner, version warnings) to stderr, which Bob IDE
interprets as errors and displays with red indicators. By suppressing stderr, we eliminate
these false error indicators while keeping stdout intact for MCP protocol communication.
"""
import sys
import os

# Redirect stderr to devnull BEFORE importing anything else
# This suppresses FastMCP's banner and version warnings
sys.stderr = open(os.devnull, 'w')

# Now import and run the actual MCP server
from mcp_server import mcp

if __name__ == "__main__":
    try:
        mcp.run()
    except Exception as e:
        # Even though stderr is suppressed, we should handle errors gracefully
        # In case of critical errors, they would still be visible through MCP protocol failures
        sys.exit(1)

# Made with Bob
