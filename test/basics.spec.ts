// import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
// import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import {
  TaskManager,
  WeederToken,
  Market,
  ERC20PresetMinterPauser,
} from '../typechain-types';

describe('Basics', () => {
  let manager: TaskManager;
  let token: WeederToken;
  let market: Market;
  let usdtToken: ERC20PresetMinterPauser;

  describe('Deployment', () => {
    it('should deploy USDT token', async () => {
      const ERC20Factory = await ethers.getContractFactory(
        'ERC20PresetMinterPauser',
      );
      usdtToken = await ERC20Factory.deploy('Tether', 'USDT');

      expect(await usdtToken.name()).to.equal('Tether');
    });

    it('should deploy task manager', async () => {
      const TaskManagerFactory = await ethers.getContractFactory('TaskManager');
      manager = await TaskManagerFactory.deploy();

      expect(await manager.weederToken()).to.equal(
        ethers.constants.AddressZero,
      );
    });

    it('should deploy weeder token', async () => {
      const WeederTokenFactory = await ethers.getContractFactory('WeederToken');
      token = await WeederTokenFactory.deploy(manager.address, {
        gasLimit: 5000000,
      });

      expect(await token.totalSupply()).to.equal('0');
    });

    it('should deploy market', async () => {
      const MarketFactory = await ethers.getContractFactory('Market');
      market = await MarketFactory.deploy(token.address);
      const signers = await ethers.getSigners();

      expect(await market.owner()).to.equal(signers[0].address);
    });

    it('should set market at task manager', async () => {
      await manager.setMarket(market.address);

      expect(await manager.market()).to.equal(market.address);
    });

    it('should set weeder token at task manager', async () => {
      await manager.setWeederToken(token.address);

      expect(await manager.weederToken()).to.equal(token.address);
    });
  });

  describe('Mint weeder tokens', () => {
    it('should mint 100000 tokens to owner', async () => {
      const signers = await ethers.getSigners();

      await token.mint(signers[0].address, '100000');

      expect(await token.balanceOf(signers[0].address)).to.equal('100000');
    });

    it('should mint 100000 tokens to user 1', async () => {
      const signers = await ethers.getSigners();

      await token.mint(signers[1].address, '100000');

      expect(await token.balanceOf(signers[1].address)).to.equal('100000');
    });

    it('should mint 100000 tokens to user 2', async () => {
      const signers = await ethers.getSigners();

      await token.mint(signers[2].address, '100000');

      expect(await token.balanceOf(signers[2].address)).to.equal('100000');
    });

    it('should mint 100000 tokens to user 3', async () => {
      const signers = await ethers.getSigners();

      await token.mint(signers[3].address, '100000');

      expect(await token.balanceOf(signers[3].address)).to.equal('100000');
    });
  });

  describe('Set market settings', () => {
    it('should add USDT to whitelist', async () => {
      await market.addTokenToWhitelist(usdtToken.address);

      expect(await market.tokenToWhitelistStatus(usdtToken.address)).to.be.true;
    });

    it('should set owner USDT wallet as market vault', async () => {
      await market.setVault(market.owner());

      expect(await market.vault()).to.equal(await market.owner());
    });
  });

  describe('Create and complete order 1', () => {
    it('should add order 1 for 1000 USD', async () => {
      await market.addOrder('1', usdtToken.address, '1000');
      const order = await market.orders('1');

      expect(order.token).to.equal(usdtToken.address);
      expect(order.price).to.equal('0');
      expect(order.priceUsd).to.equal('1000');
      expect(order.status).to.equal(1);
    });

    it('should mint 1000 USDT to owner', async () => {
      const signers = await ethers.getSigners();

      await usdtToken.mint(signers[0].address, '1000');

      expect(await usdtToken.balanceOf(signers[0].address)).to.equal('1000');
    });

    it('should allow 1000 USDT transfer for market', async () => {
      const signers = await ethers.getSigners();

      await usdtToken.increaseAllowance(market.address, '1000');

      expect(
        await usdtToken.allowance(signers[0].address, market.address),
      ).to.equal('1000');
    });

    it('should complete order 1', async () => {
      const signers = await ethers.getSigners();

      await market.completeOrder('1', '1000');

      const accrue = await market.tokenToAccrue(usdtToken.address);

      expect(await usdtToken.balanceOf(signers[0].address)).to.equal('0');
      expect(await usdtToken.balanceOf(market.address)).to.equal('1000');
      expect((await market.orders('1'))[3]).to.equal(3);
      expect(accrue.index).to.equal('1000');
    });
  });

  describe('Collect dividends', () => {
    it('should calculate earned USDT dividends', async () => {
      const dividends = await market.availableTokenDividends(usdtToken.address);

      expect(dividends).to.equal('250');
    });

    it('should collect user 1 USDT dividends', async () => {
      const signers = await ethers.getSigners();

      await market.connect(signers[1]).accrueTokenDividends(usdtToken.address);

      const accrue = await market.userToAccrue(
        signers[1].address,
        usdtToken.address,
      );

      expect(await usdtToken.balanceOf(signers[1].address)).to.equal('250');
      expect(await usdtToken.balanceOf(market.address)).to.equal('750');
      expect(accrue.index).to.equal('1000');
    });
  });

  describe('Create and complete order 2', () => {
    it('should add order 2 for 1000 USD', async () => {
      await market.addOrder('2', usdtToken.address, '1000');
      const order = await market.orders('2');

      expect(order.token).to.equal(usdtToken.address);
      expect(order.price).to.equal('0');
      expect(order.priceUsd).to.equal('1000');
      expect(order.status).to.equal(1);
    });

    it('should mint 1000 USDT to owner', async () => {
      const signers = await ethers.getSigners();

      await usdtToken.mint(signers[0].address, '1000');

      expect(await usdtToken.balanceOf(signers[0].address)).to.equal('1000');
    });

    it('should allow 1000 USDT transfer for market', async () => {
      const signers = await ethers.getSigners();

      await usdtToken.increaseAllowance(market.address, '1000');

      expect(
        await usdtToken.allowance(signers[0].address, market.address),
      ).to.equal('1000');
    });

    it('should complete order 2', async () => {
      const signers = await ethers.getSigners();

      await market.completeOrder('2', '1000');

      const accrue = await market.tokenToAccrue(usdtToken.address);

      expect(await usdtToken.balanceOf(signers[0].address)).to.equal('0');
      expect(await usdtToken.balanceOf(market.address)).to.equal('1750');
      expect((await market.orders('2'))[3]).to.equal(3);
      expect(accrue.index).to.equal('2000');
    });
  });

  describe('Collect all dividends', () => {
    it('should calculate user 1 earned USDT dividends', async () => {
      const signers = await ethers.getSigners();

      const dividends = await market
        .connect(signers[1])
        .availableTokenDividends(usdtToken.address);

      expect(dividends).to.equal('250');
    });

    it('should collect user 1 USDT dividends', async () => {
      const signers = await ethers.getSigners();

      await market.connect(signers[1]).accrueTokenDividends(usdtToken.address);

      const accrue = await market.userToAccrue(
        signers[1].address,
        usdtToken.address,
      );

      expect(await usdtToken.balanceOf(signers[1].address)).to.equal('500');
      expect(await usdtToken.balanceOf(market.address)).to.equal('1500');
      expect(accrue.index).to.equal('2000');
    });

    it('should calculate user 2 earned USDT dividends', async () => {
      const signers = await ethers.getSigners();

      const dividends = await market
        .connect(signers[2])
        .availableTokenDividends(usdtToken.address);

      expect(dividends).to.equal('500');
    });

    it('should collect user 2 USDT dividends', async () => {
      const signers = await ethers.getSigners();

      await market.connect(signers[2]).accrueTokenDividends(usdtToken.address);

      const accrue = await market.userToAccrue(
        signers[2].address,
        usdtToken.address,
      );

      expect(await usdtToken.balanceOf(signers[1].address)).to.equal('500');
      expect(await usdtToken.balanceOf(market.address)).to.equal('1000');
      expect(accrue.index).to.equal('2000');
    });

    it('should calculate user 3 earned USDT dividends', async () => {
      const signers = await ethers.getSigners();

      const dividends = await market
        .connect(signers[3])
        .availableTokenDividends(usdtToken.address);

      expect(dividends).to.equal('500');
    });

    it('should collect user 3 USDT dividends', async () => {
      const signers = await ethers.getSigners();

      await market.connect(signers[3]).accrueTokenDividends(usdtToken.address);

      const accrue = await market.userToAccrue(
        signers[3].address,
        usdtToken.address,
      );

      expect(await usdtToken.balanceOf(signers[1].address)).to.equal('500');
      expect(await usdtToken.balanceOf(market.address)).to.equal('500');
      expect(accrue.index).to.equal('2000');
    });
  });

  describe('Transfer all owners weeder tokens to user 1', () => {
    it('should transfer 100000 weeder tokens from owner to user 1', async () => {
      const signers = await ethers.getSigners();

      expect(await usdtToken.balanceOf(signers[0].address)).to.equal('0');

      await token.transfer(signers[1].address, '100000');

      expect(await token.balanceOf(signers[0].address)).to.equal('0');
      expect(await token.balanceOf(signers[1].address)).to.equal('200000');
      expect(await usdtToken.balanceOf(signers[0].address)).to.equal('500');
      expect(await usdtToken.balanceOf(signers[1].address)).to.equal('500');
    });
  });
});
