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
    // Check if user is already signed in and sign them out first
    try {
      await getCurrentUser();
      await signOut();
    } catch {
      // No user signed in, continue
    }

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
    // Check if user is already signed in and sign them out first
    try {
      const currentUser = await getCurrentUser();
      // If different user, sign out first
      if (currentUser.signInDetails?.loginId !== email) {
        await signOut();
        // Wait a bit for sign out to complete
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } catch {
      // No user signed in, continue
    }

    const result = await signIn({
      username: email,
      password,
    });
    
    // Wait for the session to be established
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verify the user is actually signed in
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Sign in failed - session not established");
    }
    
    return result;
  } catch (error) {
    // If error is about already signed in, try to sign out and retry
    if (error instanceof Error && error.message.includes("already a signed in user")) {
      try {
        await signOut();
        await new Promise(resolve => setTimeout(resolve, 300));
        return await handleSignIn({ email, password });
      } catch (retryError) {
        throw retryError;
      }
    }
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

