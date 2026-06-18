import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, Subject, BehaviorSubject } from 'rxjs';
import { SoapService } from './soap.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private namespace = 'http://ecuaviptour.com/soap/auth';
  private isBrowser: boolean;
  
  private authModalSubject = new Subject<{ isLogin?: boolean, rol?: string } | void>();
  authModal$ = this.authModalSubject.asObservable();

  private currentUserSubject = new BehaviorSubject<any>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private http: HttpClient,
    private router: Router,
    private soapService: SoapService
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      this.currentUserSubject.next(this.getUsuario());
    }
  }

  login(credentials: any): Observable<any> {
    return this.soapService.post(this.namespace, 'loginRequest', {
      correo: credentials.correo,
      password: credentials.password
    }).pipe(
      tap((res: any) => {
        if (res.token) {
          this.setToken(res.token);
          this.updateCurrentUserLocal(res.usuario);
          this.redirectByRole(res.usuario?.rol);
        }
      })
    );
  }

  register(userData: any): Observable<any> {
    return this.soapService.post(this.namespace, 'registerRequest', {
      nombre: userData.nombre,
      correo: userData.correo,
      password: userData.password,
      telefono: userData.telefono,
      cedula: userData.cedula,
      rol: userData.rol
    }).pipe(
      tap((res: any) => {
        if (res.token) {
          this.setToken(res.token);
          this.updateCurrentUserLocal(res.usuario);
          this.redirectByRole(res.usuario?.rol);
        }
      })
    );
  }

  updateProfile(userData: any): Observable<any> {
    return this.soapService.post(
      this.namespace,
      'updateProfileRequest',
      {
        nombre: userData.nombre,
        telefono: userData.telefono,
        fotoPerfilUrl: userData.foto_perfil_url,
        cedula: userData.cedula,
        password: userData.password,
        correo: userData.correo
      },
      this.getToken() || undefined
    ).pipe(
      tap((res: any) => {
        if (res.usuario) {
          this.updateCurrentUserLocal(res.usuario);
        }
      })
    );
  }

  uploadAvatar(file: File): Observable<any> {
    return new Observable(observer => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64Data = reader.result as string;
        this.soapService.post(
          this.namespace,
          'uploadAvatarRequest',
          { fotoBase64: base64Data, filename: file.name },
          this.getToken() || undefined
        ).subscribe({
          next: (res) => {
            if (res.usuario) {
              this.updateCurrentUserLocal(res.usuario);
            }
            observer.next(res);
            observer.complete();
          },
          error: (err) => observer.error(err)
        });
      };
      reader.onerror = (error) => observer.error(error);
    });
  }

  redirectByRole(rol: string): void {
    if (rol === 'admin') {
      this.router.navigate(['/admin/monitor']);
    } else if (rol === 'chofer') {
      this.router.navigate(['/chofer/dashboard']);
    } else {
      this.router.navigate(['/cliente']);
    }
  }

  setToken(token: string): void {
    if (this.isBrowser) {
      localStorage.setItem('jwt_token', token);
    }
  }

  getToken(): string | null {
    if (this.isBrowser) {
      return localStorage.getItem('jwt_token');
    }
    return null;
  }
  
  getUsuario(): any {
    if (this.isBrowser) {
      const user = localStorage.getItem('ecuavip_user');
      return user ? JSON.parse(user) : null;
    }
    return null;
  }

  getRol(): string | null {
    return this.getUsuario()?.rol ?? null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  updateCurrentUserLocal(user: any) {
    if (this.isBrowser) {
      localStorage.setItem('ecuavip_user', JSON.stringify(user));
      this.currentUserSubject.next(user);
    }
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('ecuavip_user');
      this.currentUserSubject.next(null);
    }
  }

  openAuthModal(options?: { isLogin?: boolean, rol?: string }): void {
    this.authModalSubject.next(options);
  }
}
