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
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/aaab0382-1426-4d96-8048-69c314b805e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:13',message:'handleSignUp called',data:{email},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  // Always sign out any existing user first
  try {
    await signOut();
    await new Promise(resolve => setTimeout(resolve, 200));
  } catch {
    // Ignore errors if no user is signed in
  }

  try {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/aaab0382-1426-4d96-8048-69c314b805e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:25',message:'Calling signUp',data:{email},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
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
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/aaab0382-1426-4d96-8048-69c314b805e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:38',message:'signUp succeeded',data:{isSignUpComplete,userId},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    // Wait for auto-sign-in to complete
    if (isSignUpComplete) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return { isSignUpComplete, userId, nextStep };
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/aaab0382-1426-4d96-8048-69c314b805e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:47',message:'signUp failed',data:{error:error instanceof Error ? error.message : String(error),errorStack:error instanceof Error ? error.stack : undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    throw error;
  }
}

export async function handleSignIn({ email, password }: SignInParams) {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/aaab0382-1426-4d96-8048-69c314b805e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:50',message:'handleSignIn called',data:{email},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  // Always sign out any existing user first to avoid conflicts
  try {
    await signOut();
    await new Promise(resolve => setTimeout(resolve, 300));
  } catch {
    // Ignore errors if no user is signed in
  }

  try {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/aaab0382-1426-4d96-8048-69c314b805e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:60',message:'Calling signIn',data:{email},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    const result = await signIn({
      username: email,
      password,
    });
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/aaab0382-1426-4d96-8048-69c314b805e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:68',message:'signIn succeeded',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
    // Don't check session immediately - trust Amplify's signIn result
    // The session will be established by Amplify
    // Just wait a moment for the redirect to happen
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return result;
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/aaab0382-1426-4d96-8048-69c314b805e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:77',message:'signIn failed',data:{error:error instanceof Error ? error.message : String(error),errorStack:error instanceof Error ? error.stack : undefined,errorName:error instanceof Error ? error.name : undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
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

