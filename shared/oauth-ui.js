(() => {
	"use strict";

	if (window.__grindrOauthUi) return;

	let buttonEl = null;
	let errorEl = null;

	const mount = () => {
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

		errorEl = document.createElement("p");
		errorEl.className = "grindr-oauth-error";
		errorEl.setAttribute("role", "alert");
		errorEl.hidden = true;

		card.append(buttonEl, errorEl);
		overlay.append(card);
		document.documentElement.append(overlay);
	};

	const setError = (message) => {
		if (!errorEl) return;
		errorEl.textContent = message || "";
		errorEl.hidden = !message;
	};

	const setPhase = (phase) => {
		if (!buttonEl) return;
		if (phase !== "failed") setError("");
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
		} else if (phase === "failed") {
			buttonEl.disabled = false;
			buttonEl.textContent = "Try again";
		}
	};

	window.__grindrOauthUi = { mount, setError, setPhase };
})();
