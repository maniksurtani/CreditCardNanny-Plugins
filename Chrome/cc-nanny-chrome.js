const pluginFlavour = "Chrome";
const loggingEnabled = false;
function debug(msg) {
  if (loggingEnabled) console.log(msg);
}

function getStorage() {
  return localStorage;
}