import { Socket } from 'socket.io';

export interface TypedRequestBody<T> extends Express.Request {
  body: T;
}

export interface TypedRequestQuery<T> extends Express.Request {
  query: T;
}

export interface TypedRequestQueryWithBodyAndParams<Params, ReqBody>
  extends Express.Request {
  body: ReqBody;
  params: Params;
}

export interface TypedRequestQueryAndParams<Params, Query> extends Express.Request {
  params: Params;
  query: Query;
}

export interface TypedRequestQueryWithParams<Params> extends Express.Request {
  params: Params;
}

export interface User {
  id: string; //mongo db id
  name: string; // name from mongo
}

export interface Conversation {
  id: string;
  name: string; // job post name with date
  applicationId: string; // job applicationId
  applicantId: string; // applied user Id
  companyAdminId: string; // job posters user id
  created_at: Date;
}

export interface Message {
  id: string;
  user_id: string; // person who has sent the message
  message: string;
  conversationId: string;
  created_at: string;
}

export interface SocketConnectedUsers {
  [key: string]: {
    socketId: string;
    socket: Socket;
    userId: string;
  };
}

export interface SocketSocketIdUserId {
  [key: string]: string;
}
