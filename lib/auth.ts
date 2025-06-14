import { type NextRequest, NextResponse } from "next/server"
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm"

const ssm = new SSMClient({ region: "ap-northeast-1" });

async function getParameter(name: string) {
  const command = new GetParameterCommand({
    Name: name,
    WithDecryption: true,
  });
  const response = await ssm.send(command);
  if (!response.Parameter?.Value) throw new Error(`Parameter ${name} not found`);
  return response.Parameter.Value;
}

// 管理者用ベーシック認証
export async function isAdminAuthenticatedAsync(req: NextRequest) {
  const authHeader = req.headers.get("authorization")

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return false
  }

  // Basic認証のデコード
  const base64Credentials = authHeader.split(" ")[1]
  const credentials = Buffer.from(base64Credentials, "base64").toString("utf-8")
  const [username, password] = credentials.split(":")
  
  const adminUsername = await getParameter("/face-recognition-system/test/adminUsername")
  const adminPassword = await getParameter("/face-recognition-system/test/adminPassword")
  
  return username === adminUsername && password === adminPassword
}

// 管理者認証ミドルウェア
export function withAdminAuth(handler: Function) {
  return async (req: NextRequest) => {
    if (!await isAdminAuthenticatedAsync(req)) {
      return new NextResponse("Unauthorized", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="Admin Area"',
        },
      })
    }

    return handler(req)
  }
}

// ユーザー認証（共通パスワード）
export async function validateUserPasswordAsync(password: string) {
  const userCommonPassword = await getParameter("/face-recognition-system/test/userCommonPassword")
  return password === userCommonPassword
}
