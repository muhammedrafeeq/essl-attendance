import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const QUEUE_FILE = path.join(DATA_DIR, 'commands.json')

interface Command {
  id: number
  sn: string
  cmd: string
  issued_at: string
}

function readQueue(): Command[] {
  if (!fs.existsSync(QUEUE_FILE)) return []
  try {
    return JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8')) as Command[]
  } catch {
    return []
  }
}

function writeQueue(queue: Command[]) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2), 'utf-8')
}

export function enqueueCommand(sn: string, cmd: string): Command {
  const queue = readQueue()
  const id = Date.now()
  const command: Command = { id, sn, cmd, issued_at: new Date().toISOString() }
  queue.push(command)
  writeQueue(queue)
  return command
}

export function dequeueCommand(sn: string): Command | null {
  const queue = readQueue()
  const idx = queue.findIndex((c) => c.sn === sn)
  if (idx === -1) return null
  const [command] = queue.splice(idx, 1)
  writeQueue(queue)
  return command
}
