import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { UserCredential } from '@angular/fire/auth';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthenticationService } from '../../services/authentication.service';
import { FirebaseErrorHandling } from './../../namespaces/error-auth';



@Component({
	selector: 'app-login',
	templateUrl: './login.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent implements OnInit {

  @Input() pageTitle = 'Accedi al tuo account';

  passwordValidators = {
  	minLength: 8,
  	maxLength: 30
  };

  form = new FormGroup({
  	email: new FormControl('', [Validators.required, Validators.email]),
  	password: new FormControl('', [
  		Validators.required,
  		Validators.minLength(this.passwordValidators.minLength),
  		Validators.maxLength(this.passwordValidators.maxLength)
  	])
  });
  loginError: string = '';
  hide = true;
  hasResetPsw = this.route.snapshot.queryParams['resetPassword'];

  constructor(
    private route: ActivatedRoute,
    private db: AuthenticationService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
  	const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
  	if (returnUrl) {
  		localStorage.setItem('returnUrl', returnUrl);
  		this.pageTitle = 'Accedi per continuare';
  	}
  	if (this.hasResetPsw) {
  		// TODO Manage alert to proceed after password reset.
  	}
  }

  getEmailErrMsg(): string {
  	if (this.form.controls.email.hasError('required')) {
  		return 'Inserisci la tua email.';
  	}

  	return this.form.controls.email.hasError('email') ? 'Inserisci una email valida.' : '';
  }

  getPasswErrMsg(): string {
  	if (this.form.controls.password.hasError('required')) {
  		return 'Inserisci la tua password.';
  	}
  	if (this.form.controls.password.hasError('minlength')) {
  		return `La password deve contere almeno ${this.passwordValidators.minLength} caratteri.`;
  	}
  	if (this.form.controls.password.hasError('maxlength')) {
  		return `La password deve essere lunga massimo ${this.passwordValidators.maxLength} caratteri.`;
  	}
  	return 'Inserisci una password valida.';
  }

  emailLogin(form: FormGroup): Promise<UserCredential> | Promise<any> {
  	this.loginError = '';
  	return this.db.emailLogin(
  		form.value.email,
  		form.value.password
  	).then(res => res).catch(err => {
  		// eslint-disable-next-line @typescript-eslint/dot-notation
  		this.loginError = FirebaseErrorHandling.convertMessage(err['code'], 'it');
  		this.cdRef.detectChanges();
  		return err;
  	});
  }

}
