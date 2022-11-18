import { PaymentStatus, PaymentType, Currency, TransactionRequsitionStatus, TransactionStatus } from "@prisma/client";
import { prisma } from "./../../db";
export async function transfer(amount: number, currency: Currency, fromBusinessId: string, toBusinessId: string) {}

export async function initiateDeposit(amount: number, currency: Currency, businessId: string) {
	const balance = await ensureBalance(amount, currency, businessId);
	const payment = await prisma.payment.create({
		data: {
			amount,
			status: PaymentStatus.CREATED,
			type: PaymentType.DEPOSIT,
			businessId,
			balanceId: balance.id,
		},
		include: {
			balance: true,
		},
	});
	return payment;
}

export async function verifyDeposit(paymentId: string) {
	const payment = await prisma.payment.findUnique({
		where: {
			id: paymentId,
		},
	});
	if (!payment) {
		throw new Error("Payment not found");
	}
	if (payment.status !== PaymentStatus.CREATED) {
		throw new Error("Payment is not in created state");
	}
	const updatedPayment = await prisma.payment.update({
		where: {
			id: paymentId,
		},
		data: {
			status: PaymentStatus.COMPLETED,
			balance: {
				update: {
					amount: {
						increment: payment.amount,
					},
				},
			},
		},
		include: {
			balance: true,
		},
	});

	return updatedPayment;
}

export async function intiateTransfer(params: {
	amount: number;
	currency: Currency;
	walletId: string;
	requisitionId: string;
	credentialOfferId: string;
	issuerId: string;
	verifierId: string;
}) {
	const { amount, credentialOfferId, currency, requisitionId, walletId } = params;
	const balanceWallet = await ensureBalance(amount, currency, walletId);
	const balanceVerifier = await ensureBalance(amount, currency, walletId);
	const balanceIssuer = await ensureBalance(amount, currency, walletId);
	const tx = await prisma.transaction.create({
		data: {
			transactionRequsitionStatus: TransactionRequsitionStatus.REQUESTED_BY_WALLET,
			transactionStatus: TransactionStatus.CREATED,
			price: amount,
			wallet: {
				connect: {
					id: walletId,
				},
			},
			requsition: {
				connect: {
					id: requisitionId,
				},
			},
			credentialOffer: {
				connect: {
					id: credentialOfferId,
				},
			},
		},
	});
	return tx;
}

export async function ensureBalance(amount: number, currency: Currency, businessId: string) {
	let balance = await prisma.balance.findUnique({
		where: {
			businessCurrency: {
				businessId,
				currency,
			},
		},
	});
	if (!balance) {
		balance = await this.prisma.balance.create({
			data: {
				amount,
				currency,
				businessId,
			},
		});
		if (!balance) {
			throw new Error("Failed to create balance");
		}
	}
	return balance;
}
