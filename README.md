# Grindr Google OAuth WebExtension

> [!NOTE]
> This is a **developer tool** not intended for general use. \
> You might be looking for [Open Grind](https://opengrind.org) or [Open Grind Google OAuth Android app](https://git.opengrind.org/open-grind/open-grind-google-oauth-android-app).

WebExtension that gets OAuth access token via Google Identity Services (GIS) for Grindr sign-in. Made possible by the fact that GIS refuses to run in embedded app WebViews, and GeckoView forbids the host app from injecting JS into pages.

## Install

- **Firefox, Librewolf** (desktop & Android):
  <!-- - [Download from addons.mozilla.org](https://addons.mozilla.org/en-US/firefox/addon/grindr-google-oauth/) (recommended) -->
  - Download `grindr_google_oauth-x.x.x-firefox.zip` from [Releases](https://git.opengrind.org/open-grind/grindr-google-oauth-webextension/releases), unarchive, load the unpacked directory via `about:debugging` (This Firefox → "Load Temporary Add-on")
- **Google Chrome, Chromium & Chromium-based browsers** (desktop only):
  <!-- - [Download from chrome.google.com](https://chromewebstore.google.com/detail/grindr-web-unlock/oknhfchbiaghpdadehfnlkelhlflpgck) (recommended) -->
  - Download `grindr_google_oauth-x.x.x-chrome.zip` from [Releases](https://git.opengrind.org/open-grind/grindr-google-oauth-webextension/releases), unarchive, load the unpacked directory via `chrome://extensions` (Developer mode → "Load unpacked")
- **GeckoView** (for developers embedding this project into their Android app):
  - Download `grindr_google_oauth-x.x.x-geckoview.zip` from [Releases](https://git.opengrind.org/open-grind/grindr-google-oauth-webextension/releases), bundle the built `web-ext-artifacts/geckoview/` directory in your app's `assets/` and install it as a built-in extension via `runtime.webExtensionController.ensureBuiltIn(uri, id)` (`nativeMessaging` and `geckoViewAddons` are privileged permissions that only work for a built-in extension)

Alternatively, clone the repository yourself and build the extension using `./build.sh [firefox|chrome|geckoview]` (requires [Bun](https://bun.com)).

## Usage

**Firefox, Librewolf** (desktop & Android) and **Google Chrome, Chromium & Chromium-based browsers** (desktop only):

1. Install the extension
2. Click the toolbar icon
3. A new tab opens with a button
4. Click "Sign in with Google"
5. Complete the OAuth flow in new tab
6. Copy the resulting token from the page and paste it into the host app

**GeckoView**:

1. Load web.grindr.com in a `GeckoSession` that has this extension installed
2. The content script auto-runs and the token is delivered via native messaging
3. The host registers a `MessageDelegate` under the same name as `NATIVE_APP` in `shared/background.js`:

  ```kotlin
  controller.setMessageDelegate(extension, delegate, "grindr_google_oauth")
  // delegate.onMessage receives { type: "token", token: "ya29..." }
  ```

The token is then to be used with the [`/v8/sessions/thirdparty` endpoint](https://opengrind.org/grindr-api/authentication#login-via-third-party-wip).

## License

[MIT](./LICENSE)
