// Preserve the observed source URL. Unknown sources and all application failures fail.
const LIVE_BASE='https://middleages.github.io/my-books/';
const HOST_FAVICON='https://middleages.github.io/favicon.ico';
function classifyDiagnostic(entry,base){
  const observed=entry.url||entry.source;
  const known=base===LIVE_BASE && observed===HOST_FAVICON &&
    ((entry.type==='response'&&entry.status===404)||
     (entry.type==='console'&&/^Failed to load resource: the server responded with a status of 404(?: \([^)]*\))?$/.test(entry.message)));
  return {...entry,kind:known?'host-default-favicon-404':'application'};
}
module.exports={classifyDiagnostic};
