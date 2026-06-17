interface Command {
  id: number
  sn: string
  cmd: string
  issued_at: string
}

const queue: Command[] = []

export function enqueueCommand(sn: string, cmd: string): Command {
  const command: Command = { id: Date.now(), sn, cmd, issued_at: new Date().toISOString() }
  queue.push(command)
  return command
}

export function dequeueCommand(sn: string): Command | null {
  const idx = queue.findIndex((c) => c.sn === sn)
  if (idx === -1) return null
  const [command] = queue.splice(idx, 1)
  return command
}
