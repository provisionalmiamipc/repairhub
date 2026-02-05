import { ApplicationConfig, importProvidersFrom, ErrorHandler } from '@angular/core';
import { provideHttpClient, withInterceptors, withXsrfConfiguration, HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
  provideRouter,
  withEnabledBlockingInitialNavigation,
  withHashLocation,
  withInMemoryScrolling,
  withRouterConfig,
  withViewTransitions
} from '@angular/router';

import { DropdownModule, SidebarModule } from '@coreui/angular';
import { IconSetService } from '@coreui/icons-angular';
import { routes } from './app.routes';
import { environment } from '../environments/environment';

// Functional Interceptors
import { authInterceptor } from './shared/interceptors/auth.interceptor';
import { employeeInterceptor } from './shared/interceptors/employee.interceptor';
import { errorInterceptor } from './shared/interceptors/error.interceptor';
import { loadingInterceptor } from './shared/interceptors/loading.interceptor';
import { jwtInterceptor } from './shared/interceptors/jwt.interceptor';
import { timeoutInterceptor } from './shared/interceptors/timeout.interceptor';

// Class-based Interceptors
import { GlobalErrorHandler } from './core/handlers/global-error.handler';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes,
      withRouterConfig({
        onSameUrlNavigation: 'reload'
      }),
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled'
      }),
      withEnabledBlockingInitialNavigation(),
      withViewTransitions(),
      withHashLocation()
    ),
    importProvidersFrom(SidebarModule, DropdownModule),
    IconSetService,
    provideAnimationsAsync(),
    provideHttpClient(
      // XSRF Protection: Angular inyectará automáticamente el token CSRF
      withXsrfConfiguration({
        cookieName: 'XSRF-TOKEN',
        headerName: 'X-XSRF-TOKEN'
      }),
      withInterceptors([
        jwtInterceptor,        // 1. Inyecta JWT token en headers
        timeoutInterceptor,    // 2. Aplica timeout a peticiones
        authInterceptor,       // 3. Validación de autenticación (existente)
        employeeInterceptor,   // 4. Lógica específica de empleados (existente)
        errorInterceptor,      // 5. Manejo centralizado de errores HTTP
        loadingInterceptor     // 6. Indicador de carga global (existente)
      ]),
    ),
    // Global Error Handler
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler
    }
  ]
};
