import { APIGatewayEvent, APIGatewayProxyResult, Callback } from "aws-lambda"

export type Responder = (err: Error | null, data?: string | {}, status?: number)=> void

export interface Options {responseType: string, bodyType: string}

export type RouteHandler = (request: AWSLambdaRouterEvent, response: Responder)=> void

export type MethodHandler = (path: string, handler: RouteHandler, options?: Options)=> void

export type AWSLambdaRouterEvent = APIGatewayEvent & { body: string | {} }

declare class AWSLambdaRouter {
  constructor()
  public serve: (event: AWSLambdaRouterEvent, callback: Callback<APIGatewayProxyResult>)=> void
  public get: MethodHandler
  public post: MethodHandler
  public delete: MethodHandler
  public useCors: (option: boolean)=> void
}

export default AWSLambdaRouter