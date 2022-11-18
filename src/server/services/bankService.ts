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

export async function fullfillTransfer(params: {
	transactionId: string;
	proof: string;
}) {
	// REVIEW - all here should go into sql transactions
	const { transactionId, proof } = params;
	const tx = await prisma.transaction.findUnique({
		where: {
			id: transactionId,
		},
		include: {
			requsition: {
				include: {
					credentialType: true,
				},
			},
			credentialOffer: {
				select: {
					issuerId: true,
				},
			},
		},
	});

	// adjust balances
	const verifierDecrementAmount = tx.price;
	const issuerIncrementAmount = tx.requsition.credentialType.price;
	const walletIncrementAmount = tx.price * 0.2; // 20% of the price goes to the wallet
	const payvcIncrementAmount = tx.price - (issuerIncrementAmount + walletIncrementAmount);
	const percentageToPayVC = (payvcIncrementAmount / tx.price) * 100;
	const percentageToIssuer = (issuerIncrementAmount / tx.price) * 100;
	const percentageToWallet = (walletIncrementAmount / tx.price) * 100;

	const payVCBusiness = await prisma.business.findUnique({
		where: {
			slug: "payvc",
		},
	});
	if (!payVCBusiness) {
		throw new Error("PayVC business not found");
	}
	// Update transaction status
	const updatedTx = await prisma.transaction.update({
		where: {
			id: transactionId,
		},
		data: {
			proof: proof,
			transactionStatus: TransactionStatus.FULLFILLED,
			balances: {
				updateMany: [
					{
						where: {
							businessId: tx.walletId,
						},
						data: {
							amount: {
								increment: walletIncrementAmount,
							},
							logs: {
								push: `Transaction ${transactionId} fullfilled. ${walletIncrementAmount}(${percentageToWallet}%) of the price goes to Wallet`,
							},
						},
					},
					{
						where: {
							businessId: tx.credentialOffer.issuerId,
						},
						data: {
							amount: {
								increment: issuerIncrementAmount,
							},
							logs: {
								push: `Transaction ${transactionId} fullfilled. ${issuerIncrementAmount}(${percentageToIssuer}%) of the price goes to Issuer`,
							},
						},
					},
					{
						where: {
							businessId: tx.requsition.verifierId,
						},
						data: {
							amount: {
								decrement: verifierDecrementAmount,
							},
							logs: {
								push: `Transaction ${transactionId} fullfilled. ${verifierDecrementAmount} was deducted from your balance`,
							},
						},
					},
					{
						where: {
							businessId: payVCBusiness.id,
						},
						data: {
							amount: {
								increment: payvcIncrementAmount,
							},
							logs: {
								push: `Transaction ${transactionId} fullfilled. ${payvcIncrementAmount}(${percentageToPayVC}%) of the price goes to PayVC`,
							},
						},
					},
				],
			},
		},
	});
	return updatedTx;
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
	const { amount, credentialOfferId, currency, requisitionId, walletId, issuerId, verifierId } = params;
	const balanceWallet = await ensureBalance(amount, currency, walletId);
	const balanceVerifier = await ensureBalance(amount, currency, verifierId);
	const balanceIssuer = await ensureBalance(amount, currency, issuerId);
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
			balances: {
				connect: [
					{
						id: balanceWallet.id,
					},
					{
						id: balanceVerifier.id,
					},
					{
						id: balanceIssuer.id,
					},
				],
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