import { fail } from "../utils/http.js";
import { requireBranchUser } from "../services/admin.service.js";

export async function requireBranchAuth(req, res, next) {
  try {
    const { account } = await requireBranchUser(req.user.id);
    req.branch = { id: account.id, branchType: account.branch_type, userId: req.user.id };
    next();
  } catch (err) {
    fail(res, err.message, err.status || 403);
  }
}
