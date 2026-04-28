import { normalization, mccRiskData } from './startup.mjs';

const numberOfDimensions = 14;

export const transactionVector = new Float32Array(numberOfDimensions);

const limitVectorValue = (value) => {
  if (value > 1.0) return 1.0;
  if (value < 0.0) return 0.0;
  return value;
};

export const buildTransactionVector = (payload) => {
  const timestamp = payload.transaction.requested_at;
  const transactionDate = new Date(timestamp);
  const hourNormalized = transactionDate.getUTCHours() / 23;
  const dayOfWeekNormalized = ((transactionDate.getUTCDay() + 6) % 7) / 6;

  const { minutesSinceLastTx, kmFromLastTx } = vectorizeLastTransaction(payload, transactionDate);

  const isUnknownMerchant = payload.customer.known_merchants.includes(payload.merchant.id) ? 0 : 1;
  const mccRiskScore = mccRiskData[payload.merchant.mcc] ?? 0.5;

  const transactionVector = [
    limitVectorValue(payload.transaction.amount / normalization.max_amount),
    limitVectorValue(payload.transaction.installments / normalization.max_installments),
    limitVectorValue((payload.transaction.amount / payload.customer.avg_amount) / normalization.amount_vs_avg_ratio),
    hourNormalized,
    dayOfWeekNormalized,
    minutesSinceLastTx,
    kmFromLastTx,
    limitVectorValue(payload.terminal.km_from_home / normalization.max_km),
    limitVectorValue(payload.customer.tx_count_24h / normalization.max_tx_count_24h),
    payload.terminal.is_online ? 1 : 0,
    payload.terminal.card_present ? 1 : 0,
    isUnknownMerchant,
    mccRiskScore,
    limitVectorValue(payload.merchant.avg_amount / normalization.max_merchant_avg_amount)
  ];

  return transactionVector;
};

const vectorizeLastTransaction = (payload, transactionDate) => {
  let minutesSinceLastTx = -1;
  let kmFromLastTx = -1;

  if (payload.last_transaction) {
    const diffMilliseconds = transactionDate - new Date(payload.last_transaction.timestamp);
    const diffMinutes = diffMilliseconds / 60000;
    minutesSinceLastTx = limitVectorValue(diffMinutes / normalization.max_minutes);
    kmFromLastTx = limitVectorValue(payload.last_transaction.km_from_current / normalization.max_km);
  }

  return { minutesSinceLastTx, kmFromLastTx };
};
