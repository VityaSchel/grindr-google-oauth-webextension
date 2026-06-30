# grindr-google-oauth-webextension

Headless WebExtension that mints a Google **OAuth access token** via Google
Identity Services (GIS) for Grindr sign-in (`POST /v8/sessions/thirdparty`,
`thirdPartyVendor: 2`).

GIS refuses to run in embedded app WebViews, and GeckoView forbids the host app
from injecting JS into pages — a content script is the only way to run our code on
the page. One codebase serves two hosts.

## Why web.grindr.com

GIS's token client requires the calling page's origin to be a registered
*Authorized JavaScript origin*; `moz-extension://…` cannot be registered. So GIS
runs on `https://web.grindr.com/`: the content script matches that origin and
injects the GIS code into the page's main world.

## Layout

```
manifest.json        MV2, strict CSP, least-privilege permissions, no popup UI.
shared/gis-core.js   The shared client-side script: window.__grindrGis. GIS only,
                     no transport/UI. Consumed here and by the Tauri app (submodule).
src/page-runner.js   Page main world: runs GIS, postMessages the result.
src/content.js       Isolated world: injects the page scripts, bridges results,
                     and (Firefox) renders the token to a blank page.
src/background.js    Host detection. Firefox: icon click opens + arms the tab.
                     GeckoView: token handed to the host app via native messaging.
```

Flow: `content.js` injects `gis-core.js` + `page-runner.js` → page-runner runs GIS
→ `postMessage` → `content.js` → `runtime.sendMessage` → `background.js` → blank
page (Firefox) or `sendNativeMessage` (GeckoView).

## Hosts

- **Firefox desktop** — click the toolbar icon; a tab opens on web.grindr.com, GIS
  runs, and the page is replaced with a bare document containing the token.
- **GeckoView companion** — the host app loads web.grindr.com in a `GeckoSession`
  that has this extension installed; the content script auto-runs and the token is
  delivered via native messaging. The host registers a `MessageDelegate` under the
  same name as `NATIVE_APP` in `background.js`:

  ```kotlin
  controller.setMessageDelegate(extension, delegate, "grindr_google_oauth")
  // delegate.onMessage receives { type: "token", token: "ya29..." }
  ```

  Let GeckoView handle GIS's real popup via the session content/prompt delegate; do
  not emulate popups.

## Security

- **No remote code in the extension.** CSP is `script-src 'self'`; the extension
  only ever executes bundled, reviewed code. The single remote dependency is
  Google's own `accounts.google.com/gsi/client`, which loads in the page world
  (web.grindr.com), not in the extension.
- **Least privilege.** Permissions are `nativeMessaging` + `https://web.grindr.com/*`.
- **No `innerHTML`/`eval`.** The token page is built with `textContent`.
- **postMessage is origin-checked** on both sides (`event.source`/`event.origin`).

## Versioning

Tagged releases; the Tauri app pins this repo as a git submodule at a specific
commit (not a floating branch). Bump deliberately and review the diff.

## Caveats

- `web.grindr.com` must be an Authorized JS origin for the client id in
  `shared/gis-core.js`.
- GIS's account picker needs a user gesture; with no UI, the first click/keypress
  on the blank page unblocks it if the initial attempt is popup-blocked.
- Loading `gsi/client` and the injected scripts run under web.grindr.com's CSP.

## Develop

```sh
web-ext run                      # Firefox desktop
web-ext run -t firefox-android   # GeckoView / Firefox for Android
```
