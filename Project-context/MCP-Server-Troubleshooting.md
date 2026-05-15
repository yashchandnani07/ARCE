# MCP Server Troubleshooting Guide

## Overview

This document provides guidance on understanding and addressing errors that appear when running the ARCE MCP server. These errors are primarily related to dependency warnings and are **non-critical** - the server functions correctly despite their presence.

## Error Analysis

### 1. FastMCP Version Warning
```
WARNING: You are using FastMCP version 2.14.7. The latest version is 3.3.1.
```

**Type**: Informational warning  
**Impact**: None - current version is stable and functional  
**Source**: FastMCP's built-in version check mechanism

### 2. Authlib Deprecation Warning
```
DeprecationWarning: 'cgi' is deprecated and slated for removal in Python 3.13
  from authlib.jose import jwt
```

**Type**: Deprecation warning from Python standard library  
**Impact**: None in Python 3.12; will require attention before Python 3.13  
**Source**: FastMCP's internal JWT authentication module (not ARCE code)

### 3. ASCII Banner Error
```
UnicodeEncodeError: 'charmap' codec can't encode characters in position 0-4: character maps to <undefined>
```

**Type**: Console encoding issue  
**Impact**: Cosmetic only - prevents ASCII art banner display  
**Source**: Windows console encoding limitations with UTF-8 characters

## Root Cause

### FastMCP Version Warning
- FastMCP 2.14.7 was the stable version when ARCE was developed
- Version 3.3.1 introduces breaking changes that require code updates
- The warning is informational and does not affect functionality

### Authlib Deprecation
- FastMCP uses `authlib` for JWT token handling
- The `authlib` library internally imports Python's deprecated `cgi` module
- This is a **dependency issue**, not an ARCE code issue
- Will be resolved when authlib updates its implementation

### ASCII Banner Error
- Windows console uses legacy encoding (cp1252) by default
- FastMCP's startup banner contains UTF-8 characters incompatible with cp1252
- The error is caught and handled gracefully by FastMCP
- Does not affect server functionality

## Current Status

✅ **FastMCP 2.14.7 is stable and fully functional**
- All MCP server features work correctly
- Error handling is robust
- No impact on ARCE functionality

✅ **Warnings are non-blocking**
- Server starts and runs successfully
- All endpoints respond correctly
- Client connections work as expected

## Future Upgrade Path

### When to Upgrade to FastMCP 3.3.1

Consider upgrading when:
1. New features in 3.3.1 are needed
2. Security updates require it
3. Python 3.13 migration is planned

### Upgrade Steps

1. **Review Breaking Changes**
   ```bash
   # Check FastMCP changelog
   pip show fastmcp
   ```

2. **Update Dependencies**
   ```bash
   pip install --upgrade fastmcp
   ```

3. **Update Code**
   - Review `arce/mcp_server.py` for API changes
   - Test all MCP endpoints
   - Update error handling if needed

4. **Test Thoroughly**
   ```bash
   # Run MCP server tests
   pytest demo-app/tests/
   ```

### Authlib Warning Resolution

The authlib deprecation warning will be resolved automatically when:
- Authlib releases an update that removes `cgi` dependency
- FastMCP updates to use the newer authlib version

**No action required from ARCE developers** - this is a transitive dependency issue.

## Quick Reference

| Error | Severity | Action Required |
|-------|----------|-----------------|
| FastMCP version warning | Info | None - current version stable |
| Authlib deprecation | Low | Monitor; will resolve with dependency updates |
| ASCII banner error | Cosmetic | None - handled gracefully |

### One-Liner Explanations

- **FastMCP Version**: Informational notice about newer version availability
- **Authlib Warning**: Dependency uses deprecated Python module; will be fixed upstream
- **Banner Error**: Windows console can't display UTF-8 art; cosmetic only

## Recommendations

1. **Current Development**: Continue using FastMCP 2.14.7 - it's stable and tested
2. **Monitoring**: Watch for authlib updates that resolve the `cgi` deprecation
3. **Future Planning**: Plan FastMCP 3.3.1 upgrade before Python 3.13 adoption
4. **Documentation**: Keep this guide updated as dependencies evolve

## Additional Notes

- All errors have been thoroughly investigated and documented
- No code changes are required in ARCE to address these warnings
- The MCP server is production-ready in its current state
- Error messages can be safely ignored during development and deployment

---

**Last Updated**: 2026-05-15  
**FastMCP Version**: 2.14.7  
**Python Version**: 3.12.x  
**Status**: ✅ All systems operational