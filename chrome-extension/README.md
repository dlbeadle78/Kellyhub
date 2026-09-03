# Add to Kellyn Hub Chrome extension

This small Manifest V3 extension sends a page, link or selected text to Kellyn Hub Quick Capture.

It does not capture browsing activity automatically. Data is only sent when the user chooses an explicit Kellyn Hub action.

## Install for local testing in Chrome

1. Download or clone the Kellyhub repository.
2. Open `chrome://extensions` in Google Chrome.
3. Turn on **Developer mode**.
4. Choose **Load unpacked**.
5. Select the `chrome-extension` folder.
6. Pin **Add to Kellyn Hub** if useful.

## Available actions

- Extension button: **Add this page**.
- Extension button: **Add selected text**.
- Right click: **Kellyn Hub → Add this page**.
- Right click selected text: **Kellyn Hub → Add selected text**.
- Right click a link: **Kellyn Hub → Add this link**.

The action opens the live Hub at `https://kellyhub.vercel.app/#/capture` with the selected information pre-filled. Kellyn still reviews and saves the capture herself.
