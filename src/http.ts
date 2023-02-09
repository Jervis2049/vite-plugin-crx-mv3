import { createServer } from 'http'
import type * as http from 'http'

interface HttpServer {
  port: number
  server: http.Server
}

export async function httpServerStart(port: number): Promise<HttpServer> {
  const server = createServer()
  return new Promise((resolve, reject) => {
    const onError = (e: Error & { code?: string }) => {
      if (e.code === 'EADDRINUSE') {
        console.log(`Port ${port} is in use, trying another one...`)
        server.listen(++port)
      } else {
        server.removeListener('error', onError)
        reject(e)
      }
    }
    server.on('error', onError)
    server.listen(port, () => {
      console.log('WebSocket server started on port: ', port)
      server.removeListener('error', onError)
      resolve({ port, server })
    })
  })
}
