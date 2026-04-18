export function notFoundHandler(_req, res, _next) {
  res.status(404).json({ message: "Route not found" });
}

export function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export function errorHandler(err, _req, res, _next) {
  const status = Number(err?.status) || 500;
  const message = err?.message || "Internal server error";

  if (status >= 500) {
    console.error("[backend:error]", err);
  }

  res.status(status).json({ message });
}
