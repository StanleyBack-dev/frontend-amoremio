import { Router } from "express";
import { getAuthContext } from "../../shared/auth/get-user-id.js";
import { buildErrorResponse } from "../../shared/http/error-response.js";
import { HttpError } from "../../shared/http/http-error.js";
import { executeGraphql } from "../../shared/http/graphql-client.js";
import { GET_FINANCE_DASHBOARD_QUERY } from "./queries.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const data = await executeGraphql({
      query: GET_FINANCE_DASHBOARD_QUERY,
      variables: {
        input: {
          idStore: req.query.idStore,
          from: req.query.from || undefined,
          to: req.query.to || undefined,
        },
      },
      requestId: req.requestId,
      ...getAuthContext(req),
    });

    if (!data.getFinanceDashboard) {
      throw new HttpError(502, "Invalid dashboard response.");
    }
    res.json(data.getFinanceDashboard);
  } catch (error) {
    const { statusCode, body } = buildErrorResponse(error);
    res.status(statusCode).json(body);
  }
});

export default router;
