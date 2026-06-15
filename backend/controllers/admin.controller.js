import {
  requireAdminUser,
  getDashboardStats,
  listAllActivity,
  createBranchAccount,
  listBranchAccounts,
  getBranchShipments,
  verifyBranchCode,
  listWarehousesAdmin,
  getWarehouseAdminDetail,
  assignWarehouseStaff,
  createWarehouseRecord,
  getOverviewAnalytics,
  logAdminLogin,
  listAdminLogins,
  deleteUserAccount,
} from "../services/admin.service.js";
import { ok, fail, asyncHandler } from "../utils/http.js";

export const dashboard = asyncHandler(async (req, res) => {
  const admin = await requireAdminUser(req.user.id);
  await logAdminLogin(admin.id, admin.email);
  const [stats, analytics, logins] = await Promise.all([
    getDashboardStats(),
    getOverviewAnalytics(),
    listAdminLogins(8),
  ]);
  return ok(res, { stats, analytics, logins });
});

export const activity = asyncHandler(async (req, res) => {
  await requireAdminUser(req.user.id);
  const data = await listAllActivity();
  return ok(res, data);
});

export const deleteUser = asyncHandler(async (req, res) => {
  const admin = await requireAdminUser(req.user.id);
  const result = await deleteUserAccount(admin.id, req.params.id);
  return ok(res, result);
});

export const branches = asyncHandler(async (req, res) => {
  await requireAdminUser(req.user.id);
  return ok(res, { branches: await listBranchAccounts() });
});

export const createBranch = asyncHandler(async (req, res) => {
  await requireAdminUser(req.user.id);
  const { email, password, branchName, branchType, warehouseId, contactPhone } = req.body || {};
  if (!email || !password || !branchName) return fail(res, "E-posta, şifre ve şube adı gerekli.", 422);
  const result = await createBranchAccount({
    email,
    password,
    branchName,
    branchType,
    warehouseId,
    contactPhone,
    createdBy: req.user.id,
  });
  return ok(res, result);
});

export const branchDashboard = asyncHandler(async (req, res) => {
  const data = await getBranchShipments(req.branch.id);
  return ok(res, data);
});

export const branchVerify = asyncHandler(async (req, res) => {
  const { referenceId, code, action } = req.body || {};
  if (!referenceId || !code || !action) return fail(res, "Eksik alan.", 422);
  const result = await verifyBranchCode({
    accountId: req.branch.id,
    referenceId,
    code,
    action,
  });
  return ok(res, result);
});

export const warehouses = asyncHandler(async (req, res) => {
  await requireAdminUser(req.user.id);
  return ok(res, { warehouses: await listWarehousesAdmin() });
});

export const warehouseDetail = asyncHandler(async (req, res) => {
  await requireAdminUser(req.user.id);
  const data = await getWarehouseAdminDetail(req.params.id);
  return ok(res, data);
});

export const warehouseStaff = asyncHandler(async (req, res) => {
  await requireAdminUser(req.user.id);
  const { email, password, branchName, warehouseId } = req.body || {};
  if (!email || !password || !warehouseId) {
    return fail(res, "E-posta, şifre ve depo ID gerekli.", 422);
  }
  const result = await assignWarehouseStaff({
    email,
    password,
    branchName,
    warehouseId,
    createdBy: req.user.id,
  });
  return ok(res, result, 201);
});

export const createWarehouse = asyncHandler(async (req, res) => {
  await requireAdminUser(req.user.id);
  const warehouse = await createWarehouseRecord(req.body || {});
  return ok(res, { warehouse }, 201);
});
