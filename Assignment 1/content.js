let scamKeywords = [
  "free", "urgent", "act now", "credit card", "password", "account suspended", "click here",
  "verify now", "bank verification", "limited offer", "login to claim", "reset your password"
];

let scamDomains = [
  "000webhostapp.com", "weebly.com", "freewebs.com", "tk", "ml", "ga", "scam-site.com"
];

let results = {
  foundKeywords: [],
  suspiciousForm: false,
  suspiciousURL: false
};


fetch(chrome.runtime.getURL("scam_db.json"))
  .then(res => res.json())
  .then(data => {
    if (data.keywords) scamKeywords = data.keywords;
    if (data.domains) scamDomains = data.domains;
  })
  .catch(err => {
    console.warn("Failed to load scam_db.json, using static list only.");
  });


function scanForScam() {
  const textContent = document.body.innerText.toLowerCase();
  scamKeywords.forEach(word => {
    if (textContent.includes(word) && !results.foundKeywords.includes(word)) {
      results.foundKeywords.push(word);
    }
  });
}


function scanForms() {
  const forms = document.querySelectorAll("form");
  forms.forEach(form => {
    const inputs = form.querySelectorAll("input");
    inputs.forEach(input => {
      const type = input.getAttribute("type") || "";
      const name = input.getAttribute("name")?.toLowerCase() || "";
      if (["password", "credit", "card", "cvv", "security"].some(k => type.includes(k) || name.includes(k))) {
        results.suspiciousForm = true;
      }
    });
  });
}


function checkURL() {
  const currentURL = window.location.href;
  results.suspiciousURL = scamDomains.some(domain => currentURL.includes(domain));
}


function showWarning() {
  if (results.foundKeywords.length || results.suspiciousForm || results.suspiciousURL) {
    const banner = document.createElement("div");
    banner.innerText = "⚠️ This page may be a scam!";
    banner.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0;
      background: red; color: white;
      padding: 10px; text-align: center; z-index: 9999;
    `;
    document.body.prepend(banner);
  }
}


const observer = new MutationObserver(() => {
  scanForScam();
  scanForms();
});
observer.observe(document.body, { childList: true, subtree: true });


scanForScam();
scanForms();
checkURL();


chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg === "getScanResults") {
    showWarning();
    sendResponse(results);
  }
});


