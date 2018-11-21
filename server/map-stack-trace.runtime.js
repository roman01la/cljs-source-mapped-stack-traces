let onError;

function onMappedError(fn) {
  onError = fn;
}

function mapStackTrace(data) {
  __cljssm = data;
  return fetch("http://localhost:{PORT}/map-stack-trace", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data })
  })
    .then(r => r.json())
    .then(({ data: { stack, message } }) =>
      onError({ message, __stack: stack })
    )
    .catch(console.error);
}
