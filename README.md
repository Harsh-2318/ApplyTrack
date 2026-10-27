# ApplyTrack — Job Application Tracker

A responsive Next.js + TypeScript job tracker with local demo mode and an AWS serverless deployment template. Built as a junior software developer assessment project.

## What is implemented

- Landing page and responsive dashboard UI.
- Dashboard metrics for total applications, interviews, assessments, offers and rejections.
- Add, edit, delete, search and status-filter application records.
- Form validation, success/error messages, loading state and empty state.
- Local demo data persisted in this browser's `localStorage`, with an explicit **DEMO MODE** banner. Demo resume attachments store only the filename; the actual file is not uploaded.
- AWS backend source for authenticated API Gateway routes, Lambda CRUD, DynamoDB persistence, and Cognito-authenticated resume-upload authorization.
- Private S3 bucket with public access blocked, encryption, restrictive CORS, presigned POST policies with a 5 MB content-length limit and PDF/DOCX content-type conditions.
- AWS SAM infrastructure template: API Gateway HTTP API, Cognito User Pool, DynamoDB, S3 and Lambda. No EC2 resources.
- Automated frontend and backend validation tests.

## Architecture

`Next.js (Amplify Hosting) → API Gateway HTTP API (Cognito JWT authorizer) → Lambda → DynamoDB`

Resume authorization is handled by a separate Lambda which returns a short-lived S3 presigned POST policy. The browser uploads directly to the private S3 bucket. The API's application partition key is the verified Cognito `sub`, and the backend never accepts a user ID from the request body as the owner.

## Requirements

- Windows 11
- Node.js 22 LTS (Node 22 is used by the Lambda functions)
- VS Code
- Git (recommended)
- For AWS deployment: AWS account, AWS CLI v2, AWS SAM CLI, and Docker Desktop if your SAM build environment requires it

## Run locally on Windows 11

Open this folder in VS Code. In the VS Code terminal (PowerShell):

```powershell
node --version
npm --version
Copy-Item .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`. The default is `NEXT_PUBLIC_APP_MODE=demo`, so you can explore without AWS credentials or cloud resources. Demo changes are saved in this browser only. Clearing browser storage resets the demo dataset.

### Verify code locally

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

Backend validation tests/build:

```powershell
Set-Location backend
npm install
npm run build
npx vitest run
Set-Location ..
```

## Local demo vs AWS mode

| Capability | Demo mode | AWS mode |
|---|---|---|
| Application records | Browser `localStorage` | DynamoDB via authenticated API |
| CRUD, search and filters | Yes | Yes, after Cognito sign-in and API configuration |
| Resume attachment | Filename only, no file transfer | Presigned private S3 upload, PDF/DOCX, max 5 MB |
| User identity | No authentication; sample data only | Cognito JWT verified by API Gateway |
| Data sharing across browsers | No | Yes, for the same signed-in user |

Never treat demo mode as secure storage for private job-search information. The sample data is illustrative. It is not live AWS data.

## AWS deployment (manual; no resources are created by this package)

**Cost and cleanup:** deploying creates billable AWS resources (primarily API requests, DynamoDB on-demand requests/storage, S3 storage/requests, and potentially Cognito MAU/Amplify build usage). Review current AWS pricing first. This project does not deploy anything automatically. Delete the stack and Amplify app when you no longer need them. The S3 bucket may need to be emptied before stack deletion.

### 1. Configure AWS tools and choose a region

1. Create/use an AWS account and enable MFA on your admin identity.
2. Install AWS CLI v2 and AWS SAM CLI using the official AWS installation guides.
3. Configure a named AWS CLI profile using `aws configure --profile applytrack` (or your organization's SSO flow). Do not put access keys in source code or `.env.local`.
4. Choose a region and use it consistently. The example frontend default is `ap-south-1` (Mumbai); confirm the services you need are available there.
5. Verify the profile with `aws sts get-caller-identity --profile applytrack`.

### 2. Deploy the serverless backend

From the project root, run in PowerShell:

```powershell
Set-Location backend
npm install
npm run build
Set-Location ..
sam validate --lint --template-file infrastructure/template.yaml --profile applytrack
sam build --template-file infrastructure/template.yaml --profile applytrack
sam deploy --guided --template-file .aws-sam/build/template.yaml --profile applytrack
```

For the guided deployment, choose a unique stack name such as `applytrack-dev`, the region you selected, allow SAM to create its deployment role if prompted, and confirm changes before deploy. Use a globally unique lowercase `CognitoDomainPrefix` and set `FrontendOrigin` to `http://localhost:3000` for initial local testing. Review the change set carefully before approving. If SAM reports a build or template error, stop and resolve it rather than assuming deployment worked.

After deployment, save the actual outputs shown by CloudFormation: `ApiUrl`, `UserPoolId`, `UserPoolClientId`, and `CognitoHostedUiDomain`. Do not invent or guess these values.

### 3. Configure frontend environment

Create `.env.local` in the project root and set actual output values:

```dotenv
NEXT_PUBLIC_APP_MODE=aws
NEXT_PUBLIC_API_BASE_URL=https://YOUR_API_ID.execute-api.YOUR_REGION.amazonaws.com
NEXT_PUBLIC_COGNITO_USER_POOL_ID=YOUR_USER_POOL_ID
NEXT_PUBLIC_COGNITO_CLIENT_ID=YOUR_PUBLIC_APP_CLIENT_ID
NEXT_PUBLIC_COGNITO_REGION=YOUR_REGION
NEXT_PUBLIC_COGNITO_DOMAIN=https://YOUR_DOMAIN_PREFIX.auth.YOUR_REGION.amazoncognito.com
```

Replace every `YOUR_...` value with the real CloudFormation output. Restart Next.js after changing environment variables. Never add AWS access keys to this file. The Cognito app client is a public browser client and must not have a client secret.

For local development, ensure the backend stack's `FrontendOrigin` is `http://localhost:3000`. If you deploy to a hosted URL later, update the API CORS and S3 CORS origins to the exact HTTPS origin (no trailing slash), and update Cognito callback/logout URLs. These changes may require a stack update:

```powershell
sam deploy --guided --template-file .aws-sam/build/template.yaml --profile applytrack
```

Use the same stack name and update `FrontendOrigin` to the hosted origin. Verify the resulting change set. Cognito OAuth redirect URLs must match the hosted origin exactly. The app currently uses Cognito's implicit token flow for a browser-only assessment build; for a production deployment, migrate to Authorization Code + PKCE and a maintained Cognito/OIDC client library before real users rely on it.

### 4. Test AWS API and resume upload

1. Start the frontend with `npm run dev` and visit `/register` to create a Cognito user (after Cognito environment variables are set).
2. Confirm email verification if prompted.
3. Sign in at `/login`. Cognito redirects back to the login route with an ID token; the page stores it in session storage for this assessment build.
4. Open `/dashboard`; the mode label should say **AWS connected mode** and the API should load records from DynamoDB.
5. Create, edit, and delete a test record. Confirm the record is present in DynamoDB with your Cognito `sub` as partition key.
6. Attach a PDF or DOCX up to 5 MB. Confirm the upload returns successfully and the object exists under your user-prefix in the private S3 bucket. Try a `.txt` file and a file larger than 5 MB; the UI should reject them.
7. Confirm a request without a valid JWT returns 401, a different user's ID cannot be selected by the client, and one user's records are not returned to another user.

**Security note:** this starter uploads resumes and saves their S3 key/name on an application. It does not yet implement a resume-download endpoint, malware scanning, lifecycle deletion, or automatic deletion of S3 objects when an application is deleted. Add those before production use. The upload API trusts the declared filename/size/type to authorize the upload, while the S3 POST policy enforces content type and size. Content type is not a malware check; only upload trusted files.

### 5. Host the frontend on AWS Amplify

1. Push this project to a private GitHub repository (do not commit `.env.local`, credentials, build output, or personal resume files).
2. In the AWS Console, open **AWS Amplify → Create new app → Host web app**, connect the repository, and select the intended branch.
3. Confirm the build settings use the repository's Next.js build support and `npm run build`. Amplify may detect Next.js settings automatically; review the generated build configuration before saving.
4. Add the six `NEXT_PUBLIC_...` values above in Amplify app environment variables, using actual CloudFormation outputs. `NEXT_PUBLIC_APP_MODE` must be `aws`.
5. Ensure the final Amplify domain is added to API Gateway CORS, S3 CORS, and Cognito callback/logout URLs by updating the SAM stack. Redeploy the stack after verifying the proposed changes.
6. Deploy the branch in Amplify and wait for the build to finish successfully. Copy the real HTTPS URL displayed by Amplify; this is the URL to submit. Do not use a URL guessed from the app name.
7. Open the live URL in a private/incognito window, create/sign in with a test user, and repeat the CRUD and resume tests. Check browser dev tools and CloudWatch logs for errors without exposing tokens.

### 6. Clean up AWS resources

Delete test data and empty the resume bucket first if needed. Then delete the SAM CloudFormation stack and the Amplify app through their consoles/CLI. Verify the stack has been removed and no resources remain. Keep the source repository if you need to submit it.

## API routes

All API routes require a Cognito JWT (API Gateway HTTP API JWT authorizer):

- `GET /applications` — list only the authenticated user's records
- `POST /applications` — create a record
- `GET /applications/{id}` — fetch one owned record
- `PUT /applications/{id}` — update an owned record
- `DELETE /applications/{id}` — delete an owned record
- `POST /resumes/presign` — request a short-lived, size/type-restricted S3 POST policy

## Assessment submission checklist

- [ ] Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`; record the actual results.
- [ ] Deploy SAM backend in your own AWS account and save actual CloudFormation outputs.
- [ ] Configure Cognito and set frontend environment variables without exposing secrets.
- [ ] Deploy the frontend through Amplify Hosting.
- [ ] Verify sign-in, CRUD, cross-user isolation, and private S3 upload on the hosted URL.
- [ ] Copy the verified Amplify HTTPS URL and repository URL into your assessment submission.
- [ ] Include this README and source code ZIP; never submit credentials or private resumes.
- [ ] Clean up resources after the assessment if you do not need them anymore.

## Known limitations

- This is an assessment-ready starter, not a security-audited production service.
- Login currently uses Cognito hosted UI's implicit flow and stores an ID token in `sessionStorage`; migrate to Authorization Code + PKCE before production use.
- There is no server-side pagination yet; the list query returns all records for the authenticated user.
- Resume download, malware scanning, automatic orphan cleanup, email notifications and reminders are not implemented.
- AWS deployment/live URL cannot be verified without deploying into your own AWS account.
# ApplyTrack
Job Application Tracker Web App
