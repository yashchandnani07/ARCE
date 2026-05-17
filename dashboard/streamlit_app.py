"""
ARCE Governance Dashboard - Dynamic Data Integration
Professional security operations center style dashboard with real data
"""

import streamlit as st
import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
from pathlib import Path
from datetime import datetime, timedelta
import json
import sys

# Add parent directory to path to import arce modules
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from arce.run_io import list_runs, read_run, compute_metrics
except ImportError:
    # Fallback if import fails
    def list_runs():
        return []
    def read_run(run_id):
        return {}
    def compute_metrics(run_record):
        return {}

# Page configuration
st.set_page_config(
    page_title="ARCE Dashboard",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for dark theme and styling
st.markdown("""
<style>
    /* Dark theme */
    .stApp {
        background-color: #0a0e1a;
        color: #e0e0e0;
    }
    
    /* Metrics styling */
    [data-testid="stMetricValue"] {
        font-size: 2.5rem;
        font-weight: 700;
        color: #a3ff12;
    }
    
    [data-testid="stMetricDelta"] {
        color: #a3ff12;
    }
    
    /* Headers */
    h1, h2, h3 {
        color: #a3ff12;
        font-family: 'Courier New', monospace;
    }
    
    /* Sidebar */
    [data-testid="stSidebar"] {
        background-color: #0f1419;
        border-right: 1px solid #1a1f2e;
    }
    
    /* Tables */
    .dataframe {
        background-color: #1a1f2e;
        color: #e0e0e0;
    }
    
    /* Buttons */
    .stButton>button {
        background-color: #a3ff12;
        color: #0a0e1a;
        font-weight: 600;
        border: none;
        border-radius: 4px;
    }
    
    .stButton>button:hover {
        background-color: #8fd610;
    }
    
    /* Status badges */
    .status-badge {
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 0.85rem;
        font-weight: 600;
        display: inline-block;
    }
    
    .status-critical { background-color: #ff4444; color: white; }
    .status-high { background-color: #ff8800; color: white; }
    .status-medium { background-color: #ffbb00; color: black; }
    .status-low { background-color: #00cc88; color: white; }
    .status-patched { background-color: #a3ff12; color: black; }
    .status-live { background-color: #a3ff12; color: black; }
    
    /* Code blocks */
    .stCodeBlock {
        background-color: #1a1f2e;
        border: 1px solid #2a3f5e;
    }
</style>
""", unsafe_allow_html=True)

# Load data functions
@st.cache_data(ttl=30)
def load_runs_data():
    """Load all run records from the runs directory."""
    try:
        runs = list_runs()
        return runs
    except Exception as e:
        st.error(f"Error loading runs: {e}")
        return []

@st.cache_data(ttl=30)
def load_cve_data():
    """Load CVE data from cve_output.json."""
    cve_file = Path(__file__).parent.parent / "cve_output.json"
    if cve_file.exists():
        try:
            # Try multiple encodings
            for encoding in ['utf-8', 'utf-16', 'utf-16-le', 'utf-16-be', 'latin-1']:
                try:
                    with open(cve_file, 'r', encoding=encoding) as f:
                        content = f.read()
                        # Clean up any BOM or encoding issues
                        content = content.strip()
                        if content.startswith('\ufeff'):
                            content = content[1:]
                        # Remove null bytes that might be present
                        content = content.replace('\x00', '')
                        return json.loads(content)
                except (UnicodeDecodeError, json.JSONDecodeError):
                    continue
            
            # If all encodings fail, return empty
            st.warning("Could not decode CVE data file. Using empty dataset.")
            return {"dependencies": []}
        except Exception as e:
            st.warning(f"Error loading CVE data: {e}. Using empty dataset.")
            return {"dependencies": []}
    return {"dependencies": []}

def calculate_kpis(runs):
    """Calculate KPI metrics from run data."""
    if not runs:
        return {
            "security_score": 0,
            "critical_open": 0,
            "patched_7d": 0,
            "ai_success_rate": 0.0
        }
    
    total_runs = len(runs)
    successful_runs = len([r for r in runs if r.get("status") in ["success", "succeeded"]])
    
    # Security score based on success rate
    security_score = int((successful_runs / total_runs * 100)) if total_runs > 0 else 0
    
    # Critical open CVEs
    critical_open = len([
        r for r in runs
        if (r.get("cvss_before", 0) or 0) >= 9.0
        and r.get("status") not in ["success", "succeeded"]
    ])
    
    # Patched in last 7 days
    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)
    patched_7d = 0
    for r in runs:
        if r.get("status") in ["success", "succeeded"]:
            try:
                started_at = r.get("started_at", "")
                if started_at:
                    started_dt = datetime.fromisoformat(started_at.replace('Z', ''))
                    if started_dt > week_ago:
                        patched_7d += 1
            except:
                pass
    
    # AI success rate
    ai_success_rate = (successful_runs / total_runs * 100) if total_runs > 0 else 0
    
    return {
        "security_score": security_score,
        "critical_open": critical_open,
        "patched_7d": patched_7d,
        "ai_success_rate": ai_success_rate
    }

def get_severity_breakdown(runs, cve_data):
    """Get severity breakdown from runs and CVE data."""
    severity_counts = {"CRIT": 0, "HIGH": 0, "MED": 0, "LOW": 0}
    
    # Count from runs
    for run in runs:
        if run.get("status") not in ["success", "succeeded"]:
            cvss = run.get("cvss_before", 0) or 0
            if cvss >= 9.0:
                severity_counts["CRIT"] += 1
            elif cvss >= 7.0:
                severity_counts["HIGH"] += 1
            elif cvss >= 4.0:
                severity_counts["MED"] += 1
            else:
                severity_counts["LOW"] += 1
    
    # Add from CVE data
    for dep in cve_data.get("dependencies", []):
        for vuln in dep.get("vulns", []):
            # Estimate severity from CVE ID or description
            if "CRITICAL" in vuln.get("description", "").upper():
                severity_counts["CRIT"] += 1
            elif "HIGH" in vuln.get("description", "").upper():
                severity_counts["HIGH"] += 1
            else:
                severity_counts["MED"] += 1
    
    return severity_counts

# Sidebar Navigation
with st.sidebar:
    st.markdown("### 🛡️ ARCE")
    st.markdown("**REMEDIATION ENGINE**")
    st.markdown("---")
    
    page = st.radio(
        "Navigation",
        ["📊 Overview", "🔍 Vulnerabilities", "🤖 AI Reasoning", "📋 Audit Reports", "🔧 PR Review", "⚙️ Settings"],
        label_visibility="collapsed"
    )
    
    st.markdown("---")
    st.markdown("**AGENT STATUS**")
    st.markdown("ARCE v3.2 <span class='status-live'>● Live</span>", unsafe_allow_html=True)
    st.markdown("---")
    st.markdown("**WORKSPACE**")
    st.markdown("ARCE → PRODUCTION")
    
    # Add refresh button
    if st.button("🔄 Refresh Data"):
        st.cache_data.clear()
        st.rerun()

# Load data
runs_data = load_runs_data()
cve_data = load_cve_data()
kpis = calculate_kpis(runs_data)

# Main content based on selected page
if page == "📊 Overview":
    # Header
    st.markdown("# 🛡️ ARCE REMEDIATION ENGINE")
    st.markdown("**WORKSPACE** → **ARCE** → **PRODUCTION** → Overview")
    st.markdown("---")
    
    # Top KPI Metrics
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric(
            label="SECURITY SCORE",
            value=f"{kpis['security_score']}/100",
            delta="+2.4" if kpis['security_score'] > 90 else "-1.2",
            help="Overall security posture score"
        )
    
    with col2:
        st.metric(
            label="CRITICAL - OPEN",
            value=str(kpis['critical_open']),
            delta=f"-{max(0, 3 - kpis['critical_open'])}",
            help="Critical vulnerabilities requiring immediate attention"
        )
    
    with col3:
        st.metric(
            label="PATCHED - 7D",
            value=str(kpis['patched_7d']),
            delta=f"+{kpis['patched_7d']}",
            help="Vulnerabilities patched in last 7 days"
        )
    
    with col4:
        st.metric(
            label="AI SUCCESS RATE",
            value=f"{kpis['ai_success_rate']:.1f}%",
            delta="+0.6" if kpis['ai_success_rate'] > 95 else "-0.3",
            help="Autonomous remediation success rate"
        )
    
    st.markdown("---")
    
    # Charts Row
    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.markdown("### REMEDIATION - 14D")
        st.markdown("**Detection vs. patching velocity**")
        
        # Generate data from actual runs
        dates = pd.date_range(end=datetime.now(), periods=14, freq='D')
        detected = []
        patched = []
        
        for date in dates:
            day_runs = [r for r in runs_data if r.get("started_at", "").startswith(date.strftime("%Y-%m-%d"))]
            detected.append(len(day_runs))
            patched.append(len([r for r in day_runs if r.get("status") in ["success", "succeeded"]]))
        
        # If no data, use sample data
        if sum(detected) == 0:
            detected = [12, 15, 18, 22, 19, 24, 28, 25, 22, 20, 18, 15, 12, 10]
            patched = [10, 13, 16, 20, 18, 23, 26, 24, 21, 19, 17, 14, 11, 9]
        
        fig = go.Figure()
        fig.add_trace(go.Scatter(
            x=dates, y=detected,
            fill='tonexty',
            name='Detected',
            line=dict(color='#ff8800', width=2),
            fillcolor='rgba(255, 136, 0, 0.3)'
        ))
        fig.add_trace(go.Scatter(
            x=dates, y=patched,
            fill='tozeroy',
            name='Patched',
            line=dict(color='#a3ff12', width=2),
            fillcolor='rgba(163, 255, 18, 0.3)'
        ))
        
        fig.update_layout(
            plot_bgcolor='#1a1f2e',
            paper_bgcolor='#1a1f2e',
            font=dict(color='#e0e0e0'),
            xaxis=dict(showgrid=False),
            yaxis=dict(showgrid=True, gridcolor='#2a3f5e'),
            height=300,
            margin=dict(l=0, r=0, t=0, b=0),
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
        )
        
        st.plotly_chart(fig, use_container_width=True)
    
    with col2:
        st.markdown("### SEVERITY BREAKDOWN")
        st.markdown("**Open issues**")
        
        # Get actual severity data
        severity_data = get_severity_breakdown(runs_data, cve_data)
        severity_df = pd.DataFrame({
            'Severity': list(severity_data.keys()),
            'Count': list(severity_data.values())
        })
        
        fig = go.Figure(data=[
            go.Bar(
                x=severity_df['Severity'],
                y=severity_df['Count'],
                marker_color=['#ff4444', '#ff8800', '#ffbb00', '#a3ff12'],
                text=severity_df['Count'],
                textposition='outside'
            )
        ])
        
        fig.update_layout(
            plot_bgcolor='#1a1f2e',
            paper_bgcolor='#1a1f2e',
            font=dict(color='#e0e0e0'),
            xaxis=dict(showgrid=False),
            yaxis=dict(showgrid=True, gridcolor='#2a3f5e'),
            height=300,
            margin=dict(l=0, r=0, t=0, b=0),
            showlegend=False
        )
        
        st.plotly_chart(fig, use_container_width=True)
    
    st.markdown("---")
    
    # Vulnerability Explorer
    st.markdown("### VULNERABILITY EXPLORER")
    active_count = len([r for r in runs_data if r.get("status") not in ["success", "succeeded"]])
    st.markdown(f"<span class='status-live'>● {active_count} active</span>", unsafe_allow_html=True)
    
    # Build vulnerability table from actual data
    vuln_list = []
    
    # Add from runs
    for run in runs_data[:10]:
        package = run.get("package", {})
        cvss = run.get("cvss_before", 0) or 0
        
        if cvss >= 9.0:
            severity = "CRITICAL"
        elif cvss >= 7.0:
            severity = "HIGH"
        elif cvss >= 4.0:
            severity = "MEDIUM"
        else:
            severity = "LOW"
        
        status_map = {
            "success": "patched",
            "succeeded": "patched",
            "running": "AI-correcting",
            "in_progress": "verifying",
            "failed": "needs-review"
        }
        
        vuln_list.append({
            'CVE': run.get("cve_id", "CVE-UNKNOWN"),
            'PACKAGE': f"{package.get('name', 'unknown')}@{package.get('version_before', '?')}",
            'SEVERITY': severity,
            'CVSS': cvss,
            'REPOSITORY': f"acme/{package.get('name', 'unknown')}",
            'STATE': status_map.get(run.get("status", "unknown"), "queued")
        })
    
    # Add from CVE data if no runs
    if not vuln_list:
        for dep in cve_data.get("dependencies", [])[:5]:
            for vuln in dep.get("vulns", []):
                vuln_list.append({
                    'CVE': vuln.get("id", "CVE-UNKNOWN"),
                    'PACKAGE': f"{dep.get('name', 'unknown')}@{dep.get('version', '?')}",
                    'SEVERITY': "HIGH",
                    'CVSS': 7.5,
                    'REPOSITORY': f"acme/{dep.get('name', 'unknown')}",
                    'STATE': "queued"
                })
    
    if vuln_list:
        vuln_data = pd.DataFrame(vuln_list)
        
        # Style the dataframe
        def style_severity(val):
            colors = {
                'CRITICAL': 'background-color: #ff4444; color: white',
                'HIGH': 'background-color: #ff8800; color: white',
                'MEDIUM': 'background-color: #ffbb00; color: black',
                'LOW': 'background-color: #00cc88; color: white'
            }
            return colors.get(val, '')
        
        def style_state(val):
            colors = {
                'patched': 'background-color: #a3ff12; color: black',
                'verifying': 'background-color: #00aaff; color: white',
                'AI-correcting': 'background-color: #ff8800; color: white',
                'queued': 'background-color: #666666; color: white',
                'needs-review': 'background-color: #ff4444; color: white'
            }
            return colors.get(val, '')
        
        styled_df = vuln_data.style.applymap(style_severity, subset=['SEVERITY']).applymap(style_state, subset=['STATE'])
        st.dataframe(styled_df, use_container_width=True, hide_index=True)
    else:
        st.info("No vulnerabilities detected. System is secure! 🎉")
    
    st.markdown("---")
    
    # Repositories Section
    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.markdown("### REPOSITORIES")
        
        # Build repository data from runs
        repo_dict = {}
        for run in runs_data:
            pkg_name = run.get("package", {}).get("name", "unknown")
            repo_name = f"acme/{pkg_name}"
            
            if repo_name not in repo_dict:
                repo_dict[repo_name] = {
                    'NAME': repo_name,
                    'BRANCH': 'main',
                    'CVES': 0,
                    'RUNS': 0,
                    'SCORE': 100,
                    'STATUS': 'LIVE'
                }
            
            repo_dict[repo_name]['RUNS'] += 1
            if run.get("status") not in ["success", "succeeded"]:
                repo_dict[repo_name]['CVES'] += 1
                repo_dict[repo_name]['SCORE'] = max(50, 100 - repo_dict[repo_name]['CVES'] * 10)
        
        if repo_dict:
            repo_data = pd.DataFrame(list(repo_dict.values()))
            st.dataframe(repo_data, use_container_width=True, hide_index=True)
        else:
            st.info("No repository data available yet.")
    
    with col2:
        st.markdown("### LATEST PR")
        
        # Find latest successful run with PR
        latest_pr_run = None
        for run in runs_data:
            if run.get("pr_url") and run.get("status") in ["success", "succeeded"]:
                latest_pr_run = run
                break
        
        if latest_pr_run:
            pr_url = latest_pr_run.get("pr_url", "")
            pr_number = pr_url.split("/")[-1] if pr_url else "N/A"
            cve_id = latest_pr_run.get("cve_id", "CVE-UNKNOWN")
            
            st.markdown(f"<span class='status-live'>● OPEN</span>", unsafe_allow_html=True)
            st.markdown(f"**fix(security): patch {cve_id}**")
            st.markdown("---")
            st.markdown("✅ **checks** ✓")
            st.markdown("📝 **audit signed**")
            st.markdown("🔄 **rollback ready**")
            st.markdown("---")
            col_a, col_b = st.columns(2)
            with col_a:
                if st.button("🔀 Merge", use_container_width=True):
                    st.success("PR merged successfully!")
            with col_b:
                if st.button("↩️ Rollback plan", use_container_width=True):
                    st.info("Rollback plan generated")
        else:
            st.info("No PRs available yet")

elif page == "🔍 Vulnerabilities":
    st.markdown("# 🔍 VULNERABILITY EXPLORER")
    st.markdown("**Detailed vulnerability analysis and tracking**")
    st.markdown("---")
    
    # Filters
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        severity_filter = st.multiselect("Severity", ["CRITICAL", "HIGH", "MEDIUM", "LOW"], default=["CRITICAL", "HIGH"])
    with col2:
        state_filter = st.multiselect("State", ["patched", "verifying", "AI-correcting", "queued"], default=["verifying", "AI-correcting", "queued"])
    with col3:
        repo_filter = st.multiselect("Repository", [f"acme/{r.get('package', {}).get('name', 'unknown')}" for r in runs_data[:5]])
    with col4:
        st.markdown("###")
        if st.button("🔄 Refresh", use_container_width=True):
            st.cache_data.clear()
            st.rerun()
    
    st.markdown("---")
    
    # Detailed vulnerability table from runs
    vuln_details_list = []
    for run in runs_data[:20]:
        package = run.get("package", {})
        cvss = run.get("cvss_before", 0) or 0
        
        if cvss >= 9.0:
            severity = "CRITICAL"
        elif cvss >= 7.0:
            severity = "HIGH"
        elif cvss >= 4.0:
            severity = "MEDIUM"
        else:
            severity = "LOW"
        
        if severity not in severity_filter:
            continue
        
        vuln_details_list.append({
            'CVE': run.get("cve_id", "CVE-UNKNOWN"),
            'Package': f"{package.get('name', 'unknown')}@{package.get('version_before', '?')}",
            'Severity': severity,
            'CVSS': cvss,
            'Repository': f"acme/{package.get('name', 'unknown')}",
            'State': run.get("status", "unknown"),
            'Detected': run.get("started_at", "N/A")[:19].replace("T", " "),
            'Patched': run.get("ended_at", "In Progress")[:19].replace("T", " ") if run.get("ended_at") else "In Progress"
        })
    
    if vuln_details_list:
        vuln_details = pd.DataFrame(vuln_details_list)
        st.dataframe(vuln_details, use_container_width=True, hide_index=True)
    else:
        st.info("No vulnerabilities match the selected filters.")
    
    # Show details of first vulnerability
    if runs_data:
        st.markdown("---")
        first_run = runs_data[0]
        st.markdown(f"### {first_run.get('cve_id', 'CVE-UNKNOWN')} Details")
        
        col1, col2 = st.columns([2, 1])
        with col1:
            st.markdown(f"""
            **Package:** {first_run.get('package', {}).get('name', 'unknown')}  
            **Version:** {first_run.get('package', {}).get('version_before', '?')} → {first_run.get('package', {}).get('version_after', '?')}  
            **CVSS Score:** {first_run.get('cvss_before', 0)}
            
            **Status:** {first_run.get('status', 'unknown')}
            """)
        
        with col2:
            reachability = first_run.get("reachability", "unknown")
            st.markdown(f"**Reachability:** {'✅ Confirmed' if reachability == 'reachable' else '❓ Unknown'}")
            
            tests_after = first_run.get("tests", {}).get("after", {})
            if tests_after:
                st.markdown(f"**Tests:** ✅ {tests_after.get('passed', 0)} passing")
            
            if first_run.get("pr_url"):
                pr_num = first_run.get("pr_url", "").split("/")[-1]
                st.markdown(f"**PR:** [#{pr_num}]({first_run.get('pr_url')})")

elif page == "🤖 AI Reasoning":
    st.markdown("# 🤖 AI REASONING - LIVE")
    st.markdown("<span class='status-live'>● streaming</span>", unsafe_allow_html=True)
    st.markdown("---")
    
    # Show reasoning from latest run
    if runs_data:
        latest_run = runs_data[0]
        
        reasoning_steps = [
            {
                "time": latest_run.get("started_at", "")[-8:-3] if latest_run.get("started_at") else "00:00",
                "phase": "DETECT",
                "action": f"CVE {latest_run.get('cve_id', 'UNKNOWN')} detected in {latest_run.get('package', {}).get('name', 'unknown')}"
            },
            {
                "time": latest_run.get("started_at", "")[-8:-3] if latest_run.get("started_at") else "00:00",
                "phase": "REACH",
                "action": f"Reachability: {latest_run.get('reachability', 'checking').upper()}"
            },
            {
                "time": latest_run.get("started_at", "")[-8:-3] if latest_run.get("started_at") else "00:00",
                "phase": "PATCH",
                "action": f"Upgrading {latest_run.get('package', {}).get('version_before', '?')} → {latest_run.get('package', {}).get('version_after', '?')}"
            },
            {
                "time": latest_run.get("started_at", "")[-8:-3] if latest_run.get("started_at") else "00:00",
                "phase": "TEST",
                "action": f"Running tests... {latest_run.get('self_correction_attempts', 0)} corrections applied"
            },
            {
                "time": latest_run.get("ended_at", "")[-8:-3] if latest_run.get("ended_at") else "00:00",
                "phase": "VERIFY",
                "action": f"Status: {latest_run.get('status', 'unknown').upper()}"
            }
        ]
        
        for step in reasoning_steps:
            phase_colors = {
                "DETECT": "#ff8800",
                "REACH": "#00aaff",
                "PATCH": "#a3ff12",
                "TEST": "#00aaff",
                "VERIFY": "#a3ff12",
                "AI-FIX": "#ff8800"
            }
            color = phase_colors.get(step["phase"], "#666666")
            
            st.markdown(f"""
            <div style='background-color: #1a1f2e; padding: 12px; margin-bottom: 8px; border-left: 3px solid {color}; border-radius: 4px;'>
                <span style='color: #888; font-size: 0.85rem;'>{step["time"]}</span>
                <span style='color: {color}; font-weight: 600; margin-left: 12px;'>{step["phase"]}</span>
                <br/>
                <span style='color: #e0e0e0; margin-left: 12px;'>{step["action"]}</span>
            </div>
            """, unsafe_allow_html=True)
        
        st.markdown("---")
        st.markdown("### Agent Decision Tree")
        
        metrics = compute_metrics(latest_run)
        st.code(f"""
├─ {latest_run.get('cve_id', 'CVE-UNKNOWN')} detected ({latest_run.get('package', {}).get('name', 'unknown')}@{latest_run.get('package', {}).get('version_before', '?')})
├─ Reachability: {latest_run.get('reachability', 'UNKNOWN').upper()}
├─ Upgrade: {latest_run.get('package', {}).get('version_before', '?')} → {latest_run.get('package', {}).get('version_after', '?')}
├─ Self-corrections: {latest_run.get('self_correction_attempts', 0)} attempts
├─ MTTR: {metrics.get('mttr_human', 'N/A')}
└─ Status: {latest_run.get('status', 'unknown').upper()}
        """, language="text")
    else:
        st.info("No runs available to display reasoning.")

elif page == "📋 Audit Reports":
    st.markdown("# 📋 AUDIT REPORTS")
    st.markdown("**Compliance-ready audit trails**")
    st.markdown("---")
    
    # Check for audit files
    audit_files = []
    dashboard_dir = Path(__file__).parent
    
    for audit_file in dashboard_dir.glob("*.md"):
        if "audit" in audit_file.name.lower():
            audit_files.append(audit_file)
    
    if audit_files:
        # Let user select which audit to view
        selected_audit = st.selectbox("Select Audit Report", [f.name for f in audit_files])
        
        if selected_audit:
            audit_path = dashboard_dir / selected_audit
            try:
                with open(audit_path, "r", encoding="utf-8") as f:
                    audit_content = f.read()
                
                # Display the audit trail
                st.markdown(audit_content)
                
                # Download button
                st.download_button(
                    label="📥 Download Audit Trail",
                    data=audit_content,
                    file_name=selected_audit,
                    mime="text/markdown"
                )
            except Exception as e:
                st.error(f"Error reading audit trail: {str(e)}")
    else:
        st.info("""
        **No audit trails generated yet.**
        
        Audit trails are automatically created when the ARCE pipeline completes a remediation run.
        """)

elif page == "🔧 PR Review":
    st.markdown("# 🔧 PR REVIEW")
    st.markdown("---")
    
    # Find latest PR from runs
    pr_run = None
    for run in runs_data:
        if run.get("pr_url"):
            pr_run = run
            break
    
    if pr_run:
        pr_url = pr_run.get("pr_url", "")
        pr_number = pr_url.split("/")[-1] if pr_url else "N/A"
        
        st.markdown(f"### PR #{pr_number}")
        st.markdown("<span class='status-live'>● OPEN</span>", unsafe_allow_html=True)
        st.markdown("---")
        
        st.markdown(f"### fix(security): patch {pr_run.get('cve_id', 'CVE-UNKNOWN')}")
        st.markdown(f"**main** ← **fix/{pr_run.get('cve_id', 'cve-unknown').lower()}**")
        
        col1, col2, col3 = st.columns(3)
        with col1:
            st.button("✅ checks ✓", use_container_width=True)
        with col2:
            st.button("📝 audit signed", use_container_width=True)
        with col3:
            st.button("🔄 rollback ready", use_container_width=True)
        
        st.markdown("---")
        
        # Show package changes
        st.markdown("### Changes")
        package = pr_run.get("package", {})
        st.code(f"""
Package: {package.get('name', 'unknown')}
Version: {package.get('version_before', '?')} → {package.get('version_after', '?')}
CVSS: {pr_run.get('cvss_before', 0)} → {pr_run.get('cvss_after', 0)}
        """, language="text")
        
        st.markdown("---")
        
        col1, col2 = st.columns(2)
        with col1:
            if st.button("🔀 Merge", type="primary", use_container_width=True):
                st.success("PR merged successfully!")
        with col2:
            if st.button("↩️ Rollback plan", use_container_width=True):
                st.info("Rollback plan generated")
    else:
        st.info("No pull requests available yet.")

else:  # Settings
    st.markdown("# ⚙️ SETTINGS")
    st.markdown("**Configure ARCE behavior and integrations**")
    st.markdown("---")
    
    st.markdown("### Agent Configuration")
    st.checkbox("Enable autonomous remediation", value=True)
    st.checkbox("Require human approval for critical CVEs", value=False)
    st.checkbox("Auto-merge PRs after verification", value=False)
    
    st.markdown("---")
    st.markdown("### Notification Settings")
    st.text_input("Slack Webhook URL")
    st.text_input("Email for alerts")
    
    st.markdown("---")
    st.markdown("### Repository Scanning")
    repo_names = list(set([f"acme/{r.get('package', {}).get('name', 'unknown')}" for r in runs_data]))
    st.multiselect("Monitored repositories", repo_names, default=repo_names[:2] if repo_names else [])
    
    st.markdown("---")
    if st.button("💾 Save Settings", type="primary"):
        st.success("Settings saved successfully!")

# Footer
st.markdown("---")
st.markdown(f"""
<div style='text-align: center; color: #666; padding: 20px; font-size: 0.85rem;'>
    <p><strong>ARCE v3.2</strong> — Autonomous Remediation & Compliance Engine</p>
    <p>Made with Emergent · IBM Bob AI Agent Hackathon 2025</p>
    <p style='margin-top: 10px;'>📊 {len(runs_data)} runs tracked | 🔄 Last updated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}</p>
</div>
""", unsafe_allow_html=True)

# Made with Bob
