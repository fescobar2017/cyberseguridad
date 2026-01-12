import { type NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

interface PortResult {
  port: number
  service: string
  status: "open" | "closed" | "filtered"
  version?: string
}

// Validate target to prevent command injection
function validateTarget(target: string): boolean {
  // Remove protocol and path
  const cleaned = target
    .replace(/^https?:\/\//, "")
    .split("/")[0]
    .split(":")[0]

  // Only allow valid hostnames and IPs
  const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/

  return hostnameRegex.test(cleaned) || ipRegex.test(cleaned)
}

function parseNmapOutput(output: string): PortResult[] {
  const results: PortResult[] = []
  const lines = output.split("\n")

  for (const line of lines) {
    // Match lines like: "80/tcp   open  http    nginx 1.18.0"
    const portMatch = line.match(/^(\d+)\/(tcp|udp)\s+(open|closed|filtered)\s+(\S+)(?:\s+(.+))?/)

    if (portMatch) {
      results.push({
        port: Number.parseInt(portMatch[1]),
        service: portMatch[4] || "unknown",
        status: portMatch[3] as "open" | "closed" | "filtered",
        version: portMatch[5]?.trim() || undefined,
      })
    }
  }

  return results
}

export async function GET(request: NextRequest) {
  const target = request.nextUrl.searchParams.get("target")
  const scanType = request.nextUrl.searchParams.get("type") || "quick"

  if (!target) {
    return NextResponse.json({ error: "Target is required" }, { status: 400 })
  }

  // Clean and validate target
  const cleanTarget = target
    .replace(/^https?:\/\//, "")
    .split("/")[0]
    .split(":")[0]

  if (!validateTarget(cleanTarget)) {
    return NextResponse.json({ error: "Invalid target format" }, { status: 400 })
  }

  try {
    // Build nmap command based on scan type
    let nmapCommand: string

    switch (scanType) {
      case "full":
        // Full scan: All ports with version detection
        nmapCommand = `nmap -sV -sC -p- --open ${cleanTarget}`
        break
      case "common":
        // Top 1000 ports with version detection
        nmapCommand = `nmap -sV --top-ports 1000 ${cleanTarget}`
        break
      case "stealth":
        // SYN scan (requires root)
        nmapCommand = `nmap -sS -sV --top-ports 100 ${cleanTarget}`
        break
      case "quick":
      default:
        // Quick scan: Top 100 ports
        nmapCommand = `nmap -sV --top-ports 100 -T4 ${cleanTarget}`
        break
    }

    // Execute nmap with timeout
    const { stdout, stderr } = await execAsync(nmapCommand, {
      timeout: 300000, // 5 minutes timeout
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
    })

    if (stderr && !stderr.includes("Warning")) {
      console.error("[Nmap Error]:", stderr)
    }

    const ports = parseNmapOutput(stdout)

    return NextResponse.json({
      success: true,
      target: cleanTarget,
      scanType,
      ports,
      raw: stdout, // Include raw output for debugging
      timestamp: new Date().toISOString(),
    })
  } catch (error: unknown) {
    console.error("[Nmap Scan Error]:", error)

    // Check if nmap is installed
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        {
          error: "Nmap no está instalado en el servidor",
          hint: "Instalar con: sudo apt install nmap",
        },
        { status: 500 },
      )
    }

    // Handle timeout
    if (error instanceof Error && error.message.includes("TIMEOUT")) {
      return NextResponse.json(
        {
          error: "El escaneo excedió el tiempo límite",
          hint: "Intenta con un escaneo rápido o menos puertos",
        },
        { status: 408 },
      )
    }

    return NextResponse.json(
      {
        error: "Error ejecutando Nmap",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
