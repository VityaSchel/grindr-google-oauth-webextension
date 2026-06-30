(() => {
	"use strict";

	const api = typeof browser !== "undefined" ? browser : chrome;
	const RESULT_CHANNEL = "grindr-google-oauth:result";
	const START_CHANNEL = "grindr-google-oauth:start";
	const PAGE_SCRIPTS = ["shared/gis-core.js", "src/page-runner.js"];

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

	const renderTokenPage = (token) => {
		const body = document.body || document.documentElement;
		while (body.firstChild) body.removeChild(body.firstChild);
		const block = document.createElement("pre");
		block.style.cssText =
			"margin:0;padding:16px;font:13px/1.5 ui-monospace,monospace;white-space:pre-wrap;word-break:break-all";
		block.textContent = token;
		body.appendChild(block);
	};

	let handled = false;

	const handleToken = async (token) => {
		handled = true;
		try {
			const reply = await api.runtime.sendMessage({ type: "token", token });
			if (reply?.render) renderTokenPage(token);
		} catch {
			renderTokenPage(token);
		}
	};

	const reportError = (error) => {
		api.runtime.sendMessage({ type: "error", error }).catch(() => {});
	};

	const isResultMessage = (event) =>
		event.source === window &&
		event.origin === location.origin &&
		event.data?.channel === RESULT_CHANNEL;

	window.addEventListener("message", (event) => {
		if (handled || !isResultMessage(event)) return;
		const { token, error } = event.data;
		if (token) handleToken(token);
		else if (error) reportError(error);
	});

	const start = async () => {
		try {
			for (const path of PAGE_SCRIPTS) await injectPageScript(path);
			const reply = await api.runtime.sendMessage({ type: "ready" });
			if (reply?.start) {
				window.postMessage({ channel: START_CHANNEL }, location.origin);
			}
		} catch (error) {
			reportError(String(error?.message || error));
		}
	};

	start();
})();
