import { HttpError } from "../utils/http-error.js";

/**
 * Validate and replace req.body / req.params / req.query with parsed data.
 * Usage: validate({ body: schema, params: schema })
 */
export function validate(schemas) {
  return (req, _res, next) => {
    for (const [part, schema] of Object.entries(schemas)) {
      const result = schema.safeParse(req[part]);
      if (!result.success) {
        const issue = result.error.issues[0];
        const path = issue.path.length ? `${issue.path.join(".")}: ` : "";
        return next(new HttpError(422, `${path}${issue.message}`, result.error.issues));
      }
      // Express 5 exposes req.query via a getter, so store parsed values separately.
      req.valid = { ...req.valid, [part]: result.data };
    }
    next();
  };
}
