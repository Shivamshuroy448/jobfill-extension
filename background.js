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
  if (request.action === "INJECT_INTO_OVERLEAF") {
    (async () => {
      try {
        // 1. Find or create the open Overleaf project tab
        const tabs = await chrome.tabs.query({ url: "*://*.overleaf.com/project/*" });
        let overleafTab = null;

        if (tabs && tabs.length > 0) {
          overleafTab = tabs[0];
          await chrome.tabs.update(overleafTab.id, { active: true });
          if (overleafTab.windowId) {
            await chrome.windows.update(overleafTab.windowId, { focused: true });
          }
        } else {
          // Open the specific project tab if not currently open
          overleafTab = await chrome.tabs.create({
            url: "https://www.overleaf.com/project/69787f4c07ea46326eb8587e",
            active: true
          });
          if (overleafTab.windowId) {
            await chrome.windows.update(overleafTab.windowId, { focused: true });
          }
          // Wait for tab DOM to load
          await waitForTabComplete(overleafTab.id, 25000);
          // Allow Overleaf SPA 2.5 seconds to mount DOM & connect WebSocket
          await new Promise((r) => setTimeout(r, 2500));
        }

        // 2. Inject script to replace content in CodeMirror 6 and recompile
        const results = await chrome.scripting.executeScript({
          target: { tabId: overleafTab.id },
          world: "MAIN",
          func: async (latexCode) => {
            const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

            // Helper to wait for the editor DOM to be mounted
            const startWait = Date.now();
            while (Date.now() - startWait < 12000) {
              if (document.querySelector(".cm-editor, .cm-content, .CodeMirror")) break;
              await sleep(250);
            }

            const cmContent = document.querySelector(".cm-content");
            const cmEditor = document.querySelector(".cm-editor");

            let view = null;

            // Strategy 1: Find CodeMirror 6 EditorView on DOM nodes
            function findView(el) {
              if (!el) return null;
              let curr = el;
              while (curr) {
                if (curr.cmView && curr.cmView.view && typeof curr.cmView.view.dispatch === "function") {
                  return curr.cmView.view;
                }
                if (curr.cmView && curr.cmView.rootView && curr.cmView.rootView.view && typeof curr.cmView.rootView.view.dispatch === "function") {
                  return curr.cmView.rootView.view;
                }
                curr = curr.parentElement;
              }
              return null;
            }

            view = findView(cmContent) || findView(cmEditor);

            // Strategy 2: Check all descendant elements of .cm-editor with cmView
            if (!view && cmEditor) {
              const nodes = cmEditor.querySelectorAll("*");
              for (const n of nodes) {
                const v = findView(n);
                if (v) {
                  view = v;
                  break;
                }
              }
            }

            // Strategy 3: Check Overleaf window._ide object
            if (!view && typeof window._ide !== "undefined") {
              const ideList = [
                window._ide?.editor,
                window._ide?.editor?.view,
                window._ide?.editorManager?.editor,
                window._ide?.editorManager?.getCurrentEditor?.(),
                window._ide?.$scope?.editor?.sharejs_doc?.cm6?.view,
                window._ide?.editor?.sharejs_doc?.cm6?.view,
                window.editor
              ];
              for (const item of ideList) {
                if (item && typeof item.dispatch === "function") {
                  view = item;
                  break;
                }
                if (item && item.view && typeof item.view.dispatch === "function") {
                  view = item.view;
                  break;
                }
              }
            }

            // Strategy 4: CodeMirror.EditorView.findFromDOM
            if (!view && window.CodeMirror && window.CodeMirror.EditorView && typeof window.CodeMirror.EditorView.findFromDOM === "function") {
              try {
                view = window.CodeMirror.EditorView.findFromDOM(cmEditor || cmContent);
              } catch (e) {}
            }

            let replaced = false;
            let methodUsed = "none";

            // If CM6 view was discovered, dispatch state transaction
            if (view && typeof view.dispatch === "function") {
              try {
                const docLen = (view.state && view.state.doc) ? view.state.doc.length : 0;
                view.dispatch({
                  changes: {
                    from: 0,
                    to: docLen,
                    insert: latexCode
                  }
                });
                replaced = true;
                methodUsed = "cm6-dispatch";
              } catch (err) {
                console.warn("CM6 dispatch failed:", err);
              }
            }

            // Strategy 5: CodeMirror 5 fallback
            if (!replaced) {
              const cm5 = document.querySelector(".CodeMirror");
              if (cm5 && cm5.CodeMirror && typeof cm5.CodeMirror.setValue === "function") {
                cm5.CodeMirror.setValue(latexCode);
                replaced = true;
                methodUsed = "cm5-setValue";
              }
            }

            // Strategy 6: Fallback DOM insertion
            if (!replaced) {
              const target = cmContent || document.querySelector("[contenteditable='true']");
              if (target) {
                target.focus();
                const sel = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(target);
                sel.removeAllRanges();
                sel.addRange(range);

                try {
                  const dt = new DataTransfer();
                  dt.setData("text/plain", latexCode);
                  const pasteEvt = new ClipboardEvent("paste", {
                    bubbles: true,
                    cancelable: true,
                    clipboardData: dt
                  });
                  target.dispatchEvent(pasteEvt);
                  replaced = true;
                  methodUsed = "dom-clipboard-paste";
                } catch (e) {}

                try {
                  const ins = document.execCommand("insertText", false, latexCode);
                  if (ins) {
                    replaced = true;
                    methodUsed = "dom-execCommand";
                  }
                } catch (e) {}
              }
            }

            // Trigger Overleaf Recompile
            setTimeout(() => {
              const compileBtn = document.querySelector("button.compile-button") ||
                                 document.querySelector(".btn-recompile") ||
                                 document.querySelector('button[aria-label="Recompile"]') ||
                                 document.querySelector(".recompile-btn");
              if (compileBtn) {
                compileBtn.click();
              }
            }, 500);

            return {
              success: replaced,
              method: methodUsed,
              hasView: !!view
            };
          },
          args: [request.latex]
        });

        const execResult = results && results[0] ? results[0].result : { success: true };
        sendResponse({
          success: true,
          detail: execResult,
          message: "LaTeX pushed to Overleaf and recompiled!"
        });
      } catch (err) {
        console.error("INJECT_INTO_OVERLEAF error:", err);
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
            world: "MAIN",
            func: () => {
              const dl = document.querySelector('a[aria-label="Download PDF"]') ||
                         document.querySelector(".btn-download-pdf") ||
                         document.querySelector("a.download-pdf-btn") ||
                         document.querySelector("a[download]");
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
