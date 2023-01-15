export interface IMessage<T = any> {
  type: string
  payload: T
}
