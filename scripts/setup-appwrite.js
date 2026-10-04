/**
 * Chess Arena — Appwrite provisioning script (IDEMPOTENT)
 *
 * Tự tạo / kiểm tra toàn bộ Database + Collections + Attributes + Indexes +
 * Permissions mà hệ thống online của Chess Arena cần. Chạy lại nhiều lần an toàn:
 * resource đã tồn tại sẽ được bỏ qua (skip), KHÔNG xóa/sửa document nào.
 *
 * Cấu hình qua environment variables (SERVER/SCRIPT ONLY — không commit):
 *   APPWRITE_ENDPOINT     ví dụ https://sgp.cloud.appwrite.io/v1
 *   APPWRITE_PROJECT_ID   Project ID trong Appwrite Console
 *   APPWRITE_API_KEY      API key với scopes: databases/collections/attributes/
 *                         indexes (read + write) — Console → Integrations → API Keys
 *
 * Chạy:  node scripts/setup-appwrite.js
 * Hoặc:  node --env-file=.env scripts/setup-appwrite.js
 */

const sdk = require("node-appwrite");

const ENDPOINT = process.env.APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;
/** Mặc định 'chess-arena' — có thể trỏ sang database có sẵn nếu gói hết quota:
 *  APPWRITE_DATABASE_ID=<database-id> (xem fallback ở ensureDatabase) */
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || "chess-arena";

const MAX_ATTRIBUTE_RETRIES = 30;
const ATTRIBUTE_POLL_DELAY_MS = 2000;

const RULES_TEXT = {
  rooms: [
    ["code", "string", 8, ""],
    ["status", "string", 16, ""],
    ["timeMinutes", "integer", 0],
    ["whitePlayerId", "string", 64, ""],
    ["whitePlayerName", "string", 32, ""],
    ["blackPlayerId", "string", 64, ""],
    ["blackPlayerName", "string", 32, ""],
    ["whiteMs", "integer", 0],
    ["blackMs", "integer", 0],
    ["turnStartedAt", "integer", 0],
    ["turn", "string", 8, "white"],
    ["gameNumber", "integer", 1],
    ["winner", "string", 16, ""],
    ["resultReason", "string", 32, ""],
    ["drawOfferedBy", "string", 64, ""],
    ["rematchOfferedBy", "string", 64, ""],
    ["whiteLastSeenAt", "integer", 0],
    ["blackLastSeenAt", "integer", 0],
  ],
  moves: [
    ["roomId", "string", 64, ""],
    ["gameNumber", "integer", 1],
    ["ply", "integer", 0],
    ["userId", "string", 64, ""],
    ["color", "string", 8, ""],
    ["from", "string", 8, ""],
    ["to", "string", 8, ""],
    ["promotion", "string", 4, ""],
  ],
  messages: [
    ["roomId", "string", 64, ""],
    ["userId", "string", 64, ""],
    ["name", "string", 32, ""],
    ["text", "string", 200, ""],
    ["sentAt", "integer", 0],
  ],
};

const INDEX_RULES = {
  rooms: [{ key: "code", type: "unique", attributes: ["code"], orders: ["ASC"] }],
  moves: [
    {
      key: "moves-by-room",
      type: "key",
      attributes: ["roomId", "gameNumber", "ply"],
      orders: ["ASC", "ASC", "ASC"],
    },
  ],
  messages: [
    {
      key: "messages-by-room",
      type: "key",
      attributes: ["roomId", "sentAt"],
      orders: ["ASC", "ASC"],
    },
  ],
};

const COLLECTION_PERMISSIONS = [
  sdk.Permission.create(sdk.Role.users()),
  sdk.Permission.read(sdk.Role.users()),
  sdk.Permission.update(sdk.Role.users()),
  sdk.Permission.delete(sdk.Role.users()),
];

// ---------- output helpers ----------

const line = (text = "") => console.log(text);
const ok = (text) => console.log(`✓ ${text}`);
const info = (text) => console.log(`ℹ Already exists — ${text}`);
const fail = (text) => console.error(`✗ ${text}`);

function isAlreadyExists(error) {
  return error && (error.code === 409 || String(error.message).toLowerCase().includes("already"));
}

function isNotFound(error) {
  return error && error.code === 404;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------- steps ----------

function checkConfiguration() {
  line("Checking configuration...");
  const entries = [
    ["Endpoint", ENDPOINT],
    ["Project ID", PROJECT_ID],
    ["API Key", API_KEY ? `${API_KEY.slice(0, 4)}…${API_KEY.slice(-4)}` : undefined],
    ["Database ID", `${DATABASE_ID}${process.env.APPWRITE_DATABASE_ID ? "" : " (mặc định)"}`],
  ];
  let missing = false;
  for (const [name, value] of entries) {
    if (value) {
      ok(name);
    } else {
      fail(`${name} — thiếu biến môi trường`);
      missing = true;
    }
  }
  if (missing) {
    line();
    line("Thiết lập biến môi trường rồi chạy lại:");
    line("");
    line("PowerShell:");
    line('  $env:APPWRITE_ENDPOINT="https://YOUR_REGION.cloud.appwrite.io/v1"');
    line('  $env:APPWRITE_PROJECT_ID="YOUR_PROJECT_ID"');
    line('  $env:APPWRITE_API_KEY="YOUR_API_KEY"');
    line("  node scripts/setup-appwrite.js");
    line("");
    line("Git Bash / Linux / macOS:");
    line('  export APPWRITE_ENDPOINT="https://YOUR_REGION.cloud.appwrite.io/v1"');
    line('  export APPWRITE_PROJECT_ID="YOUR_PROJECT_ID"');
    line('  export APPWRITE_API_KEY="YOUR_API_KEY"');
    line("  node scripts/setup-appwrite.js");
    line("");
    line(
      "API Key tạo tại Appwrite Console → Integrations → API Keys — tick đủ scopes: databases, collections, attributes, indexes (read + write).",
    );
    line("KHÔNG đặt key vào biến VITE_* và KHÔNG commit key lên Git.");
    return false;
  }
  return true;
}

function isPlanLimit(error) {
  return /maximum number of databases/i.test(String(error?.message ?? ""));
}

/** 403 plan-limit: liệt kê database có sẵn + hướng dẫn 3 lựa chọn, rồi dừng */
async function printDatabaseFallbackGuidance(databases, error) {
  fail(`Không tạo được database: ${error.message}`);
  line("");
  try {
    const list = await databases.list();
    const existing = list.databases;
    if (existing.length > 0) {
      line("Các database đã có trong project này (có thể tái sử dụng):");
      for (const db of existing) {
        line(`  • ${db.$id}  (${db.name})`);
      }
      line("");
      line("Lựa chọn A — tái sử dụng 1 database ở trên (nhanh nhất):");
      line(`  $env:APPWRITE_DATABASE_ID="<database-id-ở-trên>"`);
      line("  node scripts/setup-appwrite.js");
      line("  (collections rooms/moves/messages sẽ được tạo trong database đó)");
    }
  } catch {
    line("(Không liệt kê được database — kiểm tra quyền API key)");
  }
  line("");
  line("Lựa chọn B — Appwrite Console → Databases: xoá 1 database KHÔNG dùng để free slot.");
  line("Lựa chọn C — tạo Organization mới (miễn phí) → Project mới → API key mới → chạy lại.");
  line("");
  line("Sau khi chọn xong: đặt APPWRITE_DATABASE_ID tương ứng (nếu cần) và chạy lại script.");
}

async function ensureDatabase(databases) {
  try {
    await databases.get(DATABASE_ID);
    info(`Database ${DATABASE_ID}`);
    return;
  } catch (error) {
    if (!isNotFound(error)) {
      if (isPlanLimit(error)) {
        await printDatabaseFallbackGuidance(databases, error);
        process.exit(1);
      }
      throw error;
    }
  }

  try {
    await databases.create(DATABASE_ID, DATABASE_ID);
    ok(`Database ${DATABASE_ID}`);
  } catch (error) {
    if (isPlanLimit(error)) {
      await printDatabaseFallbackGuidance(databases, error);
      process.exit(1);
    }
    throw error;
  }
}

async function ensureCollection(databases, collectionId) {
  try {
    const existing = await databases.getCollection(DATABASE_ID, collectionId);
    // Bảo đảm permissions + documentSecurity đúng như thiết kế (idempotent)
    await databases.updateCollection(DATABASE_ID, collectionId, collectionId, {
      permissions: COLLECTION_PERMISSIONS,
      documentSecurity: true,
    });
    if (
      JSON.stringify(existing.permissions) !== JSON.stringify(COLLECTION_PERMISSIONS)
    ) {
      ok(`${collectionId} (permissions cập nhật)`);
    } else {
      info(`Collection ${collectionId}`);
    }
  } catch (error) {
    if (!isNotFound(error)) throw error;
    await databases.createCollection(
      DATABASE_ID,
      collectionId,
      collectionId,
      COLLECTION_PERMISSIONS,
      true, // documentSecurity — cho phép document-level permissions trên moves/messages
    );
    ok(`${collectionId}`);
  }
}

async function ensureAttributes(databases, collectionId) {
  const collection = await databases.getCollection(DATABASE_ID, collectionId);
  const existingKeys = new Set(collection.attributes.map((attribute) => attribute.key));

  for (const [key, type, sizeOrDefault, defaultValue] of RULES_TEXT[collectionId]) {
    if (existingKeys.has(key)) {
      info(`${key}`);
      continue;
    }
    try {
      if (type === "string") {
        await databases.createStringAttribute(
          DATABASE_ID,
          collectionId,
          key,
          sizeOrDefault,
          false, // required = false để Appwrite áp dụng default (xem ghi chú trong report)
          defaultValue,
        );
      } else {
        await databases.createIntegerAttribute(
          DATABASE_ID,
          collectionId,
          key,
          false, // required = false + default
          undefined,
          undefined,
          sizeOrDefault,
        );
      }
      ok(key);
    } catch (error) {
      if (isAlreadyExists(error)) {
        info(key);
        continue;
      }
      throw error;
    }
  }

  await waitForAttributesAvailable(databases, collectionId);
}

async function waitForAttributesAvailable(databases, collectionId) {
  const targetKeys = RULES_TEXT[collectionId].map(([key]) => key);

  for (let attempt = 1; attempt <= MAX_ATTRIBUTE_RETRIES; attempt++) {
    const collection = await databases.getCollection(DATABASE_ID, collectionId);
    const statuses = new Map(collection.attributes.map((attribute) => [attribute.key, attribute.status]));

    const notReady = targetKeys.filter((key) => statuses.get(key) !== "available");
    const broken = notReady.filter((key) => ["stuck", "failed"].includes(statuses.get(key) ?? ""));

    if (broken.length > 0) {
      fail(`Attributes ở trạng thái lỗi: ${broken.join(", ")}`);
      throw new Error(`Attribute processing failed trên ${collectionId}: ${broken.join(", ")}`);
    }

    if (notReady.length === 0) {
      if (attempt > 1) ok(`tất cả attributes available (sau ${attempt} lần poll)`);
      return;
    }

    await sleep(ATTRIBUTE_POLL_DELAY_MS);
  }

  const collection = await databases.getCollection(DATABASE_ID, collectionId);
  const pending = targetKeys.filter((key) => {
    const attribute = collection.attributes.find((a) => a.key === key);
    return attribute && attribute.status !== "available";
  });
  fail(`Timeout chờ attributes của ${collectionId}: ${pending.join(", ")}`);
  throw new Error(`Attributes chưa available sau ${MAX_ATTRIBUTE_RETRIES} lần poll`);
}

async function ensureIndexes(databases, collectionId) {
  const collection = await databases.getCollection(DATABASE_ID, collectionId);
  const existingIndexKeys = new Set(collection.indexes.map((index) => index.key));

  for (const rule of INDEX_RULES[collectionId]) {
    if (existingIndexKeys.has(rule.key)) {
      info(`Index: ${rule.key}`);
      continue;
    }
    try {
      await databases.createIndex(
        DATABASE_ID,
        collectionId,
        rule.key,
        rule.type,
        rule.attributes,
        rule.orders,
      );
      ok(`Index: ${rule.key}${rule.type === "unique" ? " (unique)" : ""}`);
    } catch (error) {
      if (isAlreadyExists(error)) {
        info(`Index: ${rule.key}`);
        continue;
      }
      throw error;
    }
  }
}

// ---------- main ----------

async function main() {
  line("========================================");
  line("CHESS ARENA - APPWRITE SETUP");
  line("========================================");
  line("");

  if (!checkConfiguration()) {
    line("");
    line("========================================");
    console.error("APPWRITE_SETUP_COMPLETE = NO");
    line("========================================");
    process.exit(1);
  }
  line("");

  const client = new sdk.Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);
  const databases = new sdk.Databases(client);

  line("Database");
  await ensureDatabase(databases);
  line("");

  line("Collections");
  for (const collectionId of ["rooms", "moves", "messages"]) {
    await ensureCollection(databases, collectionId);
  }
  line("");

  for (const collectionId of ["rooms", "moves", "messages"]) {
    line(collectionId);
    await ensureAttributes(databases, collectionId);
    line("");
    await ensureIndexes(databases, collectionId);
    line("");
  }

  line("========================================");
  line("APPWRITE SETUP COMPLETED");
  line("========================================");
  line("");
  line("Bước tiếp theo: điền các biến VITE_APPWRITE_* vào client/.env");
  line("(local) và Vercel Environment Variables (production) — xem APPWRITE_SETUP.md.");
}

/** Scopes mà API key cần để provision toàn bộ database */
const REQUIRED_SCOPES = [
  "databases.read",
  "databases.write",
  "collections.read",
  "collections.write",
  "attributes.read",
  "attributes.write",
  "indexes.read",
  "indexes.write",
];

main().catch((error) => {
  line("");
  const message = String(error?.message ?? "");

  if (/missing scopes/i.test(message)) {
    fail("API Key đang thiếu scopes:");
    const missing = message.match(/\[(["a-z.,\s-]+)\]/i)?.[1]?.replace(/"/g, "") ?? message;
    line(`    ${missing.trim()}`);
    line("");
    line("Console → Integrations → API Keys → sửa key hiện tại (hoặc tạo key mới)");
    line("và tick ĐỦ các scope sau:");
    line("");
    for (const scope of REQUIRED_SCOPES) line(`    • ${scope}`);
    line("");
    line('(Cách nhanh: bật "All scopes" — key chỉ dùng cục bộ trên máy bạn, không commit.)');
    line("Sau đó chạy lại script.");
  } else {
    fail(`Setup thất bại: ${message}`);
    if (error.code) fail(`HTTP ${error.code}`);
  }

  line("");
  line("========================================");
  console.error("APPWRITE_SETUP_COMPLETE = NO");
  line("========================================");
  process.exit(1);
});
