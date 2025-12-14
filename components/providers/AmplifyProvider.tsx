"use client";

import * as React from "react";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";

// Configure Amplify immediately (not in useEffect)
if (typeof window !== "undefined") {
  // #region agent log
  console.log('[DEBUG] Loading amplify_outputs.json:', { outputs, hasAuth: !!outputs?.auth, userPoolId: outputs?.auth?.user_pool_id, clientId: outputs?.auth?.user_pool_client_id, region: outputs?.auth?.aws_region });
  fetch('http://127.0.0.1:7243/ingest/aaab0382-1426-4d96-8048-69c314b805e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AmplifyProvider.tsx:9',message:'Loading amplify_outputs.json',data:{outputs:outputs,hasAuth:!!outputs?.auth,userPoolId:outputs?.auth?.user_pool_id,clientId:outputs?.auth?.user_pool_client_id,region:outputs?.auth?.aws_region},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  if (outputs?.auth) {
    // #region agent log
    console.log('[DEBUG] Configuring Amplify with:', { userPoolId: outputs.auth.user_pool_id, clientId: outputs.auth.user_pool_client_id, region: outputs.auth.aws_region });
    fetch('http://127.0.0.1:7243/ingest/aaab0382-1426-4d96-8048-69c314b805e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AmplifyProvider.tsx:13',message:'Configuring Amplify',data:{userPoolId:outputs.auth.user_pool_id,clientId:outputs.auth.user_pool_client_id,region:outputs.auth.aws_region},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    try {
      Amplify.configure(outputs, { ssr: true });
      // #region agent log
      console.log('[DEBUG] Amplify.configure succeeded');
      fetch('http://127.0.0.1:7243/ingest/aaab0382-1426-4d96-8048-69c314b805e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AmplifyProvider.tsx:18',message:'Amplify.configure succeeded',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
    } catch (error) {
      // #region agent log
      console.error('[DEBUG] Amplify.configure failed:', error);
      fetch('http://127.0.0.1:7243/ingest/aaab0382-1426-4d96-8048-69c314b805e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AmplifyProvider.tsx:21',message:'Amplify.configure failed',data:{error:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
    }
  } else {
    // #region agent log
    console.warn('[DEBUG] No auth config in outputs:', Object.keys(outputs || {}));
    fetch('http://127.0.0.1:7243/ingest/aaab0382-1426-4d96-8048-69c314b805e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AmplifyProvider.tsx:25',message:'No auth config in outputs',data:{outputsKeys:Object.keys(outputs || {})},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
  }
}

export function AmplifyProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

