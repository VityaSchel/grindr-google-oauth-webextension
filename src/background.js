(() => {
	"use strict";

	const api = typeof browser !== "undefined" ? browser : chrome;
	const HELPER_URL = "https://web.grindr.com/";
	const NATIVE_APP = "grindr_google_oauth";

	const armedTabs = new Set();

	const runningOnAndroid = async () => {
		try {
			return (await api.runtime.getPlatformInfo()).os === "android";
		} catch {
			return false;
		}
	};

	const sendToNativeApp = async (payload) => {
		try {
			await api.runtime.sendNativeMessage(NATIVE_APP, payload);
		} catch (error) {
			console.error("[grindr-google-oauth] native message failed", error);
		}
	};

	const openSignInTab = async () => {
		const tab = await api.tabs.create({ url: HELPER_URL });
		if (tab?.id != null) armedTabs.add(tab.id);
	};

	const shouldStart = async (tabId) =>
		(await runningOnAndroid()) || armedTabs.has(tabId);

	const handleToken = async (tabId, token) => {
		armedTabs.delete(tabId);
		if (await runningOnAndroid()) {
			await sendToNativeApp({ type: "token", token });
			return { render: false };
		}
		return { render: true };
	};

	const handleError = async (error) => {
		console.error("[grindr-google-oauth]", error);
		if (await runningOnAndroid()) await sendToNativeApp({ type: "error", error });
		return {};
	};

	if (api.browserAction?.onClicked) {
		api.browserAction.onClicked.addListener(openSignInTab);
	}

	api.runtime.onMessage.addListener((message, sender) => {
		const tabId = sender?.tab?.id;
		switch (message?.type) {
			case "ready":
				return shouldStart(tabId).then((start) => ({ start }));
			case "token":
				return handleToken(tabId, message.token);
			case "error":
				return handleError(message.error);
			default:
				return undefined;
		}
	});
})();
