# Grindr Google OAuth WebExtension

> [!NOTE]
> This is a **developer tool** not intended for general use. \
> You might be looking for [Open Grind](https://opengrind.org) or [Open Grind Google OAuth Android app](https://git.opengrind.org/open-grind/open-grind-google-oauth-android-app).

WebExtension that gets OAuth access token via Google Identity Services (GIS) for Grindr sign-in. Made possible by the fact that GIS refuses to run in embedded app WebViews, and GeckoView forbids the host app from injecting JS into pages.

## Install

- Firefox: [Download from addons.mozilla.org](https://addons.mozilla.org/en-US/firefox/addon/grindr-google-oauth/)
- GeckoView: add this repository as a submodule, bundle it in your app's `assets/`, and install it as a built-in extension via `runtime.webExtensionController.ensureBuiltIn(uri, id)`

> [!NOTE]
> `nativeMessaging` and `geckoViewAddons` are privileged permissions that only work for a **built-in** extension, so they are **not** in the committed `manifest.json`. A GeckoView host must add them to its bundled copy of the manifest (e.g. patch it during the `assets/` copy step).

## Usage

Firefox:

1. Install extension in Firefox
2. Click the toolbar icon
3. A new tab opens with a button
4. Click "Sign in with Google"
5. Complete the OAuth flow in new tab
6. Copy the resulting token from the page and paste it into the host app

GeckoView:

1. Load web.grindr.com in a `GeckoSession` that has this extension installed
2. The content script auto-runs and the token is delivered via native messaging
3. The host registers a `MessageDelegate` under the same name as `NATIVE_APP` in `background.js`:

  ```kotlin
  controller.setMessageDelegate(extension, delegate, "grindr_google_oauth")
  // delegate.onMessage receives { type: "token", token: "ya29..." }
  ```

The token is then to be used with the [`/v8/sessions/thirdparty` endpoint](https://opengrind.org/grindr-api/authentication#login-via-third-party-wip).

## License

[MIT](./LICENSE)
