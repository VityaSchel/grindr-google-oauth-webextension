(() => {
	"use strict";

	const COPIED_RESET_MS = 2500;

	const byId = (id) => document.getElementById(id);
	const field = byId("token");
	const status = byId("token-status");
	const copyButton = byId("token-copy");

	const decode = (value) => {
		try {
			return decodeURIComponent(value);
		} catch {
			return "";
		}
	};

	const token = decode(location.hash.slice(1));
	try {
		history.replaceState(null, "", location.pathname);
	} catch {
		location.hash = "";
	}

	if (!token) {
		byId("token-label").textContent = "No token here";
		field.hidden = true;
		copyButton.hidden = true;
		byId("token-notes").hidden = true;
		status.textContent = "Run the sign-in again.";
		return;
	}

	field.textContent = token;

	const selectToken = () => {
		const range = document.createRange();
		range.selectNodeContents(field);
		const selection = getSelection();
		selection.removeAllRanges();
		selection.addRange(range);
	};

	let resetTimer = 0;

	const onCopied = () => {
		clearTimeout(resetTimer);
		status.classList.remove("is-error");
		copyButton.textContent = "Copied";
		status.textContent = "Full token copied to your clipboard.";
		resetTimer = setTimeout(() => {
			copyButton.textContent = "Copy token";
		}, COPIED_RESET_MS);
	};

	const onCopyFailed = () => {
		clearTimeout(resetTimer);
		copyButton.textContent = "Copy token";
		status.classList.add("is-error");
		status.textContent =
			"Couldn't reach the clipboard. Tap the token, then copy it.";
		selectToken();
	};

	const copyFromSelection = () => {
		selectToken();
		try {
			return document.execCommand("copy");
		} catch {
			return false;
		}
	};

	const settle = (copied) => (copied ? onCopied() : onCopyFailed());

	copyButton.addEventListener("click", () => {
		if (!navigator.clipboard?.writeText) {
			settle(copyFromSelection());
			return;
		}
		navigator.clipboard
			.writeText(token)
			.then(onCopied, () => settle(copyFromSelection()));
	});
})();
