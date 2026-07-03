(() => {
	"use strict";
	
	const api = typeof browser !== "undefined" ? browser : chrome;
	const SIGN_IN_URL = "https://web.grindr.com/";
	const NATIVE_APP = "grindr_google_oauth";
	const ARMED_KEY = "armedTabs";
	
	const sessionStore = api.storage?.session ?? null;
	const armedMemory = new Set();
	
	let queue = Promise.resolve();
	const serialize = (task) => {
		const result = queue.then(task, task);
		queue = result.then(
			() => {},
			() => {},
		);
		return result;
	};
	
	const armed = {
		add(tabId) {
			return serialize(async () => {
				if (!sessionStore) return void armedMemory.add(tabId);
				const { [ARMED_KEY]: ids = [] } = await sessionStore.get(ARMED_KEY);
				if (!ids.includes(tabId)) {
					await sessionStore.set({ [ARMED_KEY]: [...ids, tabId] });
				}
			});
		},
		has(tabId) {
			return serialize(async () => {
				if (!sessionStore) return armedMemory.has(tabId);
				const { [ARMED_KEY]: ids = [] } = await sessionStore.get(ARMED_KEY);
				return ids.includes(tabId);
			});
		},
		delete(tabId) {
			return serialize(async () => {
				if (!sessionStore) return void armedMemory.delete(tabId);
				const { [ARMED_KEY]: ids = [] } = await sessionStore.get(ARMED_KEY);
				await sessionStore.set({
					[ARMED_KEY]: ids.filter((id) => id !== tabId),
				});
			});
		},
	};
	
	const isCompanion = () =>
		(api.runtime.getManifest().permissions || []).includes("nativeMessaging");
	
	const sendToNativeApp = async (payload) => {
		try {
			await api.runtime.sendNativeMessage(NATIVE_APP, payload);
		} catch (error) {
			console.error("[grindr-google-oauth] native message failed", error);
		}
	};
	
	const openSignInTab = async () => {
		const tab = await api.tabs.create({ url: "about:blank" });
		if (tab?.id == null) return;
		await armed.add(tab.id);
		await api.tabs.update(tab.id, { url: SIGN_IN_URL });
	};
	
	const handleToken = async (tabId, token) => {
		if (tabId != null) await armed.delete(tabId);
		if (isCompanion()) {
			await sendToNativeApp({ type: "token", token });
			return {};
		}
		if (tabId != null) {
			const url = `${api.runtime.getURL("shared/token.html")}#${encodeURIComponent(token)}`;
			await api.tabs.update(tabId, { url });
		}
		return {};
	};
	
	const handleError = async (error) => {
		console.error("[grindr-google-oauth]", error);
		if (isCompanion()) await sendToNativeApp({ type: "error", error });
		return {};
	};
	
	const actionApi = api.action || api.browserAction;
	if (actionApi?.onClicked) {
		actionApi.onClicked.addListener(openSignInTab);
	}
	
	if (api.tabs?.onRemoved) {
		api.tabs.onRemoved.addListener((tabId) => {
			armed.delete(tabId);
		});
	}
	
	api.runtime.onMessage.addListener((message, sender, sendResponse) => {
		const tabId = sender?.tab?.id;
		switch (message?.type) {
			case "ready":
			(async () => {
				sendResponse({
					armed: tabId != null && (await armed.has(tabId)),
				});
			})();
			return true;
			case "token":
			handleToken(tabId, message.token).then(sendResponse);
			return true;
			case "error":
			handleError(message.error).then(sendResponse);
			return true;
			default:
			return undefined;
		}
	});
})();
