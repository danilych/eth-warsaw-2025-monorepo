import dotenv from 'dotenv';

dotenv.config();

export const civicConfig = () => {
  const clientId = process.env.CIVIC_CLIENT_ID;
  const redirectUrl = process.env.CIVIC_REDIRECT_URL;
  const postLogoutRedirectUrl = process.env.CIVIC_POST_LOGOUT_REDIRECT_URL;
  const loginSuccessUrl = process.env.CIVIC_LOGIN_URL;

  if (!clientId || !redirectUrl || !postLogoutRedirectUrl || !loginSuccessUrl) {
    throw new Error(
      'CIVIC_CLIENT_ID or CIVIC_REDIRECT_URL or CIVIC_POST_LOGOUT_REDIRECT_URL or CIVIC_LOGIN_URL is not set'
    );
  }

  return {
    clientId,
    redirectUrl,
    postLogoutRedirectUrl,
    loginSuccessUrl,
  };
};
