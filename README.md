# KOSA Hospital — Angular App

Small Angular + Angular Material single-page app for hospital management (admin/doctor/patient/employee roles).

Quick start

1. Install dependencies

```powershell
npm install
```

2. Run development server

```powershell
npx ng serve --open
```

3. Build production

```powershell
npx ng build --configuration=production
```

Notes

- The app uses a fullscreen background video located at `/public/backgrouund.mp4`. If the video is missing, the app falls back to a gradient background.
- Authentication and persistence are designed to use Firebase Authentication and Firestore. Add your Firebase config in `src/environments` or initialize at runtime as your setup requires.
- Session persistence: Firebase Auth state should keep users logged in across refresh when properly configured.

Testing

Unit tests (if present) can be run with:

```powershell
npx ng test
```

License

This project is licensed under the MIT License — see `LICENSE`.
# HospitalManagement

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.1.6.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
