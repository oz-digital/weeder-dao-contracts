// import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
// import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs';
import { expect } from 'chai';
import { ethers, upgrades } from 'hardhat';
import {
  TaskManager,
  WeederToken,
  Market,
  ERC20PresetMinterPauser,
} from '@types';

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

      await usdtToken.deployed();

      expect(await usdtToken.name()).to.equal('Tether');
    });

    it('should deploy task manager', async () => {
      const TaskManagerFactory = await ethers.getContractFactory('TaskManager');
      manager = await TaskManagerFactory.deploy();

      await manager.deployed();

      expect(await manager.weederToken()).to.equal(
        ethers.constants.AddressZero,
      );
    });

    it('should deploy weeder token', async () => {
      const WeederTokenFactory = await ethers.getContractFactory('WeederToken');
      token = (await upgrades.deployProxy(WeederTokenFactory, [
        manager.address,
        '20000000',
      ])) as WeederToken;

      await token.deployed();

      expect(await token.totalSupply()).to.equal('20000000');
    });

    it('should deploy market', async () => {
      const MarketFactory = await ethers.getContractFactory('Market');
      market = await MarketFactory.deploy(token.address);
      const signers = await ethers.getSigners();

      await market.deployed();

      expect(await market.owner()).to.equal(signers[0].address);
    });

    it('should set market at task manager', async () => {
      const tx = await manager.setMarket(market.address);

      await tx.wait();

      expect(await manager.market()).to.equal(market.address);
    });

    it('should set weeder token at task manager', async () => {
      const tx = await manager.setWeederToken(token.address);

      await tx.wait();

      expect(await manager.weederToken()).to.equal(token.address);
    });
  });

  describe('Transfer weeder tokens', () => {
    it('should transfer 100000 tokens to user 1', async () => {
      const signers = await ethers.getSigners();

      const tx = await token.transfer(signers[1].address, '100000');

      await tx.wait();

      expect(await token.balanceOf(signers[1].address)).to.equal('100000');
    });

    it('should transfer 100000 tokens to user 2', async () => {
      const signers = await ethers.getSigners();

      const tx = await token.transfer(signers[2].address, '100000');

      await tx.wait();

      expect(await token.balanceOf(signers[2].address)).to.equal('100000');
    });

    it('should transfer 100000 tokens to user 3', async () => {
      const signers = await ethers.getSigners();

      const tx = await token.transfer(signers[3].address, '100000');

      await tx.wait();

      expect(await token.balanceOf(signers[3].address)).to.equal('100000');
    });
  });

  describe('Set market settings', () => {
    it('should add USDT to whitelist', async () => {
      const tx = await market.addTokenToWhitelist(usdtToken.address);

      await tx.wait();

      expect(await market.tokenToWhitelistStatus(usdtToken.address)).to.be.true;
    });

    it('should set owner USDT wallet as market vault', async () => {
      const tx = await market.setVault(market.owner());

      await tx.wait();

      expect(await market.vault()).to.equal(await market.owner());
    });
  });

  describe('Create and complete order 1', () => {
    it('should add order 1 for 1000 USD', async () => {
      const tx = await market.addOrder('1', usdtToken.address, '1000');
      await tx.wait();
      const order = await market.orders('1');

      expect(order.token).to.equal(usdtToken.address);
      expect(order.price).to.equal('0');
      expect(order.priceUsd).to.equal('1000');
      expect(order.status).to.equal(1);
    });

    it('should mint 1000 USDT to owner', async () => {
      const signers = await ethers.getSigners();

      const tx = await usdtToken.mint(signers[0].address, '1000');

      await tx.wait();

      expect(await usdtToken.balanceOf(signers[0].address)).to.equal('1000');
    });

    it('should allow 1000 USDT transfer for market', async () => {
      const signers = await ethers.getSigners();

      const tx = await usdtToken.increaseAllowance(market.address, '1000');

      await tx.wait();

      expect(
        await usdtToken.allowance(signers[0].address, market.address),
      ).to.equal('1000');
    });

    it('should complete order 1', async () => {
      const signers = await ethers.getSigners();

      const tx = await market.completeOrder('1', '1000');

      await tx.wait();

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

      expect(dividends).to.equal('985');
    });

    it('should collect user 1 USDT dividends', async () => {
      const signers = await ethers.getSigners();

      const tx = await market
        .connect(signers[1])
        .accrueTokenDividends(usdtToken.address);

      await tx.wait();

      const accrue = await market.userToAccrue(
        signers[1].address,
        usdtToken.address,
      );

      expect(await usdtToken.balanceOf(signers[1].address)).to.equal('5');
      expect(await usdtToken.balanceOf(market.address)).to.equal('995');
      expect(accrue.index).to.equal('1000');
    });
  });

  describe('Create and complete order 2', () => {
    it('should add order 2 for 1000 USD', async () => {
      const tx = await market.addOrder('2', usdtToken.address, '1000');
      await tx.wait();
      const order = await market.orders('2');

      expect(order.token).to.equal(usdtToken.address);
      expect(order.price).to.equal('0');
      expect(order.priceUsd).to.equal('1000');
      expect(order.status).to.equal(1);
    });

    it('should mint 1000 USDT to owner', async () => {
      const signers = await ethers.getSigners();

      const tx = await usdtToken.mint(signers[0].address, '1000');

      await tx.wait();

      expect(await usdtToken.balanceOf(signers[0].address)).to.equal('1000');
    });

    it('should allow 1000 USDT transfer for market', async () => {
      const signers = await ethers.getSigners();

      const tx = await usdtToken.increaseAllowance(market.address, '1000');

      await tx.wait();

      expect(
        await usdtToken.allowance(signers[0].address, market.address),
      ).to.equal('1000');
    });

    it('should complete order 2', async () => {
      const signers = await ethers.getSigners();

      const tx = await market.completeOrder('2', '1000');

      await tx.wait();

      const accrue = await market.tokenToAccrue(usdtToken.address);

      expect(await usdtToken.balanceOf(signers[0].address)).to.equal('0');
      expect(await usdtToken.balanceOf(market.address)).to.equal('1995');
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

      expect(dividends).to.equal('5');
    });

    it('should collect user 1 USDT dividends', async () => {
      const signers = await ethers.getSigners();

      const tx = await market
        .connect(signers[1])
        .accrueTokenDividends(usdtToken.address);

      await tx.wait();

      const accrue = await market.userToAccrue(
        signers[1].address,
        usdtToken.address,
      );

      expect(await usdtToken.balanceOf(signers[1].address)).to.equal('10');
      expect(await usdtToken.balanceOf(market.address)).to.equal('1990');
      expect(accrue.index).to.equal('2000');
    });

    it('should calculate user 2 earned USDT dividends', async () => {
      const signers = await ethers.getSigners();

      const dividends = await market
        .connect(signers[2])
        .availableTokenDividends(usdtToken.address);

      expect(dividends).to.equal('10');
    });

    it('should collect user 2 USDT dividends', async () => {
      const signers = await ethers.getSigners();

      const tx = await market
        .connect(signers[2])
        .accrueTokenDividends(usdtToken.address);

      await tx.wait();

      const accrue = await market.userToAccrue(
        signers[2].address,
        usdtToken.address,
      );

      expect(await usdtToken.balanceOf(signers[1].address)).to.equal('10');
      expect(await usdtToken.balanceOf(market.address)).to.equal('1980');
      expect(accrue.index).to.equal('2000');
    });

    it('should calculate user 3 earned USDT dividends', async () => {
      const signers = await ethers.getSigners();

      const dividends = await market
        .connect(signers[3])
        .availableTokenDividends(usdtToken.address);

      expect(dividends).to.equal('10');
    });

    it('should collect user 3 USDT dividends', async () => {
      const signers = await ethers.getSigners();

      const tx = await market
        .connect(signers[3])
        .accrueTokenDividends(usdtToken.address);

      await tx.wait();

      const accrue = await market.userToAccrue(
        signers[3].address,
        usdtToken.address,
      );

      expect(await usdtToken.balanceOf(signers[1].address)).to.equal('10');
      expect(await usdtToken.balanceOf(market.address)).to.equal('1970');
      expect(accrue.index).to.equal('2000');
    });
  });

  describe('Transfer all owners weeder tokens to user 1', () => {
    it('should transfer 100000 weeder tokens from owner to user 1', async () => {
      const signers = await ethers.getSigners();

      expect(await usdtToken.balanceOf(signers[0].address)).to.equal('0');

      const tx = await token.transfer(signers[1].address, '100000');

      await tx.wait();

      expect(await token.balanceOf(signers[0].address)).to.equal('19600000');
      expect(await token.balanceOf(signers[1].address)).to.equal('200000');
      expect(await usdtToken.balanceOf(signers[0].address)).to.equal('1970');
      expect(await usdtToken.balanceOf(signers[1].address)).to.equal('10');
    });
  });
});
