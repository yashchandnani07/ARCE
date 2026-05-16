"""
ARCE Policy Engine

Evaluates vulnerabilities against policy rules to determine remediation action.
"""

import yaml
from pathlib import Path
from typing import Dict, Any


def evaluate(
    severity: str,
    reachability: str,
    policy_path: str = "arce/policy/default_policy.yaml"
) -> Dict[str, Any]:
    """
    Evaluate a vulnerability against policy rules.
    
    Args:
        severity: Vulnerability severity (critical, high, medium, low, negligible)
        reachability: Reachability verdict (reachable, imported-but-unused, not-imported)
        policy_path: Path to policy YAML file
    
    Returns:
        Dictionary with 'action' and 'reason' keys
        action: One of 'auto_remediate', 'require_approval', 'skip'
        reason: Human-readable explanation
    """
    # Normalize inputs
    severity = severity.lower() if severity else "unknown"
    reachability = reachability.lower() if reachability else "unknown"
    
    # Handle unknown severity
    if severity not in ["critical", "high", "medium", "low", "negligible"]:
        return {
            "action": "require_approval",
            "reason": f"Unknown severity '{severity}' requires manual review"
        }
    
    # Load policy
    try:
        policy_file = Path(policy_path)
        if not policy_file.exists():
            return {
                "action": "require_approval",
                "reason": f"Policy file not found: {policy_path}"
            }
        
        with open(policy_file, 'r', encoding='utf-8') as f:
            policy = yaml.safe_load(f)
    except Exception as e:
        return {
            "action": "require_approval",
            "reason": f"Error loading policy: {str(e)}"
        }
    
    # Check auto_remediate rules
    auto_remediate = policy.get("auto_remediate", {})
    auto_severities = auto_remediate.get("severities", [])
    reachable_only = auto_remediate.get("reachable_only", True)
    
    if severity in auto_severities:
        if reachable_only:
            if reachability == "reachable":
                return {
                    "action": "auto_remediate",
                    "reason": f"{severity.capitalize()} severity vulnerability is reachable - auto-remediating per policy"
                }
        else:
            return {
                "action": "auto_remediate",
                "reason": f"{severity.capitalize()} severity vulnerability - auto-remediating per policy"
            }
    
    # Check skip rules
    skip = policy.get("skip", {})
    skip_severities = skip.get("severities", [])
    skip_conditions = skip.get("conditions", [])
    
    # Check if severity is in skip list
    if severity in skip_severities:
        return {
            "action": "skip",
            "reason": f"{severity.capitalize()} severity is below remediation threshold per policy"
        }
    
    # Check skip conditions
    for condition in skip_conditions:
        cond_severity = condition.get("severity", "")
        if isinstance(cond_severity, str):
            cond_severity = cond_severity.lower()
        
        cond_reachable = condition.get("reachable", "")
        if isinstance(cond_reachable, str):
            cond_reachable = cond_reachable.lower()
        
        # Match on severity and reachability
        if cond_severity and cond_reachable:
            if severity == cond_severity and reachability == cond_reachable:
                return {
                    "action": "skip",
                    "reason": f"{severity.capitalize()} severity with '{reachability}' reachability - skipping per policy"
                }
        # Match on reachability only
        elif cond_reachable and not cond_severity:
            if reachability == cond_reachable:
                return {
                    "action": "skip",
                    "reason": f"Vulnerability is '{reachability}' - skipping per policy"
                }
    
    # Check require_approval rules
    require_approval = policy.get("require_approval", {})
    approval_severities = require_approval.get("severities", [])
    approval_conditions = require_approval.get("conditions", [])
    
    # Check if severity requires approval
    if severity in approval_severities:
        # Check conditions for more specific rules
        for condition in approval_conditions:
            cond_severity = condition.get("severity", "").lower()
            cond_reachable = condition.get("reachable")
            
            if cond_severity == severity:
                if cond_reachable is not None:
                    cond_reachable_str = str(cond_reachable).lower()
                    if cond_reachable_str == "false" and reachability != "reachable":
                        return {
                            "action": "require_approval",
                            "reason": f"{severity.capitalize()} severity but not reachable - requires approval per policy"
                        }
                    elif cond_reachable_str == "true" and reachability == "reachable":
                        return {
                            "action": "require_approval",
                            "reason": f"{severity.capitalize()} severity and reachable - requires approval per policy"
                        }
        
        # Default approval reason for this severity
        return {
            "action": "require_approval",
            "reason": f"{severity.capitalize()} severity requires manual approval per policy"
        }
    
    # Default: require approval for anything not explicitly handled
    return {
        "action": "require_approval",
        "reason": f"{severity.capitalize()} severity with '{reachability}' reachability - requires manual review (no explicit policy match)"
    }


if __name__ == "__main__":
    """Sanity tests for policy engine"""
    print("Running policy engine sanity tests...")
    print("=" * 60)
    
    # Test 1: Critical + reachable = auto_remediate
    result = evaluate("critical", "reachable")
    assert result["action"] == "auto_remediate", f"Test 1 failed: {result}"
    print(f"[OK] Test 1 passed: critical+reachable -> {result['action']}")
    
    # Test 2: Medium + reachable = require_approval
    result = evaluate("medium", "reachable")
    assert result["action"] == "require_approval", f"Test 2 failed: {result}"
    print(f"[OK] Test 2 passed: medium+reachable -> {result['action']}")
    
    # Test 3: Low + not-imported = skip
    result = evaluate("low", "not-imported")
    assert result["action"] == "skip", f"Test 3 failed: {result}"
    print(f"[OK] Test 3 passed: low+not-imported -> {result['action']}")
    
    # Test 4: Unknown severity = require_approval
    result = evaluate("unknown-severity", "reachable")
    assert result["action"] == "require_approval", f"Test 4 failed: {result}"
    print(f"[OK] Test 4 passed: unknown severity -> {result['action']}")
    
    # Test 5: High + reachable = auto_remediate
    result = evaluate("high", "reachable")
    assert result["action"] == "auto_remediate", f"Test 5 failed: {result}"
    print(f"[OK] Test 5 passed: high+reachable -> {result['action']}")
    
    # Test 6: Medium + not-imported = skip
    result = evaluate("medium", "not-imported")
    assert result["action"] == "skip", f"Test 6 failed: {result}"
    print(f"[OK] Test 6 passed: medium+not-imported -> {result['action']}")
    
    print("=" * 60)
    print("All sanity tests passed!")

# Made with Bob
