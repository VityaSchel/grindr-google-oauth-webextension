(() => {
	"use strict";
	
	if (window.__grindrGis) return;
	
	const GIS_SDK_URL = "https://accounts.google.com/gsi/client";
	
	const DEFAULTS = {
		clientId:
		"1036042917246-htcnf9mm3qnis86l47ngp0a9ncqsll7j.apps.googleusercontent.com",
		scope: "email profile",
		prompt: "select_account",
	};
	
	const matchAccessTokenInString = (text) => {
		const match = /access_token["'\s]*[=:]\s*["']?([^"'&\s\\)}\]]+)/i.exec(
			text,
		);
		return match ? decodeURIComponent(match[1]) : null;
	};
	
	const extractAccessToken = (data) => {
		let found = null;
		const walk = (value, depth) => {
			if (found || value == null || depth > 6) return;
			if (typeof value === "string") {
				if (!value.includes("access_token")) return;
				found = matchAccessTokenInString(value);
				if (found) return;
				try {
					walk(JSON.parse(value), depth + 1);
				} catch {}
				return;
			}
			if (typeof value === "object") {
				if (typeof value.access_token === "string") {
					found = value.access_token;
					return;
				}
				for (const key of Object.keys(value)) {
					walk(value[key], depth + 1);
					if (found) return;
				}
			}
		};
		
		if (typeof data === "string") {
			const direct = matchAccessTokenInString(data);
			if (direct) return direct;
			try {
				walk(JSON.parse(data), 0);
			} catch {
				walk(data, 0);
			}
		} else {
			walk(data, 0);
		}
		return found;
	};
	
	const gisOAuth2 = () => window.google?.accounts?.oauth2;
	
	let sdkLoad = null;
	const loadGisSdk = () => {
		if (gisOAuth2()) return Promise.resolve();
		if (!sdkLoad) {
			sdkLoad = (async () => {
				await new Promise((resolve, reject) => {
					const script = document.createElement("script");
					script.src = GIS_SDK_URL;
					script.async = true;
					script.onload = resolve;
					script.onerror = () => reject(new Error("GIS SDK failed to load"));
					(document.head || document.documentElement).appendChild(script);
				});
				for (let attempt = 0; attempt < 100; attempt++) {
					if (gisOAuth2()) return;
					await new Promise((resolve) => setTimeout(resolve, 50));
				}
				throw new Error("GIS SDK initialize failed");
			})().catch((error) => {
				sdkLoad = null;
				throw error;
			});
		}
		return sdkLoad;
	};
	
	const requestAccessToken = async (options = {}) => {
		const { clientId, scope, prompt } = { ...DEFAULTS, ...options };
		await loadGisSdk();
		return new Promise((resolve, reject) => {
			let settled = false;
			const resolveOnce = (token) => {
				if (settled) return;
				settled = true;
				resolve(token);
			};
			const rejectOnce = (error) => {
				if (settled) return;
				settled = true;
				reject(error);
			};
			const tokenClient = gisOAuth2().initTokenClient({
				client_id: clientId,
				scope,
				callback: (response) => {
					const token = response?.access_token || extractAccessToken(response);
					if (token) resolveOnce(token);
					else rejectOnce(new Error("GIS returned no access_token"));
				},
				error_callback: (error) =>
					rejectOnce(
					new Error(`token client error: ${JSON.stringify(error || {})}`),
				),
			});
			tokenClient.requestAccessToken({ prompt });
		});
	};
	
	window.__grindrGis = {
		DEFAULTS,
		extractAccessToken,
		loadGisSdk,
		requestAccessToken,
	};
})();
