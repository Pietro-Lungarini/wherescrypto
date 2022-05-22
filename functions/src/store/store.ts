import { encodeURL } from '@solana/pay';
import { PublicKey } from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import * as admin from 'firebase-admin';
import { Product } from '../models/product.model';
import { logger } from '../utils/utils';
let pubKey = '';

const getPublicKey = async (): Promise<string | undefined> => {
	if (pubKey) return pubKey;
	const res = await admin.firestore().doc('shop/settings').get();
	if (!res) return;
	pubKey = res.data()?.pubKey;
	return pubKey;
};

const getProduct = async (id?: string): Promise<Product | undefined> => {
	if (!id) return undefined;
	const res = (
		await admin.firestore().doc(`shop/listings/products/${id}`).get()
	).data();
	if (!res) return undefined;
	return res as Product;
};

export const getTransactionUrl = async (data: {
	productId: string;
}): Promise<any> => {
	const id = data.productId || undefined;
	const product = await getProduct(id);

	if (!id || !product) {
		logger.error('Invalid Product id or data.');
		return 'Invalid product id or product data.';
	} else if (!product.amount || product.amount < 0) {
		logger.error('Invalid Product amount.');
		return 'Invalid product amount.';
	}

	const key = await getPublicKey();
	const spl = product?.contract;

	if (!key || typeof key !== 'string') {
		return 'Invalid public key.';
	}

	const url = encodeURL({
		recipient: new PublicKey(key),
		amount: new BigNumber(product.amount),
		label: product.label,
		memo: product.memo,
		message: product.name,
		splToken: spl ? new PublicKey(spl) : undefined,
	});

	return url;
};

export const setPubKey = (key: string): void => {
	pubKey = key;
};
