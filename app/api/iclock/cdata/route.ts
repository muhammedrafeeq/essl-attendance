import { NextRequest } from "next/server";
import sql from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET — device initial handshake, returns config
export async function GET(req: NextRequest) {
  const sn = req.nextUrl.searchParams.get("SN") ?? "unknown";
  console.log(`[ADMS] cdata GET from SN=${sn}`);

  const config = [
    `GET OPTION FROM:${sn}`,
    'ATTLOGStamp=0',
    'OPERLOGStamp=9999',
    'ATTPHOTOStamp=None',
    'ErrorDelay=30',
    'Delay=10',
    'TransTimes=00:00;14:05',
    'TransInterval=1',
    'TransFlag=TransData AttLog OpLog AttPhoto EnrollUser ChgUser EnrollFP ChgFP UserPic',
    'TimeZone=5.5',
    'Realtime=1',
    'Encrypt=None',
  ].join('\n')

  return new Response(config, {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}

// POST — device pushes attendance logs
export async function POST(req: NextRequest) {
  const body = await req.text();

  const table = req.nextUrl.searchParams.get("table") ?? "none";
  const sn = req.nextUrl.searchParams.get("SN") ?? "unknown";
  console.log("========== iClock CDATA POST ==========");
  console.log(`SN: ${sn}, table: ${table}`);
  console.log("RAW BODY:", body);
  console.log("=======================================");

  try {
    const records = parseAttendance(body, sn);
    console.log("Parsed records:", JSON.stringify(records, null, 2));

    for (const record of records) {
      await sql`
        INSERT INTO attendance_logs (user_id, timestamp, status, verify, device_sn)
        VALUES (${record.userId}, ${record.timestamp.toISOString()}, ${record.statusCode}, ${record.verifyCode}, ${record.deviceId})
        ON CONFLICT DO NOTHING
      `
    }
    console.log(`[ADMS] Saved ${records.length} records to DB`)

    return new Response("OK", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });

  } catch (err) {
    console.error("[ADMS] cdata error:", err);

    // always return OK — prevent device retry flood
    return new Response("OK", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }
}

// ---- Parser ----
interface AttendanceRecord {
  deviceId: string;
  userId: string;
  timestamp: Date;
  type: string;
  verifyMode: string;
  statusCode: string;
  verifyCode: string;
}

function parseAttendance(body: string, snFromQuery = "unknown"): AttendanceRecord[] {
  const lines = body.split(/\r?\n/).filter(Boolean);
  const records: AttendanceRecord[] = [];
  let deviceId = snFromQuery;

  for (const line of lines) {
    const trimmed = line.trim();

    // extract device serial number
    if (trimmed.startsWith("SN=")) {
      deviceId = trimmed.replace("SN=", "").trim();
      console.log("[ADMS] Device SN:", deviceId);
      continue;
    }

    // skip non-attendance lines
    if (
      trimmed.startsWith("OPLOG") ||
      trimmed.startsWith("OPERLOG") ||
      trimmed.startsWith("USER") ||
      trimmed.startsWith("Realtime") ||
      trimmed.startsWith("TNA") ||
      trimmed === ""
    ) {
      continue;
    }

    // strip ATTLOG prefix if present: "ATTLOG 1 2026-06-16 12:18:50 0 1"
    const rawLine = trimmed.startsWith("ATTLOG") ? trimmed.replace(/^ATTLOG\s+/, "") : trimmed;
    const parts = rawLine.split(/\t|\s{2,}|\s+/);

    // need at least: userId, date, time, status
    if (parts.length < 4) continue;

    // detect if date and time are separate or combined
    let userId: string, dateStr: string, timeStr: string, status: string, verify: string;

    if (parts[1] && parts[1].includes("-") && parts[2] && parts[2].includes(":")) {
      // format: userId  date  time  status  verify
      [userId, dateStr, timeStr, status, verify] = parts;
    } else if (parts[1] && parts[1].includes(" ")) {
      // format: userId  "date time"  status  verify
      userId = parts[0];
      const dt = parts[1].split(" ");
      dateStr = dt[0]; timeStr = dt[1];
      status = parts[2]; verify = parts[3];
    } else {
      continue;
    }

    const timestamp = new Date(`${dateStr} ${timeStr}`);
    if (isNaN(timestamp.getTime())) continue;

    records.push({
      deviceId,
      userId,
      timestamp,
      type: mapStatus(status ?? "0"),
      verifyMode: mapVerify(verify ?? "0"),
      statusCode: status ?? "0",
      verifyCode: verify ?? "0",
    });
  }

  return records;
}

function mapStatus(code: string): string {
  const map: Record<string, string> = {
    "0": "check-in",
    "1": "check-out",
    "2": "break-out",
    "3": "break-in",
    "4": "overtime-in",
    "5": "overtime-out",
  };
  return map[code] ?? "unknown";
}

function mapVerify(code: string): string {
  const map: Record<string, string> = {
    "0": "Password",
    "1": "Fingerprint",
    "2": "Card",
    "3": "Fingerprint+Password",
    "4": "Card+Password",
    "6": "Face",
    "15": "Face+Fingerprint",
  };
  return map[code] ?? `Mode-${code}`;
}