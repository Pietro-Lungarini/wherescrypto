import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { FirebaseErrorHandling } from '../../namespaces/error-auth';
import { AuthenticationService } from '../../services/authentication.service';


@Component({
	selector: 'app-forgot-password',
	templateUrl: './forgot-password.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordComponent implements OnInit, OnDestroy {

  passwordHide = false;
  passwordValidators = {
  	minLength: 8,
  	maxLength: 30
  };

  resetPswForm = new FormGroup({
  	password: new FormControl(null, [
  		Validators.required,
  		Validators.minLength(this.passwordValidators.minLength),
  		Validators.maxLength(this.passwordValidators.maxLength)
  	]),
  	passwordConfirm: new FormControl(null, [ Validators.required ]),
  });
  verifyEmail = new FormGroup({
  	verifyEmailInput: new FormControl(null, [Validators.required, Validators.email])
  });

  // eslint-disable-next-line @typescript-eslint/dot-notation
  mode = this.route.snapshot.queryParams['mode'] || 'verifyEmail';
  oobCode = this.route.snapshot.queryParamMap.get('oobCode') || '';
  hide: boolean = true;
  pageTitle = 'Imposta una nuova Password.';
  serverErrMessage: string = '';
  sendAnotherLinkBtnDisabled = true;
  timePassing = 120;
  sendPswEmailTries = 0;
  emailInputSub: Subscription | undefined | null;

  constructor(
    private authService: AuthenticationService,
    private route: ActivatedRoute,
    private router: Router,
    private cdRef: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
  	this.emailInputSub = this.verifyEmail.get('verifyEmailInput')?.valueChanges.subscribe(value => {
  		this.serverErrMessage = '';
  	});
  }

  ngOnDestroy(): void {
  	this.emailInputSub?.unsubscribe();
  }

  getEmailErrMsg(): string {
  	if (this.verifyEmail.get('verifyEmailInput')?.hasError('required')) {
  		return 'Inserisci la tua email.';
  	}

  	return this.verifyEmail.get('verifyEmailInput')?.hasError('email') ? 'Inserisci una email valida.' : '';
  }

  getPasswErrMsg(): string {
  	if (this.resetPswForm.get('password')?.hasError('required')) {
  		return 'Inserisci la tua password.';
  	}
  	if (this.resetPswForm.get('password')?.hasError('minlength')) {
  		return `La password deve contere almeno ${this.passwordValidators.minLength} caratteri.`;
  	}
  	if (this.resetPswForm.get('password')?.hasError('maxlength')) {
  		return `La password deve essere lunga massimo ${this.passwordValidators.maxLength} caratteri.`;
  	}
  	return 'Inserisci una password valida.';
  }

  canResetPsw(): boolean {
  	const password = this.resetPswForm.get('password')?.value;
  	const confirmPassword = this.resetPswForm.get('passwordConfirm')?.value;

  	if (this.resetPswForm.invalid) return false;
  	if (password !== confirmPassword) return false;

  	return true;
  }

  resetPassword(): any {
  	const password = this.resetPswForm.get('password')?.value;

  	if (!this.canResetPsw()) return;
  	this.authService.resetPassword(this.oobCode, password)
  		.then(res => {
  			this.router.navigateByUrl('/auth/login');
  		})
  		.catch(res => {
  			// eslint-disable-next-line max-len
  			this.serverErrMessage = 'Il codice potrebbe essere scaduto. Prova a ripetere il processo di reset della password o contatta l\'assitenza.';
  			this.cdRef.detectChanges();
  		});
  }

  linkDisabledTimer(): void {
  	const clear = () => {
  		clearInterval(timer);
  		this.sendAnotherLinkBtnDisabled = false;
  		this.cdRef.detectChanges();
  		this.timePassing = 120;
  	};
  	const timer = setInterval(() => {
  		if (this.timePassing > 0) {
  			this.timePassing--;
  			this.cdRef.detectChanges();
  		} else clear();
  	}, 1000);
  }

  sendResPswEmail(): any {
  	const email = this.verifyEmail.get('verifyEmailInput')?.value;
  	this.authService.sendResetPswEmail(email)
  		.then((res: any) => {
  			this.mode = 'verifyEmailCode';
  			this.pageTitle = 'Link Inviato';
  			this.sendPswEmailTries++;
  			this.cdRef.detectChanges();
  		})
  		.catch((err: any) => {
  			console.error('ERR', err);
  			this.serverErrMessage = FirebaseErrorHandling.convertMessage(err.code, 'it');
  			this.cdRef.detectChanges();
  		});
  	this.linkDisabledTimer();
  }

  sendAnotherLink(): any {
  	this.sendAnotherLinkBtnDisabled = true;
  	if (this.sendPswEmailTries >= 4) {
  		this.serverErrMessage = 'Hai fatto troppi tentativi. Riprova tra 10 minuti.';
  		this.cdRef.detectChanges();
  		return;
  	}
  	this.sendResPswEmail();
  	this.linkDisabledTimer();
  }

}
