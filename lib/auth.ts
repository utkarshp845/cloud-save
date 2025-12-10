import { getCurrentUser, signIn, signOut, signUp } from "aws-amplify/auth";

export interface SignUpParams {
  email: string;
  password: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

export async function handleSignUp({ email, password }: SignUpParams) {
  try {
    const { isSignUpComplete, userId, nextStep } = await signUp({
      username: email,
      password,
      options: {
        userAttributes: {
          email,
        },
        autoSignIn: true,
      },
    });
    return { isSignUpComplete, userId, nextStep };
  } catch (error) {
    throw error;
  }
}

export async function handleSignIn({ email, password }: SignInParams) {
  try {
    const { isSignedIn, nextStep } = await signIn({
      username: email,
      password,
    });
    return { isSignedIn, nextStep };
  } catch (error) {
    throw error;
  }
}

export async function handleSignOut() {
  try {
    await signOut();
  } catch (error) {
    throw error;
  }
}

export async function getCurrentAuthUser() {
  try {
    const user = await getCurrentUser();
    return user;
  } catch (error) {
    return null;
  }
}

