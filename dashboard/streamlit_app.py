"""
ARCE Governance Dashboard - Enhanced SOC Interface
Professional security operations center style dashboard
"""

import streamlit as st
import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
from pathlib import Path
from datetime import datetime, timedelta
import json

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
            value="96/100",
            delta="+2.4",
            help="Overall security posture score"
        )
    
    with col2:
        st.metric(
            label="CRITICAL - OPEN",
            value="0",
            delta="-3",
            help="Critical vulnerabilities requiring immediate attention"
        )
    
    with col3:
        st.metric(
            label="PATCHED - 7D",
            value="312",
            delta="+18%",
            help="Vulnerabilities patched in last 7 days"
        )
    
    with col4:
        st.metric(
            label="AI SUCCESS RATE",
            value="98.4%",
            delta="+0.6",
            help="Autonomous remediation success rate"
        )
    
    st.markdown("---")
    
    # Charts Row
    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.markdown("### REMEDIATION - 14D")
        st.markdown("**Detection vs. patching velocity**")
        
        # Generate sample data for detection vs patching
        dates = pd.date_range(end=datetime.now(), periods=14, freq='D')
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
        
        # Severity data
        severity_data = pd.DataFrame({
            'Severity': ['CRIT', 'HIGH', 'MED', 'LOW'],
            'Count': [0, 3, 8, 12]
        })
        
        fig = go.Figure(data=[
            go.Bar(
                x=severity_data['Severity'],
                y=severity_data['Count'],
                marker_color=['#ff4444', '#ff8800', '#ffbb00', '#a3ff12'],
                text=severity_data['Count'],
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
    st.markdown("<span class='status-live'>● 5 active</span>", unsafe_allow_html=True)
    
    # Sample vulnerability data
    vuln_data = pd.DataFrame({
        'CVE': ['CVE-2025-31142', 'CVE-2025-30180', 'CVE-2025-29915', 'CVE-2025-28733', 'CVE-2025-28010'],
        'PACKAGE': ['lodash@4.17.20', 'axios@1.6.7', 'express@4.18.1', 'ws@8.11.0', 'yaml@2.2.1'],
        'SEVERITY': ['CRITICAL', 'HIGH', 'HIGH', 'MEDIUM', 'MEDIUM'],
        'CVSS': [9.8, 8.1, 7.6, 6.4, 5.9],
        'REPOSITORY': ['acme/payments', 'acme/checkout', 'acme/ledger', 'acme/ledger', 'acme/notifier'],
        'STATE': ['patched', 'verifying', 'AI-correcting', 'queued', 'queued']
    })
    
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
            'queued': 'background-color: #666666; color: white'
        }
        return colors.get(val, '')
    
    styled_df = vuln_data.style.applymap(style_severity, subset=['SEVERITY']).applymap(style_state, subset=['STATE'])
    st.dataframe(styled_df, use_container_width=True, hide_index=True)
    
    st.markdown("---")
    
    # Repositories Section
    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.markdown("### REPOSITORIES")
        
        repo_data = pd.DataFrame({
            'NAME': ['acme/payments', 'acme/checkout', 'acme/ledger', 'acme/orchestrator', 'acme/notifier'],
            'BRANCH': ['main', 'main', 'release', 'main', 'main'],
            'CVES': [0, 1, 2, 0, 1],
            'RUNS': [8, 5, 6, 12, 3],
            'SCORE': [98, 94, 91, 99, 92],
            'STATUS': ['LIVE', 'LIVE', 'LIVE', 'LIVE', 'PAUSED']
        })
        
        st.dataframe(repo_data, use_container_width=True, hide_index=True)
    
    with col2:
        st.markdown("### PR REVIEW - #4127")
        st.markdown("<span class='status-live'>● OPEN</span>", unsafe_allow_html=True)
        st.markdown("**fix(security): patch CVE-2025-31142 + self-corrected fixtures**")
        st.markdown("---")
        st.markdown("✅ **checks** ✓")
        st.markdown("📝 **audit signed**")
        st.markdown("🔄 **rollback ready**")
        st.markdown("---")
        col_a, col_b = st.columns(2)
        with col_a:
            st.button("🔀 Merge", use_container_width=True)
        with col_b:
            st.button("↩️ Rollback plan", use_container_width=True)

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
        repo_filter = st.multiselect("Repository", ["acme/payments", "acme/checkout", "acme/ledger", "acme/notifier"])
    with col4:
        st.markdown("###")
        if st.button("🔄 Refresh", use_container_width=True):
            st.rerun()
    
    st.markdown("---")
    
    # Detailed vulnerability table
    vuln_details = pd.DataFrame({
        'CVE': ['CVE-2025-31142', 'CVE-2025-30180', 'CVE-2025-29915'],
        'Package': ['lodash@4.17.20', 'axios@1.6.7', 'express@4.18.1'],
        'Severity': ['CRITICAL', 'HIGH', 'HIGH'],
        'CVSS': [9.8, 8.1, 7.6],
        'Repository': ['acme/payments', 'acme/checkout', 'acme/ledger'],
        'State': ['patched', 'verifying', 'AI-correcting'],
        'Detected': ['2025-01-15 12:15:48', '2025-01-15 12:15:50', '2025-01-15 12:15:51'],
        'Patched': ['2025-01-15 12:17:21', '2025-01-15 12:18:46', 'In Progress']
    })
    
    st.dataframe(vuln_details, use_container_width=True, hide_index=True)
    
    # Vulnerability details
    st.markdown("---")
    st.markdown("### CVE-2025-31142 Details")
    
    col1, col2 = st.columns([2, 1])
    with col1:
        st.markdown("""
        **Description:**  
        Prototype pollution vulnerability in lodash versions < 4.17.21 allows attackers to modify object prototypes.
        
        **Impact:**  
        Remote code execution, denial of service, or unauthorized access to sensitive data.
        
        **Fix:**  
        Upgrade to lodash >= 4.17.21
        """)
    
    with col2:
        st.markdown("**Reachability:** ✅ Confirmed")
        st.markdown("**Tests:** ✅ 642 passing")
        st.markdown("**E2E:** ✅ Verified")
        st.markdown("**PR:** [#4127](https://github.com)")

elif page == "🤖 AI Reasoning":
    st.markdown("# 🤖 AI REASONING - LIVE")
    st.markdown("<span class='status-live'>● streaming</span>", unsafe_allow_html=True)
    st.markdown("---")
    
    # Live reasoning stream
    reasoning_steps = [
        {
            "time": "12:15:48",
            "phase": "PATCH",
            "action": "Selecting safe upgrade lodash 4.17.20 → 4.17.21"
        },
        {
            "time": "12:15:46",
            "phase": "TEST",
            "action": "CI: 4 failing specs in /tests/auth & /tests/email"
        },
        {
            "time": "12:15:51",
            "phase": "AI-FIX",
            "action": "Rewriting interpolation tokens → regenerating jest fixtures"
        },
        {
            "time": "12:15:53",
            "phase": "VERIFY",
            "action": "642 passing · 0 failing · static-analysis clean"
        },
        {
            "time": "12:15:55",
            "phase": "GOVERN",
            "action": "Sealing audit · drafting PR #4127"
        },
        {
            "time": "12:15:56",
            "phase": "REACH",
            "action": "Traced '__template' through 7 call-sites · 2 reachable from req handler"
        }
    ]
    
    for step in reasoning_steps:
        phase_colors = {
            "PATCH": "#a3ff12",
            "TEST": "#00aaff",
            "AI-FIX": "#ff8800",
            "VERIFY": "#a3ff12",
            "GOVERN": "#a3ff12",
            "REACH": "#00aaff"
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
    st.code("""
    ├─ CVE-2025-31142 detected (lodash@4.17.20)
    ├─ Reachability: CONFIRMED (7 call sites)
    ├─ Upgrade: 4.17.20 → 4.17.21
    ├─ Tests: FAILED (4 specs)
    │  ├─ Root cause: API breaking change in template()
    │  └─ Fix: Regenerate fixtures with new API
    ├─ Tests: PASSED (642 specs)
    ├─ E2E: PASSED (Playwright verification)
    └─ PR: Created #4127 with audit trail
    """, language="text")

elif page == "📋 Audit Reports":
    st.markdown("# 📋 AUDIT REPORTS")
    st.markdown("**Compliance-ready audit trails**")
    st.markdown("---")
    
    # Check if audit.md exists
    audit_path = Path(__file__).parent / "audit.md"
    
    if audit_path.exists():
        try:
            with open(audit_path, "r", encoding="utf-8") as f:
                audit_content = f.read()
            
            # Display the audit trail
            st.markdown(audit_content)
            
            # Download button
            st.download_button(
                label="📥 Download Audit Trail",
                data=audit_content,
                file_name="arce_audit_trail.md",
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
    st.markdown("# 🔧 PR REVIEW - #4127")
    st.markdown("<span class='status-live'>● OPEN</span>", unsafe_allow_html=True)
    st.markdown("---")
    
    st.markdown("### fix(security): patch CVE-2025-31142 + self-corrected fixtures")
    st.markdown("**main** ← **fix/cve-2025-31142** · 319 commits")
    
    col1, col2, col3 = st.columns(3)
    with col1:
        st.button("✅ checks ✓", use_container_width=True)
    with col2:
        st.button("📝 audit signed", use_container_width=True)
    with col3:
        st.button("🔄 rollback ready", use_container_width=True)
    
    st.markdown("---")
    
    # Code diff
    st.markdown("### Changes")
    
    st.code("""
+ import _ from 'lodash';
+ import { template } from 'lodash';

// 7 call-sites updated - 3 fixtures regenerated
""", language="javascript")
    
    st.markdown("---")
    
    col1, col2 = st.columns(2)
    with col1:
        st.button("🔀 Merge", type="primary", use_container_width=True)
    with col2:
        st.button("↩️ Rollback plan", use_container_width=True)

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
    st.multiselect("Monitored repositories", ["acme/payments", "acme/checkout", "acme/ledger", "acme/orchestrator", "acme/notifier"], default=["acme/payments", "acme/checkout"])
    
    st.markdown("---")
    if st.button("💾 Save Settings", type="primary"):
        st.success("Settings saved successfully!")

# Footer
st.markdown("---")
st.markdown("""
<div style='text-align: center; color: #666; padding: 20px; font-size: 0.85rem;'>
    <p><strong>ARCE v3.2</strong> — Autonomous Remediation & Compliance Engine</p>
    <p>Made with Emergent · IBM Bob AI Agent Hackathon 2025</p>
</div>
""", unsafe_allow_html=True)

# Made with Bob
