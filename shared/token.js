(() => {
	"use strict";
	
	const decode = (value) => {
		try {
			return decodeURIComponent(value);
		} catch {
			return "";
		}
	};
	
	const token = decode(location.hash.slice(1));
	
	history.replaceState(null, "", location.pathname);
	if (token) {
		document.getElementById("token").textContent = token;
	}
})();
