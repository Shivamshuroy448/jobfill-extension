// JobFill AI & ResumeSync Background Service Worker

function waitForTabComplete(tabId, timeoutMs = 25000) {
  return new Promise((resolve) => {
    let finished = false;
    const timer = setTimeout(() => {
      if (!finished) {
        finished = true;
        chrome.tabs.onUpdated.removeListener(listener);
        resolve(false);
      }
    }, timeoutMs);

    const listener = (tid, changeInfo, tab) => {
      if (tid === tabId && changeInfo.status === "complete") {
        if (!finished) {
          finished = true;
          clearTimeout(timer);
          chrome.tabs.onUpdated.removeListener(listener);
          resolve(true);
        }
      }
    };
    chrome.tabs.onUpdated.addListener(listener);

    chrome.tabs.get(tabId, (t) => {
      if (chrome.runtime.lastError) return;
      if (t && t.status === "complete") {
        if (!finished) {
          finished = true;
          clearTimeout(timer);
          chrome.tabs.onUpdated.removeListener(listener);
          resolve(true);
        }
      }
    });
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // 1. INJECT INTO OVERLEAF
  if (request.action === "INJECT_INTO_OVERLEAF") {
    (async () => {
      try {
        const tabs = await chrome.tabs.query({ url: "*://*.overleaf.com/project/*" });
        let overleafTab = null;

        if (tabs && tabs.length > 0) {
          overleafTab = tabs.find(t => t.active) || tabs.find(t => t.url && t.url.includes("69787f4c07ea46326eb8587e")) || tabs[0];
          await chrome.tabs.update(overleafTab.id, { active: true });
          if (overleafTab.windowId) {
            await chrome.windows.update(overleafTab.windowId, { focused: true });
          }
        } else {
          overleafTab = await chrome.tabs.create({
            url: "https://www.overleaf.com/project/69787f4c07ea46326eb8587e",
            active: true
          });
          if (overleafTab.windowId) {
            await chrome.windows.update(overleafTab.windowId, { focused: true });
          }
          await waitForTabComplete(overleafTab.id, 25000);
          await new Promise((r) => setTimeout(r, 2000));
        }

        // Execute injection in Overleaf tab
        const results = await chrome.scripting.executeScript({
          target: { tabId: overleafTab.id },
          world: "MAIN",
          func: async (latexCode) => {
            const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

            // Wait for editor element
            const startWait = Date.now();
            while (Date.now() - startWait < 15000) {
              if (document.querySelector(".cm-content, .cm-editor")) break;
              await sleep(250);
            }

            const cmContent = document.querySelector(".cm-content");
            let replaced = false;
            let methodUsed = "none";

            if (cmContent) {
              try {
                cmContent.focus();
                document.execCommand("selectAll", false, null);
                replaced = document.execCommand("insertText", false, latexCode);
                if (replaced) methodUsed = "execCommand-direct";
              } catch (err) {
                console.warn("Direct execCommand failed:", err);
              }
            }

            // Fallback: Range selection + execCommand
            if (!replaced && cmContent) {
              try {
                cmContent.focus();
                const sel = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(cmContent);
                sel.removeAllRanges();
                sel.addRange(range);
                replaced = document.execCommand("insertText", false, latexCode);
                if (replaced) methodUsed = "range-execCommand";
              } catch (e) {}
            }

            // Click Recompile
            setTimeout(() => {
              const compileBtn = document.querySelector("button.compile-button, .btn-recompile, button[aria-label='Recompile'], .recompile-btn");
              if (compileBtn) {
                compileBtn.click();
              }
            }, 400);

            return {
              success: replaced,
              method: methodUsed
            };
          },
          args: [request.latex]
        });

        const execResult = results && results[0] ? results[0].result : { success: true };
        sendResponse({
          success: true,
          detail: execResult,
          message: "LaTeX injected into Overleaf and recompiled!"
        });
      } catch (err) {
        console.error("INJECT_INTO_OVERLEAF error:", err);
        sendResponse({ success: false, error: err.toString() });
      }
    })();
    return true;
  }

  // 2. DOWNLOAD OVERLEAF PDF
  if (request.action === "DOWNLOAD_OVERLEAF_PDF") {
    (async () => {
      try {
        const tabs = await chrome.tabs.query({ url: "*://*.overleaf.com/project/*" });
        if (tabs && tabs.length > 0) {
          const targetTab = tabs.find(t => t.active) || tabs.find(t => t.url && t.url.includes("69787f4c07ea46326eb8587e")) || tabs[0];
          await chrome.tabs.update(targetTab.id, { active: true });
          if (targetTab.windowId) {
            await chrome.windows.update(targetTab.windowId, { focused: true });
          }

          const results = await chrome.scripting.executeScript({
            target: { tabId: targetTab.id },
            world: "MAIN",
            func: async () => {
              const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
              const start = Date.now();
              while (Date.now() - start < 15000) {
                const dl = document.querySelector("a[aria-label='Download PDF'], a.btn-download-pdf, a.pdf-download-btn, a[download]");
                if (dl && dl.href && !dl.classList.contains("disabled")) {
                  dl.click();
                  return { success: true, url: dl.href };
                }
                await sleep(500);
              }
              return { success: false, error: "Download button not ready or compiling" };
            }
          });
          const res = results && results[0] ? results[0].result : { success: true };
          sendResponse({ success: true, detail: res });
        } else {
          // Open project tab so user can download
          const newTab = await chrome.tabs.create({
            url: "https://www.overleaf.com/project/69787f4c07ea46326eb8587e",
            active: true
          });
          sendResponse({ success: true, message: "Opened Overleaf project tab" });
        }
      } catch (err) {
        sendResponse({ success: false, error: err.toString() });
      }
    })();
    return true;
  }
});
