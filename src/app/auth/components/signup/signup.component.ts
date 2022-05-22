import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { UserCredential } from '@angular/fire/auth';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthenticationService } from '../../services/authentication.service';
import { FirebaseErrorHandling } from './../../namespaces/error-auth';


@Component({
	selector: 'app-signup',
	templateUrl: './signup.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignupComponent implements OnInit {

  passwordValidators = {
  	minLength: 8,
  	maxLength: 30
  };

  form = new FormGroup({
  	firstName: new FormControl('', [Validators.required]),
  	lastName: new FormControl('', [Validators.required]),
  	email: new FormControl('', [Validators.required, Validators.email]),
  	password: new FormControl('', [
  		Validators.required,
  		Validators.minLength(this.passwordValidators.minLength),
  		Validators.maxLength(this.passwordValidators.maxLength)
  	]),
  	termsAndConditions: new FormControl(false)
  });
  loginError: string = '';
  hide = true;

  constructor(
    private db: AuthenticationService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
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

  emailSignup(form: FormGroup): Promise<UserCredential> | Promise<any> | void {
  	if (!form.controls.termsAndConditions.value) {
  		this.loginError = 'Devi accettare le Condizioni Generali per continuare.';
  		return;
  	}
  	const titleCase = (str: string): string => {
  		const name: string[] = [];
  		str.split(' ').forEach(word => {
  			name.push(word[0].toUpperCase() + word.slice(1));
  		});
  		return name.join(' ');
  	};
  	this.loginError = '';
  	return this.db.emailSignup(
  		form.value.email,
  		form.value.password,
  		{
  			fullName:
					titleCase(form.value.firstName + ' ' + form.value.lastName)
  		}
  	).then(res => {
  		if (res === undefined) return;
  		this.loginError = FirebaseErrorHandling.convertMessage((res as any).code, 'it');
  		this.cdRef.detectChanges();
  		return res;
  	}).catch(err => {
  		this.loginError = FirebaseErrorHandling.convertMessage(err.code, 'it');
  		this.cdRef.detectChanges();
  		return err;
  	});
  }

}
