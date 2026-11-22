type NoRequestData = Readonly<{
  userInfo: false;
  cookies: false;
  httpHeaders: false;
  httpBodies: never[];
  urlQueryParams: false;
  databaseQueryData: false;
  stackFrameVariables: false;
}>;

// Sentry attaches request bodies, the client IP and query strings by default, which would send
// passwords, emails and message text. An error report carries the stack, operation and request id.
export const noRequestData: NoRequestData = {
  userInfo: false,
  cookies: false,
  httpHeaders: false,
  httpBodies: [],
  urlQueryParams: false,
  databaseQueryData: false,
  stackFrameVariables: false,
};
