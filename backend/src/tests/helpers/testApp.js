let appInstancePromise;

const getTestApp = async () => {
  if (!appInstancePromise) {
    appInstancePromise = import("../../app.js").then(({ createApp }) =>
      createApp({
        sessionMiddleware: null,
        passportEnabled: false,
        loggerEnabled: false,
        corsDebugLogs: false,
      }),
    );
  }

  return appInstancePromise;
};

export { getTestApp };
