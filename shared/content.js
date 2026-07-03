(() => {
	"use strict";
	
	const api = typeof browser !== "undefined" ? browser : chrome;
	const RESULT_CHANNEL = "grindr-google-oauth:result";
	const PAGE_SCRIPTS = ["shared/gis-core.js", "shared/page-runner.js"];
	
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
		window.__grindrOauthUi.setPhase("failed");
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
			window.__grindrOauthUi.setPhase(phase);
			return;
		}
		if (handled) return;
		if (token) handleToken(token);
		else if (error) showError(error);
	});
	
	const runDesktop = async () => {
		window.stop();
		const head = document.createElement("head");
		const viewport = document.createElement("meta");
		viewport.name = "viewport";
		viewport.content = "width=device-width, initial-scale=1";
		head.append(viewport);
		document.documentElement.replaceChildren(head, document.createElement("body"));
		window.__grindrOauthUi.mount();
		try {
			await injectPageScripts();
		} catch (error) {
			showError(String(error?.message || error));
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
			await runDesktop();
			return;
		}
		let armed = false;
		try {
			armed = Boolean(
				(await api.runtime.sendMessage({ type: "ready" }))?.armed,
			);
		} catch {}
		if (armed) {
			await runDesktop();
		}
	};
	
	main();
})();
