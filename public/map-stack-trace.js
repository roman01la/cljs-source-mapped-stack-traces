const worker = new Worker("/map-stack-trace.worker.js");

let onError;

worker.addEventListener("message", event => {
  const { stack, message } = event.data;
  const error = { message, __stack: stack };

  onError(error);
});

function mapStackTrace(obj) {
  __cljssm = obj;
  worker.postMessage(obj);
}

function onMappedError(fn) {
  onError = fn;
}
