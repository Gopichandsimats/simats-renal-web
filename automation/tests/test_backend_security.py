import os
import sys
import re
import urllib.request
import json

def run_sast_scan(workspace_path):
    findings = []
    
    # SAST scanning patterns
    rules = [
        {
            "id": "SEC_SAST_001",
            "title": "Hardcoded Secret Keys in Environment Config",
            "pattern": r"(secret|key|password|token)\s*=\s*['\"][a-zA-Z0-9_\-]{8,}['\"]",
            "severity": "Medium",
            "cwe": "CWE-798",
            "owasp": "A07:2021-Identification and Authentication Failures"
        },
        {
            "id": "SEC_SAST_002",
            "title": "Dangerous CORS Configuration",
            "pattern": r"Access-Control-Allow-Origin.*[*]",
            "severity": "High",
            "cwe": "CWE-942",
            "owasp": "A05:2021-Security Misconfiguration"
        },
        {
            "id": "SEC_SAST_003",
            "title": "Unsafe Native Command Execution",
            "pattern": r"(exec|spawn)\s*\(",
            "severity": "Critical",
            "cwe": "CWE-78",
            "owasp": "A03:2021-Injection"
        }
    ]
    
    for root, dirs, files in os.walk(workspace_path):
        # Exclude node_modules, .git, and dist
        if any(ignored in root for ignored in ["node_modules", ".git", "dist", "automation"]):
            continue
            
        for file in files:
            if not file.endswith((".js", ".jsx", ".json", ".env")):
                continue
                
            filepath = os.path.join(root, file)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                    
                for rule in rules:
                    matches = re.finditer(rule["pattern"], content, re.IGNORECASE)
                    for match in matches:
                        line_no = content[:match.start()].count("\n") + 1
                        findings.append({
                            "id": rule["id"],
                            "severity": rule["severity"],
                            "title": rule["title"],
                            "cwe": rule["cwe"],
                            "owasp": rule["owasp"],
                            "file": os.path.relpath(filepath, workspace_path),
                            "line": line_no,
                            "evidence": match.group(0)
                        })
            except Exception:
                pass
                
    return findings

def run_dast_scan(url):
    findings = []
    
    # Check security headers
    try:
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req, timeout=5) as response:
            headers = response.info()
            
            # 1. CSP
            if "Content-Security-Policy" not in headers:
                findings.append({
                    "id": "SEC_DAST_001",
                    "severity": "Medium",
                    "title": "Missing Content Security Policy (CSP) Header",
                    "cwe": "CWE-1021",
                    "owasp": "A05:2021-Security Misconfiguration",
                    "evidence": "Header Content-Security-Policy was not returned."
                })
                
            # 2. X-Frame-Options (Clickjacking)
            if "X-Frame-Options" not in headers:
                findings.append({
                    "id": "SEC_DAST_002",
                    "severity": "Low",
                    "title": "Missing X-Frame-Options (Anti-Clickjacking) Header",
                    "cwe": "CWE-1021",
                    "owasp": "A05:2021-Security Misconfiguration",
                    "evidence": "Header X-Frame-Options was not returned."
                })
                
            # 3. CORS origin reflection
            if headers.get("Access-Control-Allow-Origin") == "*":
                findings.append({
                    "id": "SEC_DAST_003",
                    "severity": "Medium",
                    "title": "Reflection of Wildcard CORS Origin",
                    "cwe": "CWE-942",
                    "owasp": "A05:2021-Security Misconfiguration",
                    "evidence": "Access-Control-Allow-Origin is set to '*'"
                })
    except Exception as e:
        # If server is not running, log a configuration finding
        findings.append({
            "id": "SEC_DAST_004",
            "severity": "Low",
            "title": "API Server Offline during DAST check",
            "cwe": "CWE-1189",
            "owasp": "A05:2021-Security Misconfiguration",
            "evidence": str(e)
        })
        
    return findings

def run_audit(workspace):
    sast = run_sast_scan(workspace)
    dast = run_dast_scan("http://localhost:4000/api/health")
    
    all_findings = sast + dast
    return all_findings

if __name__ == "__main__":
    findings = run_audit(".")
    print(f"Backend audit completed. Found {len(findings)} issues.")
    for f in findings:
        print(f"[{f['severity']}] {f['title']} in {f.get('file', 'API Response')} (CWE: {f['cwe']})")
