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
    await new Promise(resolve => setTimeout(resolve, 200));
  } catch {
    // Ignore errors if no user is signed in
  }

  try {
    const result = await signIn({
      username: email,
      password,
    });
    
    // Wait for the session to be established
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Verify the user is actually signed in
    let user;
    let retries = 0;
    while (retries < 5) {
      try {
        user = await getCurrentUser();
        if (user) break;
      } catch {
        // Keep trying
      }
      await new Promise(resolve => setTimeout(resolve, 200));
      retries++;
    }
    
    if (!user) {
      throw new Error("Sign in failed - session not established");
    }
    
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
        
        await new Promise(resolve => setTimeout(resolve, 800));
        const user = await getCurrentUser();
        if (!user) {
          throw new Error("Sign in failed after retry");
        }
        
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

