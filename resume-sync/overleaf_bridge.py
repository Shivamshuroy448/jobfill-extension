#!/usr/bin/env python3
"""
ResumeSync AI — Overleaf Auto-Sync & Desktop Download Bridge
Listens on http://localhost:4567

Features:
- POST /sync: Injects LaTeX into Overleaf, recompiles, downloads compiled PDF to /Users/roy/Desktop/resumes/
- POST /download: Triggers download in Overleaf and saves to /Users/roy/Desktop/resumes/
- Background Watcher: Automatically detects any Overleaf PDF downloaded to ~/Downloads and moves it to Desktop/resumes/
"""

import http.server
import json
import os
import shutil
import subprocess
import threading
import time
from datetime import datetime

PORT = 4567
DOWNLOADS_DIR = os.path.expanduser("~/Downloads")
DESKTOP_RESUMES_DIR = os.path.expanduser("~/Desktop/resumes")

os.makedirs(DESKTOP_RESUMES_DIR, exist_ok=True)

def inject_latex_and_recompile(latex_code):
    """Inject LaTeX into Overleaf tab: activate Chrome, focus editor, select all, insertText, click Recompile"""
    import json as _json
    # 1. Put the entire LaTeX on macOS system clipboard
    proc = subprocess.Popen(["pbcopy"], stdin=subprocess.PIPE)
    proc.communicate(latex_code.encode("utf-8"))

    latex_escaped = _json.dumps(latex_code)

    inject_js = f"""(function() {{
  var cm = document.querySelector(".cm-content");
  if (!cm) return "NO_CM";
  cm.focus();
  document.execCommand("selectAll");
  var ok = document.execCommand("insertText", false, {latex_escaped});
  setTimeout(function() {{
    var btn = Array.from(document.querySelectorAll("button")).find(function(b) {{
      return b.innerText && b.innerText.includes("Recompile");
    }}) || document.querySelector("button.compile-button, .btn-recompile");
    if (btn) btn.click();
  }}, 400);
  return ok ? "OK" : "FAILED";
}})()"""

    inject_escaped = _json.dumps(inject_js)

    script = f"""tell application "Google Chrome"
  repeat with w from 1 to (count of windows)
    repeat with t from 1 to (count of tabs of window w)
      if (URL of tab t of window w) contains "overleaf.com/project" then
        return execute tab t of window w javascript {inject_escaped}
      end if
    end repeat
  end repeat
  tell window 1
    make new tab with properties {{URL:"https://www.overleaf.com/project/69787f4c07ea46326eb8587e"}}
  end tell
  repeat 20 times
    delay 1.0
    try
      set checkCM to execute active tab of window 1 javascript "(function() {{ return !!document.querySelector('.cm-content'); }})()"
      if checkCM is "true" then exit repeat
    end try
  end repeat
  delay 0.5
  return execute active tab of window 1 javascript {inject_escaped}
end tell"""
    subprocess.run(["osascript", "-e", script], check=True)


def trigger_overleaf_download():
    """Trigger PDF download in Overleaf tab after compilation completes"""
    import json as _json
    js_code = """(function() {
  var recompileBtn = Array.from(document.querySelectorAll("button")).find(function(b) {
    return b.innerText && b.innerText.includes("Recompile");
  });
  var isCompiling = recompileBtn && (recompileBtn.innerText.includes("Compiling") || recompileBtn.classList.contains("loading") || recompileBtn.getAttribute("aria-busy") === "true");
  if (isCompiling) return "COMPILING";

  var dl = document.querySelector("a[aria-label*=Download], a.pdf-toolbar-btn, a[href*=output]");
  if (dl && dl.href) {
    window.location.href = dl.href;
    return "DOWNLOAD_TRIGGERED";
  }
  return "NO_DL";
})()"""
    js_escaped = _json.dumps(js_code)
    script = f"""tell application "Google Chrome"
  repeat with w from 1 to (count of windows)
    repeat with t from 1 to (count of tabs of window w)
      if (URL of tab t of window w) contains "overleaf.com/project" then
        return execute tab t of window w javascript {js_escaped}
      end if
    end repeat
  end repeat
  return "NO_TAB"
end tell"""
    for _ in range(16):  # Poll up to 8 seconds
        try:
            res = subprocess.check_output(["osascript", "-e", script]).decode("utf-8").strip()
            if res == "DOWNLOAD_TRIGGERED":
                print("✓ Overleaf download triggered successfully!", flush=True)
                return True
            elif res == "COMPILING":
                time.sleep(0.5)
            else:
                time.sleep(0.5)
        except Exception:
            time.sleep(0.5)
    return False


def notify_macos(title, message):
    try:
        script = f'display notification "{message}" with title "{title}"'
        subprocess.run(["osascript", "-e", script], check=False)
    except Exception:
        pass

def get_downloads_pdf_set():
    if not os.path.exists(DOWNLOADS_DIR):
        return set()
    return {
        f for f in os.listdir(DOWNLOADS_DIR)
        if f.lower().endswith(".pdf")
    }

import re

CURRENT_TARGET_COMPANY = "General"

def sanitize_company_name(name):
    if not name or not name.strip():
        return "General"
    cleaned = re.sub(r'[^a-zA-Z0-9_\- ]', '', name.strip())
    cleaned = cleaned.replace(' ', '_')
    return cleaned if cleaned else "General"

def sanitize_candidate_name(name):
    if not name or not name.strip():
        return "Shivamshu_Roy"
    cleaned = re.sub(r'[^a-zA-Z0-9_\- ]', '', name.strip())
    cleaned = cleaned.replace(' ', '_')
    return cleaned if cleaned else "Shivamshu_Roy"

def wait_for_downloaded_pdf(initial_set, timeout_sec=14):
    start_time = time.time()
    while time.time() - start_time < timeout_sec:
        time.sleep(0.5)
        if not os.path.exists(DOWNLOADS_DIR):
            continue
        current_files = os.listdir(DOWNLOADS_DIR)
        
        # Check if Chrome is actively downloading (.crdownload or temporary file)
        has_crdownload = any(f.endswith(".crdownload") or f.startswith(".com.google.Chrome") for f in current_files)
        if has_crdownload:
            continue
            
        # Look for newly appeared PDF or recently modified PDF
        for f in current_files:
            if not f.lower().endswith(".pdf"):
                continue
            path = os.path.join(DOWNLOADS_DIR, f)
            mtime = os.path.getmtime(path)
            if f not in initial_set or (mtime >= start_time - 1.0):
                if os.path.getsize(path) > 1000:
                    return path
    return None

def process_downloaded_pdf(src_path, target_company=None, candidate_name=None):
    global CURRENT_TARGET_COMPANY
    company = sanitize_company_name(target_company or CURRENT_TARGET_COMPANY)
    cand_name = sanitize_candidate_name(candidate_name)
    try:
        company_dir = os.path.join(DESKTOP_RESUMES_DIR, company)
        os.makedirs(company_dir, exist_ok=True)

        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        company_dest = os.path.join(company_dir, f"{cand_name}_Resume.pdf")
        company_archive = os.path.join(company_dir, f"{cand_name}_Resume_{ts}.pdf")
        top_dest = os.path.join(DESKTOP_RESUMES_DIR, f"{cand_name}_Resume.pdf")
        
        # Save clean resume and archive into company folder
        shutil.copy2(src_path, company_dest)
        shutil.copy2(src_path, company_archive)
        shutil.copy2(src_path, top_dest)
            
        print(f"✓ Saved resume to: {company_dest}", flush=True)
        notify_macos("ResumeSync AI", f"Saved resume to Desktop/resumes/{company}/")
        return company_dest
    except Exception as e:
        print(f"Error processing downloaded PDF: {e}", flush=True)
        return None

PROCESSED_DOWNLOAD_FILES = set()

def background_downloads_watcher():
    """Checks ~/Downloads for newly downloaded Overleaf PDFs and backs them up to Desktop/resumes without deleting from Downloads"""
    global PROCESSED_DOWNLOAD_FILES
    while True:
        try:
            if os.path.exists(DOWNLOADS_DIR):
                for f in os.listdir(DOWNLOADS_DIR):
                    if not f.lower().endswith(".pdf"):
                        continue
                    lower_f = f.lower()
                    if any(base in lower_f for base in ["output", "roy", "resume"]):
                        path = os.path.join(DOWNLOADS_DIR, f)
                        try:
                            mtime = os.path.getmtime(path)
                            size = os.path.getsize(path)
                            file_key = f"{path}_{mtime}_{size}"
                            if file_key not in PROCESSED_DOWNLOAD_FILES and size > 5000:
                                PROCESSED_DOWNLOAD_FILES.add(file_key)
                                time.sleep(0.3)
                                process_downloaded_pdf(path)
                        except OSError:
                            pass
        except Exception:
            pass
        time.sleep(1.5)

class OverleafSyncHandler(http.server.BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Company-Name, X-Candidate-Name")
        self.send_header("Access-Control-Allow-Private-Network", "true")

    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        self.send_response(200)
        self._send_cors_headers()
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        companies = []
        try:
            if os.path.exists(DESKTOP_RESUMES_DIR):
                for d in os.listdir(DESKTOP_RESUMES_DIR):
                    p = os.path.join(DESKTOP_RESUMES_DIR, d)
                    if os.path.isdir(p) and not d.startswith("."):
                        companies.append(d)
        except Exception as e:
            print(f"Notice reading resumes directory: {e}", flush=True)

        self.wfile.write(json.dumps({
            "status": "running",
            "port": PORT,
            "targetDir": DESKTOP_RESUMES_DIR,
            "currentCompany": CURRENT_TARGET_COMPANY,
            "companies": sorted(companies)
        }).encode("utf-8"))

    def do_POST(self):
        global CURRENT_TARGET_COMPANY
        base_path = self.path.split("?")[0]

        if base_path.startswith("/company"):
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else ""
            comp_name = ""
            if body:
                try:
                    data = json.loads(body)
                    comp_name = data.get("company", "")
                except Exception:
                    comp_name = body.strip()
            if not comp_name and "?" in self.path:
                import urllib.parse
                qs = urllib.parse.parse_qs(self.path.split("?", 1)[1])
                comp_name = qs.get("company", [""])[0]
            
            target_company = sanitize_company_name(comp_name)
            CURRENT_TARGET_COMPANY = target_company
            company_dir = os.path.join(DESKTOP_RESUMES_DIR, target_company)
            if target_company and target_company.lower() != "general":
                try:
                    os.makedirs(company_dir, exist_ok=True)
                except Exception as e:
                    print(f"Error creating company dir {company_dir}: {e}", flush=True)
            
            self.send_response(200)
            self._send_cors_headers()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({
                "success": True,
                "company": target_company,
                "folder": company_dir
            }).encode("utf-8"))
            return

        if base_path.startswith("/open-folder"):
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else ""
            comp_name = ""
            if body:
                try:
                    data = json.loads(body)
                    comp_name = data.get("company", "")
                except Exception:
                    comp_name = body.strip()
            target_company = sanitize_company_name(comp_name or CURRENT_TARGET_COMPANY)
            company_dir = os.path.join(DESKTOP_RESUMES_DIR, target_company)
            os.makedirs(company_dir, exist_ok=True)
            subprocess.run(["open", company_dir], check=False)
            
            self.send_response(200)
            self._send_cors_headers()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({
                "success": True,
                "folder": company_dir
            }).encode("utf-8"))
            return

        if base_path in ["/sync", "/download"]:
            try:
                content_length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else ""
                
                raw_company = self.headers.get("X-Company-Name", "").strip()
                raw_candidate = self.headers.get("X-Candidate-Name", "").strip()
                if "?" in self.path:
                    import urllib.parse
                    qs = urllib.parse.parse_qs(self.path.split("?", 1)[1])
                    if not raw_company:
                        raw_company = qs.get("company", [""])[0]
                    if not raw_candidate:
                        raw_candidate = qs.get("candidate", [""])[0]

                target_company = sanitize_company_name(raw_company or CURRENT_TARGET_COMPANY)
                target_candidate = sanitize_candidate_name(raw_candidate)
                CURRENT_TARGET_COMPANY = target_company

                company_dir = os.path.join(DESKTOP_RESUMES_DIR, target_company)
                try:
                    os.makedirs(company_dir, exist_ok=True)
                except Exception as e:
                    print(f"Notice creating Desktop company dir ({e}), falling back to projects/resumes", flush=True)
                    company_dir = os.path.expanduser(f"~/projects/resumes/{target_company}")
                    os.makedirs(company_dir, exist_ok=True)

                # 1. If LaTeX body provided, save .tex file to company folder + top-level
                if body and len(body) > 100:
                    try:
                        tex_company = os.path.join(company_dir, f"{target_candidate}_Resume.tex")
                        with open(tex_company, "w", encoding="utf-8") as tf:
                            tf.write(body)
                        tex_top = os.path.join(DESKTOP_RESUMES_DIR, f"{target_candidate}_Resume.tex")
                        with open(tex_top, "w", encoding="utf-8") as tf:
                            tf.write(body)
                    except Exception as e:
                        print(f"Notice saving local .tex file: {e}", flush=True)

                    # Put LaTeX on clipboard
                    try:
                        proc = subprocess.Popen(["pbcopy"], stdin=subprocess.PIPE)
                        proc.communicate(body.encode("utf-8"))
                    except Exception:
                        pass

                    # Inject LaTeX into Overleaf and recompile
                    inject_latex_and_recompile(body)

                    # Wait for Overleaf compilation to begin
                    time.sleep(1.0)

                # 2. Trigger download via JS navigation
                initial_pdfs = get_downloads_pdf_set()
                trigger_overleaf_download()

                # 3. Wait for downloaded PDF and move to company folder
                downloaded_file = wait_for_downloaded_pdf(initial_pdfs, timeout_sec=14)
                dest_path = None
                if downloaded_file:
                    dest_path = process_downloaded_pdf(downloaded_file, target_company=target_company, candidate_name=target_candidate)

                self.send_response(200)
                self._send_cors_headers()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({
                    "success": True,
                    "downloaded": bool(dest_path),
                    "company": target_company,
                    "folder": company_dir,
                    "filePath": dest_path or os.path.join(company_dir, f"{target_candidate}_Resume.pdf"),
                    "message": f"Pushed to Overleaf & saved to {company_dir}!"
                }).encode("utf-8"))
            except Exception as e:
                print(f"Error in /sync: {e}", flush=True)
                self.send_response(200) # Return 200 with error info so client doesn't choke
                self._send_cors_headers()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()

def run_server():
    watcher_thread = threading.Thread(target=background_downloads_watcher, daemon=True)
    watcher_thread.start()

    server_address = ("127.0.0.1", PORT)
    httpd = http.server.HTTPServer(server_address, OverleafSyncHandler)
    print(f"ResumeSync Overleaf & Download Bridge running on http://127.0.0.1:{PORT}", flush=True)
    print(f"Resume files saved to: {DESKTOP_RESUMES_DIR}", flush=True)
    httpd.serve_forever()

if __name__ == "__main__":
    run_server()
