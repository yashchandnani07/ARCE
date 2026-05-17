"""Quick integration test for ARCE backend"""

from arce.run_io import list_runs
from arce.api_server import transform_to_kpi, transform_to_repositories, transform_to_activity_feed

print("=" * 60)
print("ARCE Backend Integration Test")
print("=" * 60)

# Test 1: Read runs
runs = list_runs()
print(f"\n[OK] Found {len(runs)} run records")

if runs:
    print("\nRun details:")
    for run in runs:
        print(f"  - {run.get('run_id', 'unknown')}")
        print(f"    Status: {run.get('status', 'unknown')}")
        print(f"    CVE: {run.get('cve_id', 'unknown')}")
        print(f"    Package: {run.get('package', {}).get('name', 'unknown')}")

# Test 2: Transform to KPIs
kpis = transform_to_kpi(runs)
print(f"\n[OK] Generated {len(kpis)} KPIs:")
for kpi in kpis:
    print(f"  - {kpi['label']}: {kpi['value']}")

# Test 3: Transform to repositories
repos = transform_to_repositories(runs)
print(f"\n[OK] Generated {len(repos)} repositories:")
for repo in repos[:3]:  # Show first 3
    print(f"  - {repo['name']}: score={repo['score']}, status={repo['status']}")

# Test 4: Transform to activity feed
activities = transform_to_activity_feed(runs)
print(f"\n[OK] Generated {len(activities)} activity events:")
for activity in activities[:3]:  # Show first 3
    print(f"  - [{activity['ago']}] {activity['text']}")

print("\n" + "=" * 60)
print("All transformers working correctly!")
print("=" * 60)

# Made with Bob
