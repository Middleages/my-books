// One observed host-default resource is not an application asset. Keep it visible.
// Do not exempt an app path, a different origin/status, or an error merely mentioning favicon.
function classifyConsoleError(entry, base) {
  const knownHostDefault = base === "https://middleages.github.io/my-books/"
    && entry.source === "https://middleages.github.io/favicon.ico"
    && /^Failed to load resource: the server responded with a status of 404(?: \([^)]*\))?$/.test(entry.message);
  return { ...entry, kind: knownHostDefault ? "host-default-favicon-404" : "application" };
}
module.exports = { classifyConsoleError };
