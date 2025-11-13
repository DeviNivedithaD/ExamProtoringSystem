export function detectTabSwitch(onWarn) {
  window.addEventListener("blur", () => onWarn());
}

export function detectCopyPaste(onWarn) {
  document.addEventListener("copy", onWarn);
  document.addEventListener("paste", onWarn);
}
