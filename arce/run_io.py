"""
Run record I/O module for ARCE pipeline.

This module handles all read/write operations for run records.
Each run is stored as a JSON file at runs/<run_id>/run.json.
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any, List


RUNS_DIR = Path("runs")


def _get_run_dir(run_id: str) -> Path:
    """Get the directory path for a specific run."""
    return RUNS_DIR / run_id


def _get_run_file(run_id: str) -> Path:
    """Get the run.json file path for a specific run."""
    return _get_run_dir(run_id) / "run.json"


def start_run(cve_id: str, package_name: str = "", version_before: str = "", 
              cvss_before: float = 0.0) -> str:
    """
    Initialize a new run record.
    
    Args:
        cve_id: CVE identifier (e.g., CVE-2020-14343)
        package_name: Name of the vulnerable package
        version_before: Vulnerable version
        cvss_before: CVSS score before remediation
        
    Returns:
        run_id: Unique identifier for this run (YYYYMMDD-HHMMSS-<cve_id>)
    """
    # Generate run_id with timestamp
    timestamp = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    run_id = f"{timestamp}-{cve_id}"
    
    # Create run directory
    run_dir = _get_run_dir(run_id)
    run_dir.mkdir(parents=True, exist_ok=True)
    
    # Initialize run record
    run_record = {
        "run_id": run_id,
        "cve_id": cve_id,
        "package": {
            "name": package_name,
            "version_before": version_before,
            "version_after": None
        },
        "reachability": None,
        "cvss_before": cvss_before,
        "cvss_after": 0.0,
        "started_at": datetime.utcnow().isoformat() + "Z",
        "ended_at": None,
        "mttr_seconds": None,
        "status": "running",
        "self_correction_attempts": 0,
        "tests": {
            "before": None,
            "after": None
        },
        "policy_verdict": None,
        "pr_url": None,
        "sbom_path": None,
        "audit_path": None
    }
    
    # Write to disk
    run_file = _get_run_file(run_id)
    with open(run_file, 'w', encoding='utf-8') as f:
        json.dump(run_record, f, indent=2)
    
    return run_id


def update_run(run_id: str, **fields) -> None:
    """
    Update specific fields in a run record.
    
    Args:
        run_id: The run identifier
        **fields: Key-value pairs to update in the run record
    """
    run_file = _get_run_file(run_id)
    
    if not run_file.exists():
        raise FileNotFoundError(f"Run record not found: {run_id}")
    
    # Read current record
    with open(run_file, 'r', encoding='utf-8') as f:
        run_record = json.load(f)
    
    # Update fields
    for key, value in fields.items():
        if key == "tests":
            # Special handling for tests to preserve structure
            if "tests" not in run_record:
                run_record["tests"] = {"before": None, "after": None}
            if isinstance(value, dict):
                run_record["tests"].update(value)
        elif key == "package":
            # Special handling for package to preserve structure
            if "package" not in run_record:
                run_record["package"] = {"name": "", "version_before": None, "version_after": None}
            if isinstance(value, dict):
                run_record["package"].update(value)
        else:
            run_record[key] = value
    
    # Write back to disk
    with open(run_file, 'w', encoding='utf-8') as f:
        json.dump(run_record, f, indent=2)


def finalize_run(run_id: str, status: str) -> None:
    """
    Finalize a run by setting end time, status, and computing MTTR.
    
    Args:
        run_id: The run identifier
        status: Final status (succeeded, halted, or failed)
    """
    run_file = _get_run_file(run_id)
    
    if not run_file.exists():
        raise FileNotFoundError(f"Run record not found: {run_id}")
    
    # Read current record
    with open(run_file, 'r', encoding='utf-8') as f:
        run_record = json.load(f)
    
    # Set end time and status
    ended_at = datetime.utcnow().isoformat() + "Z"
    run_record["ended_at"] = ended_at
    run_record["status"] = status
    
    # Compute MTTR
    if run_record.get("started_at"):
        started = datetime.fromisoformat(run_record["started_at"].replace("Z", "+00:00"))
        ended = datetime.fromisoformat(ended_at.replace("Z", "+00:00"))
        mttr_seconds = (ended - started).total_seconds()
        run_record["mttr_seconds"] = mttr_seconds
    
    # Write back to disk
    with open(run_file, 'w', encoding='utf-8') as f:
        json.dump(run_record, f, indent=2)


def read_run(run_id: str) -> Dict[str, Any]:
    """
    Read a run record from disk.
    
    Args:
        run_id: The run identifier
        
    Returns:
        The run record as a dictionary
    """
    run_file = _get_run_file(run_id)
    
    if not run_file.exists():
        raise FileNotFoundError(f"Run record not found: {run_id}")
    
    with open(run_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def list_runs() -> List[Dict[str, Any]]:
    """
    List all run records.
    
    Returns:
        List of run records sorted by started_at (newest first)
    """
    if not RUNS_DIR.exists():
        return []
    
    runs = []
    for run_dir in RUNS_DIR.iterdir():
        if run_dir.is_dir():
            run_file = run_dir / "run.json"
            if run_file.exists():
                try:
                    with open(run_file, 'r', encoding='utf-8') as f:
                        runs.append(json.load(f))
                except (json.JSONDecodeError, IOError):
                    # Skip corrupted files
                    continue
    
    # Sort by started_at, newest first
    runs.sort(key=lambda r: r.get("started_at", ""), reverse=True)
    return runs


def compute_metrics(run_record: Dict[str, Any]) -> Dict[str, Any]:
    """
    Compute derived metrics from a run record.
    
    Args:
        run_record: The run record dictionary
        
    Returns:
        Dictionary with computed metrics
    """
    metrics = {
        "mttr_seconds": run_record.get("mttr_seconds"),
        "mttr_human": None,
        "cvss_delta": None,
        "self_correction_attempts": run_record.get("self_correction_attempts", 0)
    }
    
    # Format MTTR as human-readable
    if metrics["mttr_seconds"] is not None:
        seconds = int(metrics["mttr_seconds"])
        minutes = seconds // 60
        remaining_seconds = seconds % 60
        metrics["mttr_human"] = f"{minutes}m {remaining_seconds}s"
    
    # Compute CVSS delta
    cvss_before = run_record.get("cvss_before")
    cvss_after = run_record.get("cvss_after", 0.0)
    if cvss_before is not None:
        metrics["cvss_delta"] = cvss_before - cvss_after
    
    return metrics

# Made with Bob
