export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      conversations: {
        Row: {
          id: string;
          name: string; // job post name with date
          applicationId: string; // job applicationId
          applicantId: string; // applied user Id
          companyAdminId: string; // job posters user id
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string; // job post name with date
          applicationId: string; // job applicationId
          applicantId: string; // applied user Id
          companyAdminId: string; // job posters user id
          created_at: string;
        };
        Update: {
          id?: string;
          name: string; // job post name with date
          applicationId: string; // job applicationId
          applicantId: string; // applied user Id
          companyAdminId: string; // job posters user id
          created_at: string;
        };
      };
      messages: {
        Row: {
          id: string;
          user_id: string; // person who has sent the message
          message: string;
          conversationId: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string; // person who has sent the message
          message: string;
          conversationId: string;
          created_at: string;
        };
        Update: {
          id?: string;
          user_id: string; // person who has sent the message
          message: string;
          conversationId: string;
          created_at: string;
        };
      };

      users: {
        Row: {
          id: string; //mongo db id
          name: string; // name from mongo
        };
        Insert: {
          id: string; //mongo db id
          name: string; // name from mongo
        };
        Update: {
          id: string; //mongo db id
          name: string; // name from mongo
        };
      };
    };
    // Views: {
    //   [_ in never]: never;
    // };
    // Functions: {
    //   [_ in never]: never;
    // };
    // Enums: {
    //   [_ in never]: never;
    // };
  };
}
