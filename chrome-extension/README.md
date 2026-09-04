# Add to Kellyn Hub Chrome extension

This small Manifest V3 extension sends a screenshot, page, link or selected text to Kellyn Hub Quick Capture.

It does not capture browsing activity automatically. Data is only captured when the user chooses an explicit Kellyn Hub action.

## Install for local testing in Chrome

1. Download or clone the Kellyhub repository.
2. Open `chrome://extensions` in Google Chrome.
3. Turn on **Developer mode**.
4. Choose **Load unpacked**.
5. Select the `chrome-extension` folder.
6. Pin **Add to Kellyn Hub** if useful.

If the extension was already installed before screenshot capture was added, return to `chrome://extensions` and press **Reload** on **Add to Kellyn Hub** after replacing the local extension folder with the latest version.

## Available actions

- Extension button: **Capture screenshot**.
- Extension button: **Add this page**.
- Extension button: **Add selected text**.
- Right click: **Kellyn Hub → Capture screenshot**.
- Right click: **Kellyn Hub → Add this page**.
- Right click selected text: **Kellyn Hub → Add selected text**.
- Right click a link: **Kellyn Hub → Add this link**.

### Screenshot flow

**Capture screenshot** captures the visible part of the current Chrome tab as a JPEG. The extension then opens Kellyn Hub Quick Capture, carries across the page title and source URL, and automatically attaches the screenshot to the file queue. Kellyn reviews it and chooses **Save capture** before anything is stored in Kellyn Hub.

The screenshot action is suitable for Teams in the browser, assignment pages, teacher instructions, WJEC pages and other school websites that Chrome allows the extension to capture.

The other actions open the live Hub at `https://kellyhub.vercel.app/#/capture` with the selected information pre-filled. Kellyn still reviews and saves the capture herself.
