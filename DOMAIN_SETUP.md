# Custom Domain Setup: spotsave.pandeylabs.com

This guide specifically covers setting up the custom domain `spotsave.pandeylabs.com` with AWS Amplify.

## Prerequisites

- Domain `spotsave.pandeylabs.com` exists in Route53
- Amplify app is created and deployed
- You have access to Route53 hosted zone for `pandeylabs.com`

## Step-by-Step Domain Configuration

### Step 1: Add Domain in Amplify Console

1. **Navigate to Amplify Console**:
   - Go to https://console.aws.amazon.com/amplify
   - Select your SpotSave app

2. **Add Custom Domain**:
   - Click "Domain management" in the left sidebar
   - Click "Add domain"
   - Enter: `spotsave.pandeylabs.com`
   - Click "Configure domain"

3. **Domain Configuration**:
   - Amplify will show you DNS records to add
   - **Record Type**: Usually `CNAME` or `A` (Amplify will specify)
   - **Record Value**: CloudFront distribution domain (e.g., `d1234567890.cloudfront.net`)

### Step 2: Update Route53 Records

Since the domain already exists in Route53, you need to update the existing record:

1. **Go to Route53 Console**:
   - Navigate to https://console.aws.amazon.com/route53
   - Click "Hosted zones"
   - Select the hosted zone for `pandeylabs.com`

2. **Find or Create Record**:
   - Look for existing record: `spotsave` or `spotsave.pandeylabs.com`
   - If it exists, click "Edit record"
   - If it doesn't exist, click "Create record"

3. **Configure Record**:
   - **Record name**: `spotsave` (or leave blank if using the root)
   - **Record type**: `CNAME` (or `A` if Amplify specifies)
   - **Value**: Copy the CloudFront domain from Amplify Console
   - **TTL**: 300 (or use default)
   - **Routing policy**: Simple routing

4. **Save Record**:
   - Click "Save changes"
   - Wait for DNS propagation (5-15 minutes typically)

### Step 3: SSL Certificate Validation

1. **Automatic Provisioning**:
   - Amplify automatically requests an SSL certificate via AWS Certificate Manager
   - Certificate validation happens automatically if Route53 is used

2. **Manual Validation (if needed)**:
   - Go to AWS Certificate Manager
   - Find the certificate for `spotsave.pandeylabs.com`
   - If validation is pending, Amplify will create a CNAME record in Route53
   - Wait for validation (usually 10-30 minutes)

### Step 4: Verify Domain

1. **Check DNS Propagation**:
   ```bash
   # Using dig
   dig spotsave.pandeylabs.com
   
   # Using nslookup
   nslookup spotsave.pandeylabs.com
   ```

2. **Test HTTPS**:
   - Visit: `https://spotsave.pandeylabs.com`
   - Verify SSL certificate is valid (green lock icon)
   - Test that the app loads correctly

3. **Check Amplify Console**:
   - Domain status should show "Available"
   - SSL certificate should show "Success"

## Troubleshooting

### Domain Not Resolving

**Issue**: `spotsave.pandeylabs.com` doesn't resolve

**Solutions**:
1. Verify Route53 record is correct:
   - Record name: `spotsave`
   - Record type: `CNAME`
   - Value: Matches Amplify CloudFront domain exactly
   
2. Check DNS propagation:
   - Use `dig` or `nslookup` to verify
   - Wait up to 48 hours (usually much faster)

3. Clear DNS cache:
   ```bash
   # macOS
   sudo dscacheutil -flushcache
   
   # Linux
   sudo systemd-resolve --flush-caches
   
   # Windows
   ipconfig /flushdns
   ```

### SSL Certificate Issues

**Issue**: SSL certificate not validating

**Solutions**:
1. Check Certificate Manager:
   - Go to AWS Certificate Manager
   - Find certificate for `spotsave.pandeylabs.com`
   - Verify validation records are in Route53

2. Wait for validation:
   - Can take 10-30 minutes
   - Check certificate status in Certificate Manager

3. Manual validation (if needed):
   - Amplify should create validation records automatically
   - If not, add them manually in Route53

### Wrong CloudFront Domain

**Issue**: Route53 points to wrong CloudFront domain

**Solution**:
1. Get correct domain from Amplify Console
2. Update Route53 record with correct value
3. Wait for DNS propagation

## Route53 Record Example

Here's what the Route53 record should look like:

```
Record name: spotsave
Record type: CNAME
Value: d1234567890abcdef.cloudfront.net
TTL: 300
```

**Note**: The actual CloudFront domain will be different - get it from Amplify Console.

## Verification Checklist

- [ ] Route53 record created/updated
- [ ] Record points to Amplify CloudFront domain
- [ ] DNS propagates (check with `dig` or `nslookup`)
- [ ] SSL certificate validated in Certificate Manager
- [ ] HTTPS works at `https://spotsave.pandeylabs.com`
- [ ] App loads correctly
- [ ] All routes work (login, dashboard, etc.)

## Additional Notes

- **Subdomain vs Root**: If you want `spotsave.pandeylabs.com` (subdomain), create a record named `spotsave`
- **WWW**: If you also want `www.spotsave.pandeylabs.com`, add another record
- **Redirects**: Amplify can set up redirects (e.g., HTTP → HTTPS) automatically
- **Multiple Domains**: You can add multiple domains in Amplify Console

## Support

If issues persist:
1. Check Amplify Console → Domain management → Status
2. Check Route53 → Hosted zones → Record status
3. Check Certificate Manager → Certificate status
4. Review AWS CloudWatch logs for errors

