// JobFill AI & ResumeSync Background Service Worker

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "INJECT_INTO_OVERLEAF") {
    (async () => {
      try {
        // 1. Find the open Overleaf project tab
        const tabs = await chrome.tabs.query({ url: "*://*.overleaf.com/project/*" });
        if (!tabs || tabs.length === 0) {
          await chrome.tabs.create({ url: "https://www.overleaf.com/project/69787f4c07ea46326eb8587e" });
          sendResponse({ success: false, message: "Overleaf project opened. Click sync again to push!" });
          return;
        }

        const overleafTab = tabs[0];

        // 2. Bring the Overleaf tab into focus
        await chrome.tabs.update(overleafTab.id, { active: true });
        if (overleafTab.windowId) {
          await chrome.windows.update(overleafTab.windowId, { focused: true });
        }

        // 3. Inject script to replace content in CodeMirror 6 and recompile
        const results = await chrome.scripting.executeScript({
          target: { tabId: overleafTab.id },
          func: (latexCode) => {
            const cm = document.querySelector(".cm-content");
            if (!cm) return { success: false, reason: "No CodeMirror content found in Overleaf" };
            cm.focus();
            const sel = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(cm);
            sel.removeAllRanges();
            sel.addRange(range);
            
            // Insert the new LaTeX code cleanly
            const inserted = document.execCommand("insertText", false, latexCode);
            
            // Trigger Overleaf recompile and auto-download
            setTimeout(() => {
              const compileBtn = document.querySelector("button.compile-button");
              if (compileBtn) compileBtn.click();
              setTimeout(() => {
                const dl = document.querySelector('a[aria-label="Download PDF"]');
                if (dl) dl.click();
              }, 3000);
            }, 300);

            return { success: inserted };
          },
          args: [request.latex]
        });

        const execResult = results && results[0] ? results[0].result : { success: true };
        sendResponse({ success: true, detail: execResult, message: "Pushed to Overleaf & Downloaded PDF via Chrome Extension!" });
      } catch (err) {
        sendResponse({ success: false, error: err.toString() });
      }
    })();
    return true; // Keep channel open for async response
  }

  if (request.action === "DOWNLOAD_OVERLEAF_PDF") {
    (async () => {
      try {
        const tabs = await chrome.tabs.query({ url: "*://*.overleaf.com/project/*" });
        if (tabs && tabs.length > 0) {
          await chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: () => {
              const dl = document.querySelector('a[aria-label="Download PDF"]');
              if (dl) dl.click();
            }
          });
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, reason: "No Overleaf tab found" });
        }
      } catch (err) {
        sendResponse({ success: false, error: err.toString() });
      }
    })();
    return true;
  }
});
