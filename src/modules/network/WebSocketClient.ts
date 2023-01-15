import io, { Socket } from 'socket.io-client'

export class WebSocketClient {
  private socket: Socket
  private url: string
  private onOpenCallback: (() => void) | undefined
  private onMessageCallback: ((data: any) => void) | undefined
  private onCloseCallback: (() => void) | undefined

  constructor(url: string) {
    this.url = url
    this.socket = io(this.url)

    this.socket.on('connect', () => {
      if (this.onOpenCallback) {
        this.onOpenCallback()
      }
    })

    this.socket.on('message', (data: any) => {
      if (this.onMessageCallback) {
        this.onMessageCallback(data)
      }
    })

    this.socket.on('disconnect', () => {
      if (this.onCloseCallback) {
        this.onCloseCallback()
      }
    })
  }

  public onOpen(callback: () => void) {
    this.onOpenCallback = callback
  }

  public onMessage(callback: (data: any) => void) {
    this.onMessageCallback = callback
  }

  public onClose(callback: () => void) {
    this.onCloseCallback = callback
  }

  public send(data: any) {
    this.socket.emit('message', data)
  }

  public close() {
    this.socket.disconnect()
  }
}
