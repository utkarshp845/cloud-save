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
  // Always sign out any existing user first
  try {
    await signOut();
    await new Promise(resolve => setTimeout(resolve, 200));
  } catch {
    // Ignore errors if no user is signed in
  }

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
    
    // Wait for auto-sign-in to complete
    if (isSignUpComplete) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return { isSignUpComplete, userId, nextStep };
  } catch (error) {
    throw error;
  }
}

export async function handleSignIn({ email, password }: SignInParams) {
  // Always sign out any existing user first to avoid conflicts
  try {
    await signOut();
    await new Promise(resolve => setTimeout(resolve, 300));
  } catch {
    // Ignore errors if no user is signed in
  }

  try {
    const result = await signIn({
      username: email,
      password,
    });
    
    // Don't check session immediately - trust Amplify's signIn result
    // The session will be established by Amplify
    // Just wait a moment for the redirect to happen
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return result;
  } catch (error) {
    // If error mentions already signed in, sign out and retry once
    const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    if (errorMessage.includes("already") || errorMessage.includes("signed in")) {
      try {
        await signOut();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Retry sign in
        const retryResult = await signIn({
          username: email,
          password,
        });
        
        await new Promise(resolve => setTimeout(resolve, 500));
        return retryResult;
      } catch (retryError) {
        throw new Error(retryError instanceof Error ? retryError.message : "Failed to sign in after retry");
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

