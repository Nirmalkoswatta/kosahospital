## Deploy to Firebase Hosting

1. Install Firebase CLI (if not already installed):

```powershell
npm install -g firebase-tools
```

2. Login and select your project (interactive):

```powershell
firebase login
firebase init hosting
# when asked, choose the project and set public directory to: dist/hospital-management
```

3. Or set project non-interactively by replacing <YOUR_FIREBASE_PROJECT_ID> in `.firebaserc`.

4. Deploy:

```powershell
firebase deploy --only hosting
```

5. CI-friendly deploy (use a CI token):

```powershell
# generate token locally: firebase login:ci
# set FIREBASE_TOKEN in CI environment
firebase deploy --only hosting --token "$env:FIREBASE_TOKEN"
```

Notes:
- The repo already contains `firebase.json` configured to serve `dist/hospital-management` and a `.firebaserc` placeholder. Replace the project id with your Firebase project id.
- If you want me to run `firebase deploy` here, provide the project id and a CI token with deploy permissions. I will not request or store credentials without your explicit consent.
