export interface sendOTPInterface {
    requestId: string;
}
export interface VerifyOTPInterface {
    newUser: false;
    accessToken: string;
    refreshToken: string;
    shortLivedToken?: never;
    user: any;
}

export interface VerifyOTPInterfaceNonNewUser {
    newUser: true;
    accessToken?: never;
    refreshToken?: never;
    shortLivedToken: string;
    metaFields: any;
}

export interface loginAdminInterfaceResult {
    accessToken: string,
    refreshToken: string,
    role: string
}

export type VerifyOTPResult = VerifyOTPInterface | VerifyOTPInterfaceNonNewUser;
