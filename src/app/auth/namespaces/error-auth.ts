/* eslint-disable max-len */
interface CustomObject { [key: string]: string }
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace FirebaseErrorHandling {
    const i18n: { [key: string]: CustomObject } = {
    	it: {
    		default: 'Errore sconosciuto. Ricarica la pagina o contatta l\'assistenza se il problema persiste.',
    		'user-disabled': 'Il tuo account è stato disabilitato. Contatta l\'assistenza.',
    		'user-not-found': 'Non esiste nessun utente con queste credenziali.',
    		'email-not-found': 'Questa email non appartiene a nessun account. Riprova.',
    		'email-already-exists': 'Questa email è già stata utilizzata per un\'altro account. Prova ad accedere.',
    		'email-already-in-use': 'Questa email è già stata utilizzata per un\'altro account. Prova ad accedere.',
    		'wrong-password': 'La password non è corretta, o forse ti sei registrato con un provider esterno (es. Google, Facebook, etc...).',
    		'network-request-failed': 'Impossibile completare la richiesta. Controlla la connessione ad Internet.',
    		'too-many-requests': 'Hai eseguito troppe richieste. Prenditi una pausa, e riprova fra qualche minuto!',
    		'requires-recent-login': 'Per favore, accedi nuovamente al tuo account e riprova.',
    		'phone-number-already-exists': 'Questo numero di telefono è già in uso da un\'altro utente.',
    		'invalid-phone-number': 'Il numero di telefono non è valido. Impossibile completare la richiesta.',
    		'invalid-email': 'L\'indirizzo email fornito non è valido. Riprova.',
    		'cannot-delete-own-user-account': 'Non è possibile eliminare il proprio account. Contatta l\'assistenza.',
    	},
    	en: {
    		default: 'Unknown error. Please check that you have done an allowed operation and try again, or contact support.',
    		'user-disabled': 'Your account has been disabled. Contact support.',
    		'user-not-found': 'No user with these credentials was found.',
    		'email-not-found': 'No user with these email was found. Try again.',
    		'email-already-exists': 'This email already exists. If it\'s your account, try logging in.',
    		'email-already-in-use': 'This email already exists. If it\'s your account, try logging in.',
    		'wrong-password': 'The password is incorrect or you have registered with an external provider (eg. Google, Facebook, etc ...).',
    		'network-request-failed': 'You\'re offline. Check your connection.',
    		'too-many-requests': 'Too many requests were made from your device. Take a break!',
    		'requires-recent-login': 'Please log back into your account and try again.',
    		'phone-number-already-exists': 'This phone number is already in use by another user.',
    		'invalid-phone-number': 'This phone number is not valid. Unable to continue with request.',
    		'invalid-email': 'The email address is invalid.',
    		'cannot-delete-own-user-account': 'You cannot delete your account.',
    	}
    };

    export const convertMessage = (code: string, language?: 'it' | 'en'): string => {
    	if (!code) return '';
    	language = language ? language : 'en';
    	const formattedCode = code.split('/')[1];

    	if (code.includes('auth/') && formattedCode && formattedCode in i18n[language]) {
    		return i18n[language][formattedCode];
    	}

    	return i18n[language].default;
    };
}
