/* eslint-disable no-case-declarations */

import axios from 'axios';
import * as admin from 'firebase-admin';
import { config as env } from 'firebase-functions';
import * as puppeteer from 'puppeteer';
import { Subject, Subscription } from 'rxjs';
import { iGeniusRequestedUsers, iGeniusUser, iGeniusUserResponse } from '../models/igenius.model';
import { logger as log } from '../utils/utils';

const username = env().igenius.username;
const password = env().igenius.password;
const apiKey = env().igenius.apikey;
const siteKey = env().igenius.sitekey;
const pageUrl = env().igenius.pageurl;

const res$ = new Subject<iGeniusUserResponse>();
let sub: Subscription;

const DEBUG_LOGS = false;
const DB_PATH = 'verifyUsers/';
const ADMIN_IGENIUS_ID = 247849;

const logger = {
	info: (obj: any, at?: string) => {
		if (DEBUG_LOGS) log.info(obj, at);
		else return;
	},
	error: (obj: any, at?: string) => {
		if (DEBUG_LOGS) log.error(obj, at);
		else return;
	},
};

const getRequestedUsers = async (id: number, reqUser: iGeniusRequestedUsers) => {
	let res = [];
	res.push(reqUser);

	if (!id) return res;
	const db = admin.firestore();
	const docRef = db.doc(DB_PATH + id);
	const doc = await docRef.get();

	if (!doc.exists) return res;

	const data = doc.data() as iGeniusUserResponse;
	res = res.concat(data.requestedUsers || []);

	return res;
};

const sendUpdates = (id: number) => {
	sub = res$.asObservable().subscribe(async (data) => {
		if (!data) return;
		const db = admin.firestore();
		const docRef = db.doc(DB_PATH + id);
		const exists = (await docRef.get()).exists;

		if (!exists) {
			return await docRef.set({
				...data,
				createdAt: new Date(),
				updatedAt: new Date(),
			});
		}

		return await docRef.update({
			...data,
			updatedAt: new Date(),
		});
	});
};

export const isClientActive = (user?: iGeniusUser): boolean => {
	if (!user) return false;
	if (user.id == ADMIN_IGENIUS_ID) return false;

	const lastOrder = user.lastOrder;
	if (!lastOrder) return false;
	lastOrder.setDate(lastOrder.getDate() + 29);
	const timeDiff = new Date().valueOf() - lastOrder.valueOf();
	const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

	// Se valore positivo, vuol dire che mancano dei giorni,
	// Se valore negativo, vuol dire che è scaduto
	return daysDiff >= 0;
};

const checkIfExists = async (id: number): Promise<iGeniusUser | undefined> => {
	const db = admin.firestore();
	const docRef = db.doc(DB_PATH + id);
	const doc = await docRef.get();

	if (doc.exists) {
		const data = doc.data() as iGeniusUserResponse;

		const isActive = isClientActive(data.user);

		if (!isActive) {
			return undefined;
		} else {
			return { ...data.user, isActive: true };
		}
	} else {
		return undefined;
	}
};

const addiGeniusUserToUser = async (uid?: string, user?: iGeniusUser) => {
	const db = admin.firestore();
	const docRef = db.doc(`users/${uid}`);
	await docRef.set({ igeniusUser: { ...user, updatedAt: new Date()} }, { merge: true });
	return;
};

export const verifyClient = async (
	userId: number,
	reqUser: iGeniusRequestedUsers,
): Promise<iGeniusUser | undefined> => {
	logger.info(`Verifying client with iGenius ID: ${userId}`, 'verifyClient');

	res$.next({
		completion: 0,
		completionMsg: 'Sto ingranando',
	});

	// Initializers
	sendUpdates(userId);
	const reqUsers = await getRequestedUsers(userId, reqUser);

	res$.next({
		completion: 0,
		completionMsg: 'Sto ingranando',
		requestedUsers: reqUsers,
	});

	const user = await checkIfExists(userId);
	if (user) {
		log.info(`User with id ${userId} exists and is active.`);
		addiGeniusUserToUser(reqUser.uid, user);
		res$.next({
			completion: 100,
			completionMsg: 'Tutto regolare, ti faccio accedere',
		});
		return user;
	} else {
		log.info(`User with id ${userId} does not exists and is not active. Fetching user...`);
	}

	let tries = 0;

	const browser = await puppeteer.launch({
		headless: true,
		slowMo: 0,
		ignoreHTTPSErrors: true,
		args: [
			'--disable-gpu',
			'--disable-dev-shm-usage',
			'--disable-setuid-sandbox',
			'--single-process',
			'--no-zygote',
			'--no-sandbox',
			/* '--window-size=1280,720', */ // For screenshot debugging
		],
	});

	try {
		const page = await browser.newPage();
		logger.info('Page Created', 'verifyClient');
		res$.next({
			completion: 14.3,
			completionMsg: 'Mi sto connettendo al sito di iGenius',
		});

		await page.goto('https://igenius.biz/login.html', {
			timeout: 120000,
			waitUntil: 'networkidle2',
		});

		logger.info('Page Loaded', 'verifyClient');
		res$.next({
			completion: 28.6,
			completionMsg: 'Ok, sono sul sito di iGenius',
		});

		const timeout = (mills: number) => new Promise((resolve) => setTimeout(resolve, mills));

		const bypassWebsiteCaptcha = async () => {
			logger.info('Solving Captcha...', 'verifyClient > bypassWebsiteCaptcha');
			res$.next({
				completion: 57.2,
				completionMsg: 'Oh oh... Devo dimostrare di non essere un robot',
			});

			try {
				const { data: res } = await axios({
					method: 'get',
					url: `http://2captcha.com/in.php?key=${apiKey}&method=hcaptcha&sitekey=${siteKey}&pageurl=${pageUrl}&json=1`,
				});
				logger.info(
					'Sent to 2Captcha to solve it',
					'verifyClient > bypassWebsiteCaptcha'
				);
				await timeout(25 * 1000); // Wait for 25 seconds
				res$.next({
					completion: 71.5,
					completionMsg: 'Sono un robot, ma dovrebbe funzionare',
				});
				const { data } = await axios({
					method: 'get',
					url: `http://2captcha.com/res.php?key=${apiKey}&action=get&id=${res.request}&json=1`,
				});
				logger.info(
					'2captcha responded with:',
					'verifyClient > bypassWebsiteCaptcha'
				);
				logger.info(data.request, 'verifyClient > bypassWebsiteCaptcha');
				if (data.request.includes('NOT_READY')) {
					res$.next({
						completion: 78.3,
						completionMsg: 'Devo temporeggiare un attimo',
					});
					await timeout(10 * 1000); // Wait for 10 seconds;
					const { data: retry } = await axios({
						method: 'get',
						url: `http://2captcha.com/res.php?key=${apiKey}&action=get&id=${res.request}&json=1`,
					});
					return retry;
				}
				return data;
			} catch (err) {
				logger.error(err, 'verifyClient > bypassWebsiteCaptcha');
			}
		};

		const login = async (): Promise<iGeniusUser | undefined> => {
			logger.info('Trying to login', 'verifyClient > login');
			res$.next({
				completion: 42.9,
				completionMsg: 'Accedo ad iGenius',
			});

			const { request } = await bypassWebsiteCaptcha();

			await page.evaluate('document.querySelector(".h-captcha").style.display = "block"');
			await page.evaluate('document.querySelector("textarea[name=\'g-recaptcha-response\']").style.display = "block"');
			await page.evaluate('document.querySelector("textarea[name=\'h-captcha-response\']").style.display = "block"');

			await page.type('input[name="username"]', username);
			await page.type('input[name="password"]', password);
			await page.type('textarea[name="g-recaptcha-response"]', request);
			await page.type('textarea[name="h-captcha-response"]', request);

			logger.info('Ho scritto le risposte nei campi');

			await page.evaluate('document.querySelector("form.login-form").submit()');

			logger.info('LOGIN SUBMIT', 'verifyClient > login');
			res$.next({
				completion: 85.8,
				completionMsg: 'Indovina? Sta funzionando eheheh',
			});

			await page.waitForNavigation({
				timeout: 120000,
				waitUntil: 'domcontentloaded',
			});

			return await checkLogin();
		};

		const getUserDetails = (tds: string[]) => {
			/* const tds = document.querySelectorAll(
				'table.datatable-downline tbody tr:nth-child(1) td'
			); */
			if (tds.length <= 0) {
				logger.error('Unable to retrieve TDs', 'verifyClient > getUserDetails');
				return;
			}
			const user: iGeniusUser = {};
			const parseNumber = (num?: string): number => {
				const normNum = num ? num.replace(',', '') : '0';
				return parseFloat(normNum);
			};
			tds.forEach((str, i) => {
				const text = str.includes('&nbsp;') ? '' : str;
				switch (i) {
				case 0:
					break;
				case 1: // ID
					user.id = parseNumber(text);
					break;
				case 2: // Name
					user.name = text;
					break;
				case 3: // Country
					const iStartFlag = text.indexOf('flags/');
					const iEndFlag = text.indexOf('.png');
					const flagStr = text.slice(iStartFlag, iEndFlag).replace('flags/', '');
					user.country = flagStr;
					break;
				case 4: // PV
					user.pv = parseNumber(text);
					break;
				case 5: // Enroll Volume
					user.enrollVolume = parseNumber(text);
					break;
				case 6: // QEV
					user.qev = parseNumber(text);
					break;
				case 7: // BV Left
					user.bvLeft = parseNumber(text);
					break;
				case 8: // BV Right
					user.bvRight = parseNumber(text);
					break;
				case 9: // Active Left
					user.activeLeft = parseNumber(text);
					break;
				case 10: // Active Right
					user.activeRight = parseNumber(text);
					break;
				case 11: // Current Rank
					user.currentRank = text;
					break;
				case 12: // Highest Rank
					user.highestRank = text;
					break;
				case 13: // Subscription
					user.subscription = text;
					break;
				case 14: // 4 Week Rolling Left
					user.monthRollingLeft = parseNumber(text);
					break;
				case 15: // 4 Week Rolling Right
					user.monthRollingRight = parseNumber(text);
					break;
				case 16: // Left + Holding
					user.leftAndHolding = parseNumber(text);
					break;
				case 17: // Right + Holding
					user.rightAndHolding = parseNumber(text);
					break;
				case 18: // Last Order Date
					user.lastOrder = new Date(text);
					break;
				case 19: // Last Order BV
					user.lastOrderBV = parseNumber(text);
					break;
				case 20: // Join Date
					user.joinDate = new Date(text);
					break;
				case 21: // Username
					user.username = text;
					break;
				case 22: // Enroller Name
					user.enrollerName = text;
					break;
				case 23: // Email
					/* const iStartEmail = text.indexOf('\\">');
					const iEndEmail = text.indexOf('.png');
					const emailStr = text.slice(iStartEmail, iEndEmail).replace('flags/', ''); */
					user.email = text;
					break;

				default:
					break;
				}
			});

			const isActive = isClientActive(user);

			return { ...user, isActive };
		};

		const elabHtml = async (): Promise<iGeniusUser | undefined> => {
			logger.info('Elaboring HTML', 'verifyClient > elabHtml');
			await page.goto(
				'https://shield.igenius.biz/client_homepage.dhtml?a=1&language=EN', {
					timeout: 120000,
					waitUntil: 'networkidle2',
				}
			);
			await page.goto(
				`https://shield.igenius.biz/downline.dhtml?a=1&daterange=&view=enroller&xuserid=${userId}`, {
					timeout: 120000,
					waitUntil: 'networkidle2',
				}
			);

			const href = await page.evaluate(() => location.href);
			logger.info(`HREF is ${href}`, 'verifyClient > elabHtml');

			logger.info('Getting User Details...', 'verifyClient > getUserDetails');
			const tds = await page.$$eval('table.datatable-downline tbody tr:nth-child(1) td', (tdsArr) => tdsArr.map((td) => td.innerHTML));

			let u = getUserDetails(tds);
			if (!u) throw new Error('Unable to retrieve TDs');
			res$.next({
				completion: 97,
				completionMsg: 'Ce l\'ho fatta, un attimo solo',
				error: '',
			});
			await addiGeniusUserToUser(reqUser.uid, u);
			const isActive = isClientActive(u);
			u = { ...u, isActive };
			await timeout(5 * 1000); // Wait for 5 seconds
			if (isActive) {
				res$.next({
					completion: 100,
					completionMsg: 'Tutto regolare, ti faccio accedere',
					user: u,
				});
			} else {
				res$.next({
					completion: 100,
					completionMsg: 'Oh oh... Purtroppo non hai una sottoscrizione attiva su iGenius. Verifica di aver inserito il codice cliente corretto o di avere una membership attiva',
					user: u,
				});
			}
			res$.complete();
			await browser.close();
			if (sub) sub.unsubscribe();
			return u;
		};

		const checkLogin = async (): Promise<iGeniusUser | undefined> => {
			const href = await page.evaluate(() => location.href);
			logger.info(`HREF is ${href}`, 'verifyClient > checkLogin');
			if (href.includes('login')) {
				const defaultTimer = 30 * 1000;
				const timer = tries <= 0 ? defaultTimer : defaultTimer * tries;
				tries += 1;
				const normTimer = timer > 18000000 ? 18000000 : timer;
				const consoleTimer =
					normTimer >= 3600000 ?
						normTimer / 60 / 60 / 1000 :
						normTimer / 60 / 1000;
				logger.error(
					`[LOGIN FAILED] Waiting for ${consoleTimer} ${
						normTimer >= 3600000 ? 'hours' : 'minutes'
					}`,
					'verifyClient > checkLogin'
				);
				res$.next({
					completion: 28.6,
					completionMsg: `Uffa, non ha funzionato 😢 Riprovo fra ${consoleTimer} ${
						consoleTimer == 1 ?
							normTimer >= 3600000 ?
								'oretta' :
								'minutino' :
							normTimer >= 3600000 ?
								'orette' :
								'minutini'
					}, puoi chiudere questa pagina se vuoi, ti avviserò via email appena ci sarò riuscito`,
				});
				await timeout(normTimer);
				return;
				/* return await login(); */
			}
			logger.info('LOGGED SUCCESFULLY', 'verifyClient > checkLogin');
			return await elabHtml();
		};

		return await login();
	} catch (error) {
		const normErr = typeof error === 'string' ? error : JSON.stringify(error);
		/* res$.next({
			completion: 0,
			completionMsg:
				'Oh oh... C\'è stato un problemino, ho avvisato lo staff. Puoi chiudere questa pagina, ti aggiornerò via email appena avrò verificato il tuo account',
			error: normErr,
		}); */
		res$.complete();
		await browser.close();
		logger.error(normErr, 'verifyClient');
		return;
	} finally {
		if (sub) sub.unsubscribe();
	}
};
