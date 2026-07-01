(() => {
	"use strict";
	
	const RESULT_CHANNEL = "grindr-google-oauth:result";
	const START_CHANNEL = "grindr-google-oauth:start";
	
	const postResult = (payload) => {
		try {
			window.postMessage(
				{ channel: RESULT_CHANNEL, ...payload },
				location.origin,
			);
		} catch {}
	};
	
	const isAwaitingUserGesture = (message) =>
		/popup|gesture|user activation|interact/i.test(message);
	
	const gis = () => window.__grindrGis;
	
	let prepared = false;
	let loading = false;
	let running = false;
	
	const preload = () => {
		if (prepared || loading || !gis()) return;
		loading = true;
		postResult({ phase: "loading" });
		gis()
		.loadGisSdk()
		.then(
			() => {
				loading = false;
				prepared = true;
				postResult({ phase: "ready" });
			},
			(error) => {
				loading = false;
				postResult({ error: String(error?.message || error) });
			},
		);
	};
	
	const requestToken = async () => {
		if (running) return;
		if (!gis()) {
			postResult({ error: "GIS core not loaded" });
			return;
		}
		running = true;
		postResult({ phase: "signing-in" });
		try {
			const token = await gis().requestAccessToken();
			postResult({ token });
		} catch (error) {
			const message = String(error?.message || error);
			running = false;
			if (isAwaitingUserGesture(message)) {
				postResult({ phase: "ready" });
				return;
			}
			postResult({ error: message });
		}
	};
	
	preload();
	
	const isStartMessage = (event) =>
		event.source === window &&
	event.origin === location.origin &&
	event.data?.channel === START_CHANNEL;
	
	window.addEventListener("message", (event) => {
		if (isStartMessage(event)) requestToken();
	});
	
	const onButtonClick = (event) => {
		if (running || !event.isTrusted) return;
		if (!event.target?.closest?.(".grindr-oauth-button")) return;
		if (prepared) requestToken();
		else preload();
	};
	window.addEventListener("click", onButtonClick, true);
})();
