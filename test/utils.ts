import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

export const MANAGER_ROLE = ethers.utils.id('MANAGER_ROLE');
export const PAUSER_ROLE = ethers.utils.id('PAUSER_ROLE');
export const UPGRADER_ROLE = ethers.utils.id('UPGRADER_ROLE');
export const ADMIN_ROLE = ethers.constants.HashZero;

export const DECIMALS = 8;

export const getAccessError = (signer: SignerWithAddress, role: string) =>
  `AccessControl: account ${signer.address.toLowerCase()} is missing role ${role}`;

export const getOrderStatusError = (status: string) =>
  `Market: order should has ${status} status`;

export const Errors = {
  INVALID_ORDER_ID: "Market: order's ID is invalid",
  TOKEN_IS_NOT_ALLOWED: 'Market: token can not be accepted',
  ZERO_AMOUNT: 'Market: amount is zero',
  VAULT_IS_NOT_SET: 'Market: vault address was not set',
  NO_SHAREHOLDERS: 'Market: no shareholders in the market',
  NOT_ENOUGH_SHARES: 'Market: account does not have enough shares',
};

export const OrderStatus = {
  EMPTY: ethers.constants.HashZero,
  CREATED: ethers.utils.id('ORDER_STATUS_CREATED'),
  CANCELED: ethers.utils.id('ORDER_STATUS_CANCELED'),
  COMPLETED: ethers.utils.id('ORDER_STATUS_COMPLETED'),
};
