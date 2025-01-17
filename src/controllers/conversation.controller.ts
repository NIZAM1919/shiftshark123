// import supabase from '../boot/supabase';
// import { NextFunction, Request, Response } from 'express';
// import { RequestWithUser } from '../interfaces/request.js';
// import Socket from '../util/socket';
// import {
//   TypedRequestBody,
//   TypedRequestQuery,
//   TypedRequestQueryWithBodyAndParams,
//   TypedRequestQueryAndParams,
//   User,
//   Message,
//   Conversation,
// } from '../interfaces/chat';

// export const createConversation = async function (
//   req: TypedRequestBody<{
//     owner_id: string;
//     participant_ids: string[];
//     group_name: string;
//   }>,
//   res: Response,
// ) {
//   const { owner_id, participant_ids, group_name } = req.body;

//   // first create the conversation
//   const conversation = await supabase
//     .from('conversations')
//     .upsert({
//       name: group_name,
//       owner_user_id: owner_id,
//       created_at: new Date().toISOString().toLocaleString(),
//     })
//     .select();

//   if (conversation.error) {
//     res.send(500);
//   }

//   let participants: User[] = [];

//   if (participant_ids.length > 1 && conversation.data?.length) {
//     // attach all our users to this conversation
//     const pivotData = await supabase
//       .from('user_conversation')
//       .upsert(
//         participant_ids.map((participant_id) => {
//           return {
//             user_id: participant_id,
//             conversation_id: conversation.data[0].id,
//           };
//         }),
//       )
//       .select();

//     if (pivotData.data?.length) {
//       // find our actual users
//       const actualParticipantUsers = await supabase
//         .from('users')
//         .select()
//         .in('id', participant_ids);

//       if (actualParticipantUsers.data?.length) participants = actualParticipantUsers.data;
//     }
//   }

//   if (conversation.error) {
//     return res.sendStatus(500);
//   } else {
//     const conv: Conversation = {
//       ...conversation.data[0],
//       participants,
//     };

//     Socket.notifyUsersOnConversationCreate(participant_ids as string[], conv);
//     return res.send(conv);
//   }
// };

// export const addMessageToConversation = async function (
//   req: TypedRequestQueryWithBodyAndParams<
//     { conversation_id: string },
//     { user_id: string; message: string }
//   >,
//   res: Response,
// ) {
//   const conversationid = req.params.conversation_id;
//   const { user_id, message } = req.body;

//   const data = await supabase.from('messages').upsert({
//     conversation_id: conversationid,
//     user_id,
//     message,
//     created_at: new Date().toISOString().toLocaleString(),
//   }).select(`
//         *,
//         users (
//             id,
//             username
//         ),
//         conversations (*)
//       `);

//   // get the users in this chat, except for the current one
//   const userConversationIds = await supabase
//     .from('user_conversation')
//     .select('user_id')
//     .eq('conversation_id', conversationid);

//   if (data.error) {
//     res.send(500);
//   } else {
//     if (userConversationIds.data && userConversationIds.data?.length > 0) {
//       const userIdsForMessages = userConversationIds.data
//         .map((item) => item.user_id)
//         .filter((item) => item !== user_id);
//       Socket.sendMessageToUsers(userIdsForMessages as string[], data.data[0] as Message);
//     }

//     res.send(data.data[0]);
//   }
// };

// export const getConversationMessages = async function (
//   req: TypedRequestQueryAndParams<
//     { conversation_id: string },
//     { last_message_date: Date }
//   >,
//   res: Response,
// ) {
//   const { conversation_id } = req.params;
//   const { last_message_date } = req.query;

//   let query = supabase
//     .from('messages')
//     .select(
//       `
//             id,
//             conversation_id,
//             message,
//             created_at,
    
//             users (
//                 id,
//                 username
//             )
//         `,
//     )
//     .order('created_at', { ascending: true })
//     .eq('conversation_id', conversation_id);

//   if (last_message_date) {
//     query = query.gt('created_at', last_message_date);
//   }

//   const messages = await query;

//   res.send(messages.data);
// };
