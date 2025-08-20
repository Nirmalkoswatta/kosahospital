import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { ApplicationRef } from '@angular/core';
import { FirebaseService } from './app/core/firebase.service';
import { DataService } from './app/core/data';

bootstrapApplication(App, appConfig)
  .then((appRef: any) => {
    try {
      const injector = (appRef && appRef.injector) ? appRef.injector : appRef;
      const fb = injector.get ? injector.get(FirebaseService, null as any) : null;
      const data = injector.get ? injector.get(DataService, null as any) : null;
      if (data && fb) {
        // attach runtime reference so DataService can call Firestore methods
        (data as any).fbService = fb;
      }
    } catch (e) {
      // ignore if providers not present
    }
  })
  .catch((err) => console.error(err));
