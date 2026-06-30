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

	let running = false;
	const requestToken = async () => {
		if (running) return;
		running = true;
		try {
			if (!window.__grindrGis) throw new Error("GIS core not loaded");
			const token = await window.__grindrGis.requestAccessToken();
			postResult({ token });
		} catch (error) {
			const message = String(error?.message || error);
			running = false;
			if (isAwaitingUserGesture(message)) return;
			postResult({ error: message });
		}
	};

	const isStartMessage = (event) =>
		event.source === window &&
		event.origin === location.origin &&
		event.data?.channel === START_CHANNEL;

	window.addEventListener("message", (event) => {
		if (isStartMessage(event)) requestToken();
	});

	const requestTokenOnGesture = () => {
		if (!running) requestToken();
	};
	window.addEventListener("click", requestTokenOnGesture, true);
	window.addEventListener("keydown", requestTokenOnGesture, true);
})();
