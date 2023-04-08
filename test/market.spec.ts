import { expect } from 'chai';
import { ethers, upgrades } from 'hardhat';
import {
  WeederToken,
  Market,
  ERC20PresetMinterPauserUpgradeable,
} from '@types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {
  ADMIN_ROLE,
  DECIMALS,
  Errors,
  getAccessError,
  getOrderStatusError,
  MANAGER_ROLE,
  OrderStatus,
} from './utils';

describe('Market', () => {
  let owner: SignerWithAddress;
  let vault: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;

  let weederToken: WeederToken;
  let usdtToken: ERC20PresetMinterPauserUpgradeable;

  let market: Market;

  before('deploy contracts', async () => {
    const ERC20Factory = await ethers.getContractFactory(
      'ERC20PresetMinterPauserUpgradeable',
    );
    const weederTokenFactory = await ethers.getContractFactory('WeederToken');
    const marketFactory = await ethers.getContractFactory('Market');

    usdtToken = await upgrades
      .deployProxy(ERC20Factory, ['Tether', 'USDT'])
      .then((i) => i.deployed())
      .then((i) => i as ERC20PresetMinterPauserUpgradeable);
    weederToken = await upgrades
      .deployProxy(weederTokenFactory)
      .then((i) => i.deployed())
      .then((i) => i as WeederToken);
    market = await upgrades
      .deployProxy(marketFactory)
      .then((i) => i.deployed())
      .then((i) => i as Market);

    const signers = await ethers.getSigners();
    owner = signers[0];
    user1 = signers[1];
    user2 = signers[2];
    user3 = signers[3];
    vault = signers[4];
  });

  describe('distribute weeder tokens', () => {
    it('should transfer 100k tokens to user_1', async () => {
      const tx = weederToken.transfer(user1.address, 100_000 * 10 ** DECIMALS);

      await expect(tx)
        .to.emit(weederToken, 'Transfer')
        .withArgs(owner.address, user1.address, 100_000 * 10 ** DECIMALS);

      const ownerBalance = await weederToken.balanceOf(owner.address);
      const user1Balance = await weederToken.balanceOf(user1.address);

      expect(ownerBalance).to.equal(19_900_000 * 10 ** DECIMALS);
      return expect(user1Balance).to.equal(100_000 * 10 ** DECIMALS);
    });

    it('should transfer 100k tokens to user_2', async () => {
      const tx = weederToken.transfer(user2.address, 100_000 * 10 ** DECIMALS);

      await expect(tx)
        .to.emit(weederToken, 'Transfer')
        .withArgs(owner.address, user2.address, 100_000 * 10 ** DECIMALS);

      const ownerBalance = await weederToken.balanceOf(owner.address);
      const user2Balance = await weederToken.balanceOf(user2.address);

      expect(ownerBalance).to.equal(19_800_000 * 10 ** DECIMALS);
      return expect(user2Balance).to.equal(100_000 * 10 ** DECIMALS);
    });

    it('should transfer 100k tokens to user_3', async () => {
      const tx = weederToken.transfer(user3.address, 100_000 * 10 ** DECIMALS);

      await expect(tx)
        .to.emit(weederToken, 'Transfer')
        .withArgs(owner.address, user3.address, 100_000 * 10 ** DECIMALS);

      const ownerBalance = await weederToken.balanceOf(owner.address);
      const user3Balance = await weederToken.balanceOf(user3.address);

      expect(ownerBalance).to.equal(19_700_000 * 10 ** DECIMALS);
      return expect(user3Balance).to.equal(100_000 * 10 ** DECIMALS);
    });
  });

  describe('set market settings', () => {
    it('should throw "AccessControl: account is missing role ADMIN" for user_1', async () => {
      const tx = market.connect(user1).setWeederToken(weederToken.address);

      return expect(tx).to.be.revertedWith(getAccessError(user1, ADMIN_ROLE));
    });

    it('should set weeder token by owner', async () => {
      const tx = market.setWeederToken(weederToken.address);

      await expect(tx)
        .to.emit(market, 'WeederTokenChanged')
        .withArgs(
          weederToken.address,
          ethers.constants.AddressZero,
          owner.address,
        );

      const marketToken = await market.weederToken();

      return expect(marketToken).to.equal(weederToken.address);
    });

    it('should throw "AccessControl: account is missing role ADMIN" for user_1', async () => {
      const tx = market.connect(user1).addTokenToWhitelist(usdtToken.address);

      return expect(tx).to.be.revertedWith(getAccessError(user1, ADMIN_ROLE));
    });

    it('should add USDT to whitelist', async () => {
      const tx = market.addTokenToWhitelist(usdtToken.address);

      await expect(tx)
        .to.emit(market, 'TokenAddedToWhitelist')
        .withArgs(usdtToken.address, owner.address);

      return expect(await market.isWhitelisted(usdtToken.address)).to.be.true;
    });

    it('should throw "AccessControl: account is missing role ADMIN" for user_1', async () => {
      const tx = market.connect(user1).setVault(owner.address);

      return expect(tx).to.be.revertedWith(getAccessError(user1, ADMIN_ROLE));
    });

    it('should set market vault by owner', async () => {
      const tx = market.setVault(vault.address);

      await expect(tx)
        .to.emit(market, 'VaultChanged')
        .withArgs(vault.address, ethers.constants.AddressZero, owner.address);

      expect(await market.vault()).to.equal(vault.address);
    });
  });

  describe('should stake all weeder tokens', () => {
    it('should stake owner tokens', async () => {
      const tx = weederToken.increaseAllowance(
        market.address,
        19_700_000 * 10 ** DECIMALS,
      );

      await expect(tx)
        .to.emit(weederToken, 'Approval')
        .withArgs(owner.address, market.address, 19_700_000 * 10 ** DECIMALS);

      const stakeTx = market.stakeWeederToken(19_700_000 * 10 ** DECIMALS);

      await expect(stakeTx)
        .to.emit(weederToken, 'Transfer')
        .withArgs(owner.address, market.address, 19_700_000 * 10 ** DECIMALS)
        .and.to.emit(market, 'WeederTokenStaked')
        .withArgs(owner.address, 19_700_000 * 10 ** DECIMALS)
        .and.not.to.emit(market, 'AccountAccrueChanged')
        .and.not.to.emit(market, 'DividendsCollected');

      const shares = await market.share(owner.address);

      return expect(shares).to.equal(19_700_000 * 10 ** DECIMALS);
    });

    it('should stake user_1 tokens', async () => {
      const tx = weederToken
        .connect(user1)
        .increaseAllowance(market.address, 100_000 * 10 ** DECIMALS);

      await expect(tx)
        .to.emit(weederToken, 'Approval')
        .withArgs(user1.address, market.address, 100_000 * 10 ** DECIMALS);

      const stakeTx = market
        .connect(user1)
        .stakeWeederToken(100_000 * 10 ** DECIMALS);

      await expect(stakeTx)
        .to.emit(weederToken, 'Transfer')
        .withArgs(user1.address, market.address, 100_000 * 10 ** DECIMALS)
        .and.to.emit(market, 'WeederTokenStaked')
        .withArgs(user1.address, 100_000 * 10 ** DECIMALS)
        .and.not.to.emit(market, 'AccountAccrueChanged')
        .and.not.to.emit(market, 'DividendsCollected');

      const shares = await market.share(user1.address);

      return expect(shares).to.equal(100_000 * 10 ** DECIMALS);
    });

    it('should stake user_2 tokens', async () => {
      const tx = weederToken
        .connect(user2)
        .increaseAllowance(market.address, 100_000 * 10 ** DECIMALS);

      await expect(tx)
        .to.emit(weederToken, 'Approval')
        .withArgs(user2.address, market.address, 100_000 * 10 ** DECIMALS);

      const stakeTx = market
        .connect(user2)
        .stakeWeederToken(100_000 * 10 ** DECIMALS);

      await expect(stakeTx)
        .to.emit(weederToken, 'Transfer')
        .withArgs(user2.address, market.address, 100_000 * 10 ** DECIMALS)
        .to.emit(market, 'WeederTokenStaked')
        .withArgs(user2.address, 100_000 * 10 ** DECIMALS)
        .and.not.to.emit(market, 'AccountAccrueChanged')
        .and.not.to.emit(market, 'DividendsCollected');

      const shares = await market.share(user2.address);

      return expect(shares).to.equal(100_000 * 10 ** DECIMALS);
    });

    it('should stake user_3 tokens', async () => {
      const tx = weederToken
        .connect(user3)
        .increaseAllowance(market.address, 100_000 * 10 ** DECIMALS);

      await expect(tx)
        .to.emit(weederToken, 'Approval')
        .withArgs(user3.address, market.address, 100_000 * 10 ** DECIMALS);

      const stakeTx = market
        .connect(user3)
        .stakeWeederToken(100_000 * 10 ** DECIMALS);

      await expect(stakeTx)
        .to.emit(weederToken, 'Transfer')
        .withArgs(user3.address, market.address, 100_000 * 10 ** DECIMALS)
        .to.emit(market, 'WeederTokenStaked')
        .withArgs(user3.address, 100_000 * 10 ** DECIMALS)
        .and.not.to.emit(market, 'AccountAccrueChanged')
        .and.not.to.emit(market, 'DividendsCollected');

      const shares = await market.share(user3.address);

      return expect(shares).to.equal(100_000 * 10 ** DECIMALS);
    });
  });

  describe('create and complete order 1', () => {
    it('should throw "AccessControl: account is missing role MANAGER" for user_1', async () => {
      const tx = market
        .connect(user1)
        .createOrder('1', usdtToken.address, '1000');

      return expect(tx).to.be.revertedWith(getAccessError(user1, MANAGER_ROLE));
    });

    it('should throw TOKEN_IS_NOT_ALLOWED for non-whitelist token', async () => {
      const tx = market.createOrder('1', weederToken.address, '1000');

      return expect(tx).to.be.revertedWith(Errors.TOKEN_IS_NOT_ALLOWED);
    });

    it('should throw INVALID_ORDER for 0 USD price', async () => {
      const tx = market.createOrder('1', usdtToken.address, '0');

      return expect(tx).to.be.revertedWith(Errors.ZERO_AMOUNT);
    });

    it('should throw INVALID_ORDER_ID for 0 ID', async () => {
      const tx = market.createOrder('0', usdtToken.address, '1000');

      return expect(tx).to.be.revertedWith(Errors.INVALID_ORDER_ID);
    });

    it('should add order 1 for 1000 USD', async () => {
      const tx = market.createOrder('1', usdtToken.address, '1000');

      await expect(tx)
        .to.emit(market, 'OrderChanged')
        .withArgs(
          '1',
          [usdtToken.address, 0, '1000', OrderStatus.CREATED],
          owner.address,
        );

      const order = await market.order('1');

      expect(order.token).to.equal(usdtToken.address);
      expect(order.tokenAmount).to.equal('0');
      expect(order.usdAmount).to.equal('1000');
      return expect(order.status).to.equal(OrderStatus.CREATED);
    });

    it('should mint 1000 USDT to vault', async () => {
      const tx = usdtToken.mint(vault.address, '1000');

      await expect(tx)
        .to.emit(usdtToken, 'Transfer')
        .withArgs(ethers.constants.AddressZero, vault.address, '1000');

      const balance = await usdtToken.balanceOf(vault.address);

      return expect(balance).to.equal('1000');
    });

    it('should allow 1000 USDT transfer for market', async () => {
      const tx = await usdtToken
        .connect(vault)
        .increaseAllowance(market.address, '1000');

      await expect(tx)
        .to.emit(usdtToken, 'Approval')
        .withArgs(vault.address, market.address, '1000');

      const allowance = await usdtToken.allowance(
        vault.address,
        market.address,
      );

      return expect(allowance).to.equal('1000');
    });

    it('should throw "AccessControl: account is missing role MANAGER" for user_1', async () => {
      const tx = market.connect(user1).completeOrder('1', '1000');

      return expect(tx).to.be.revertedWith(getAccessError(user1, MANAGER_ROLE));
    });

    it('should throw "ERC20: insufficient allowance" for 1200 USDT', async () => {
      const tx = market.completeOrder('1', '1200');

      return expect(tx).to.be.revertedWith('ERC20: insufficient allowance');
    });

    it('should complete order 1', async () => {
      const tx = market.completeOrder('1', '1000');

      await expect(tx)
        .to.emit(market, 'OrderChanged')
        .withArgs(
          '1',
          [usdtToken.address, '1000', '1000', OrderStatus.COMPLETED],
          owner.address,
        )
        .and.to.emit(market, 'MarketAccrueChanged')
        .withArgs(usdtToken.address, '500000', owner.address);

      const accrue = await market.currentMarketAccrue(usdtToken.address);

      expect(await usdtToken.balanceOf(owner.address)).to.equal('0');
      expect(await usdtToken.balanceOf(market.address)).to.equal('1000');
      expect((await market.order('1'))[3]).to.equal(OrderStatus.COMPLETED);
      return expect(accrue).to.equal('500000');
    });

    it('should throw ORDER_ALREADY_EXISTS for ID 1', async () => {
      const tx = market.createOrder('1', usdtToken.address, '1000');

      return expect(tx).to.be.revertedWith(
        getOrderStatusError(OrderStatus.EMPTY),
      );
    });

    it('should throw ORDER_STATUS_IS_NOT_CREATED for ID 1', async () => {
      const tx = market.cancelOrder('1');

      return expect(tx).to.be.revertedWith(
        getOrderStatusError(OrderStatus.CREATED),
      );
    });
  });

  describe('collect dividends', () => {
    it('should calculate owner earned USDT dividends', async () => {
      const dividends = await market.availableTokenDividends(
        owner.address,
        usdtToken.address,
      );

      return expect(dividends).to.equal('985');
    });

    it('should collect user_1 USDT dividends', async () => {
      const tx = market.accrueTokenDividends(user1.address, usdtToken.address);

      await expect(tx)
        .to.emit(market, 'AccountAccrueChanged')
        .withArgs(user1.address, usdtToken.address, '500000', owner.address)
        .and.to.emit(market, 'DividendsCollected')
        .withArgs('5', usdtToken.address, user1.address, owner.address);

      const accrue = await market.currentAccountAccrue(
        user1.address,
        usdtToken.address,
      );

      expect(await usdtToken.balanceOf(user1.address)).to.equal('5');
      expect(await usdtToken.balanceOf(market.address)).to.equal('995');
      return expect(accrue).to.equal('500000');
    });
  });

  describe('create and complete order 2', () => {
    it('should add order 2 for 1000 USD', async () => {
      const tx = market.createOrder('2', usdtToken.address, '1000');

      await expect(tx)
        .to.emit(market, 'OrderChanged')
        .withArgs(
          '2',
          [usdtToken.address, 0, '1000', OrderStatus.CREATED],
          owner.address,
        );

      const order = await market.order('2');

      expect(order.token).to.equal(usdtToken.address);
      expect(order.tokenAmount).to.equal('0');
      expect(order.usdAmount).to.equal('1000');
      return expect(order.status).to.equal(OrderStatus.CREATED);
    });

    it('should mint 1000 USDT to vault', async () => {
      const tx = usdtToken.mint(vault.address, '1000');

      await expect(tx)
        .to.emit(usdtToken, 'Transfer')
        .withArgs(ethers.constants.AddressZero, vault.address, '1000');

      return expect(await usdtToken.balanceOf(vault.address)).to.equal('1000');
    });

    it('should allow 1000 USDT transfer for market', async () => {
      const tx = usdtToken
        .connect(vault)
        .increaseAllowance(market.address, '1000');

      await expect(tx)
        .to.emit(usdtToken, 'Approval')
        .withArgs(vault.address, market.address, '1000');

      const allowance = await usdtToken.allowance(
        vault.address,
        market.address,
      );

      return expect(allowance).to.equal('1000');
    });

    it('should complete order 2', async () => {
      const tx = market.completeOrder('2', '1000');

      await expect(tx)
        .to.emit(market, 'OrderChanged')
        .withArgs(
          '2',
          [usdtToken.address, '1000', '1000', OrderStatus.COMPLETED],
          owner.address,
        )
        .and.to.emit(market, 'MarketAccrueChanged')
        .withArgs(usdtToken.address, '1000000', owner.address);

      const accrue = await market.currentMarketAccrue(usdtToken.address);

      expect(await usdtToken.balanceOf(owner.address)).to.equal('0');
      expect(await usdtToken.balanceOf(market.address)).to.equal('1995');
      expect((await market.order('2'))[3]).to.equal(OrderStatus.COMPLETED);
      return expect(accrue).to.equal('1000000');
    });
  });

  describe('collect all dividends', () => {
    it('should calculate user_1 earned USDT dividends', async () => {
      const dividends = await market.availableTokenDividends(
        user1.address,
        usdtToken.address,
      );

      return expect(dividends).to.equal('5');
    });

    it('should collect user_1 USDT dividends', async () => {
      const tx = market.accrueTokenDividends(user1.address, usdtToken.address);

      await expect(tx)
        .to.emit(market, 'AccountAccrueChanged')
        .withArgs(user1.address, usdtToken.address, '1000000', owner.address)
        .and.to.emit(market, 'DividendsCollected')
        .withArgs('5', usdtToken.address, user1.address, owner.address);

      const accrue = await market.currentAccountAccrue(
        user1.address,
        usdtToken.address,
      );

      expect(await usdtToken.balanceOf(user1.address)).to.equal('10');
      expect(await usdtToken.balanceOf(market.address)).to.equal('1990');
      return expect(accrue).to.equal('1000000');
    });

    it('should calculate user_2 earned USDT dividends', async () => {
      const dividends = await market.availableTokenDividends(
        user2.address,
        usdtToken.address,
      );

      return expect(dividends).to.equal('10');
    });

    it('should collect user_2 USDT dividends', async () => {
      const tx = market.accrueTokenDividends(user2.address, usdtToken.address);

      await expect(tx)
        .to.emit(market, 'AccountAccrueChanged')
        .withArgs(user2.address, usdtToken.address, '1000000', owner.address)
        .and.to.emit(market, 'DividendsCollected')
        .withArgs('10', usdtToken.address, user2.address, owner.address);

      const accrue = await market.currentAccountAccrue(
        user2.address,
        usdtToken.address,
      );

      expect(await usdtToken.balanceOf(user2.address)).to.equal('10');
      expect(await usdtToken.balanceOf(market.address)).to.equal('1980');
      return expect(accrue).to.equal('1000000');
    });

    it('should calculate user_3 earned USDT dividends', async () => {
      const dividends = await market.availableTokenDividends(
        user3.address,
        usdtToken.address,
      );

      return expect(dividends).to.equal('10');
    });

    it('should collect user_3 USDT dividends', async () => {
      const tx = market.accrueTokenDividends(user3.address, usdtToken.address);

      await expect(tx)
        .to.emit(market, 'AccountAccrueChanged')
        .withArgs(user3.address, usdtToken.address, '1000000', owner.address)
        .and.to.emit(market, 'DividendsCollected')
        .withArgs('10', usdtToken.address, user3.address, owner.address);

      const accrue = await market.currentAccountAccrue(
        user3.address,
        usdtToken.address,
      );

      expect(await usdtToken.balanceOf(user3.address)).to.equal('10');
      expect(await usdtToken.balanceOf(market.address)).to.equal('1970');
      return expect(accrue).to.equal('1000000');
    });
  });

  describe('transfer all owners weeder tokens to user 1', () => {
    it('should transfer 100k weeder tokens from owner to user 1', async () => {
      expect(await usdtToken.balanceOf(owner.address)).to.equal('0');

      const tx = market.redeemWeederToken(100_000 * 10 ** DECIMALS);

      await expect(tx)
        .to.emit(market, 'AccountAccrueChanged')
        .withArgs(owner.address, usdtToken.address, '1000000', owner.address)
        .and.to.emit(market, 'DividendsCollected')
        .withArgs('1970', usdtToken.address, owner.address, owner.address)
        .and.to.emit(market, 'WeederTokenRedeemed')
        .withArgs(owner.address, 100_000 * 10 ** DECIMALS);

      const txTransfer = weederToken.transfer(
        user1.address,
        100_000 * 10 ** DECIMALS,
      );

      await expect(txTransfer)
        .to.emit(weederToken, 'Transfer')
        .withArgs(owner.address, user1.address, 100_000 * 10 ** DECIMALS);

      const ownerWeederBalance = await weederToken.balanceOf(owner.address);
      const user1WeederBalance = await weederToken.balanceOf(user1.address);
      const ownerUsdtBalance = await usdtToken.balanceOf(owner.address);
      const user1UsdtBalance = await usdtToken.balanceOf(user1.address);

      expect(ownerWeederBalance).to.equal(0);
      expect(user1WeederBalance).to.equal(100_000 * 10 ** DECIMALS);
      expect(ownerUsdtBalance).to.equal(1970);
      return expect(user1UsdtBalance).to.equal(10);
    });
  });
});
