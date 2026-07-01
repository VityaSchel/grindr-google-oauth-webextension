(() => {
	"use strict";
	
	const api = typeof browser !== "undefined" ? browser : chrome;
	const RESULT_CHANNEL = "grindr-google-oauth:result";
	const START_CHANNEL = "grindr-google-oauth:start";
	const PAGE_SCRIPTS = ["shared/gis-core.js", "src/page-runner.js"];
	
	let buttonEl = null;
	
	const buildOverlay = () => {
		document.documentElement.classList.add("grindr-oauth-active");
		
		const overlay = document.createElement("div");
		overlay.className = "grindr-oauth-overlay";
		
		const card = document.createElement("div");
		card.className = "grindr-oauth-card";
		
		buttonEl = document.createElement("button");
		buttonEl.type = "button";
		buttonEl.className = "grindr-oauth-button";
		buttonEl.textContent = "Loading...";
		buttonEl.disabled = true;
		
		card.append(buttonEl);
		overlay.append(card);
		document.documentElement.append(overlay);
	};
	
	const applyPhase = (phase) => {
		if (!buttonEl) return;
		if (phase === "loading") {
			buttonEl.disabled = true;
			buttonEl.textContent = "Loading...";
		} else if (phase === "ready") {
			buttonEl.disabled = false;
			buttonEl.textContent = "Sign in with Google";
			buttonEl.focus();
		} else if (phase === "signing-in") {
			buttonEl.disabled = true;
			buttonEl.textContent = "Signing in with Google...";
		}
	};
	
	const injectPageScript = (path) =>
		new Promise((resolve, reject) => {
		const script = document.createElement("script");
		script.src = api.runtime.getURL(path);
		script.onload = () => {
			script.remove();
			resolve();
		};
		script.onerror = () => reject(new Error(`failed to inject ${path}`));
		(document.head || document.documentElement).appendChild(script);
	});
	
	const injectPageScripts = async () => {
		for (const path of PAGE_SCRIPTS) {
			await injectPageScript(path);
		}
	};
	
	let handled = false;
	
	const handleToken = async (token) => {
		handled = true;
		try {
			await api.runtime.sendMessage({ type: "token", token });
		} catch (error) {
			reportError(String(error?.message || error));
		}
	};
	
	const showError = (error) => {
		if (buttonEl) {
			buttonEl.disabled = false;
			buttonEl.textContent = "Try again";
		}
		window.alert(`Sign-in failed: ${error}`);
		reportError(error);
	};
	
	const reportError = (error) => {
		api.runtime.sendMessage({ type: "error", error }).catch(() => {});
	};
	
	const isResultMessage = (event) =>
		event.source === window &&
	event.origin === location.origin &&
	event.data?.channel === RESULT_CHANNEL;
	
	window.addEventListener("message", (event) => {
		if (!isResultMessage(event)) return;
		const { phase, token, error } = event.data;
		if (phase) {
			applyPhase(phase);
			return;
		}
		if (handled) return;
		if (token) handleToken(token);
		else if (error) showError(error);
	});
	
	const runDesktop = async () => {
		window.stop();
		buildOverlay();
		try {
			await injectPageScripts();
		} catch (error) {
			showError(String(error?.message || error));
		}
	};
	
	const runAuto = async () => {
		try {
			await injectPageScripts();
			window.postMessage({ channel: START_CHANNEL }, location.origin);
		} catch (error) {
			reportError(String(error?.message || error));
		}
	};
	
	const isCompanion = () => {
		try {
			return (api.runtime.getManifest().permissions || []).includes(
				"nativeMessaging",
			);
		} catch {
			return false;
		}
	};

	const main = async () => {
		if (isCompanion()) {
			await runAuto();
			return;
		}
		let armed = false;
		try {
			armed = Boolean((await api.runtime.sendMessage({ type: "ready" }))?.armed);
		} catch {}
		if (armed) {
			await runDesktop();
		}
	};
	
	main();
})();
