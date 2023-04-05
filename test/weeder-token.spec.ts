import { ethers, upgrades } from 'hardhat';
import { expect } from 'chai';
import { WeederToken } from '@types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

const DOMAIN_SEPARATOR =
  '0x1afaec0126a8c518d47b510f3391c0ca3efb3be5c5f4dae3d02d30423b55e7ce';

const PAUSER_ROLE = ethers.utils.id('PAUSER_ROLE');
const UPGRADER_ROLE = ethers.utils.id('UPGRADER_ROLE');
const ADMIN_ROLE = ethers.constants.HashZero;

const DECIMALS = 8;

describe('Weeder Token', () => {
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  let token: WeederToken;

  before('deploy token contract', async () => {
    const factory = await ethers.getContractFactory('WeederToken');

    token = await upgrades
      .deployProxy(factory)
      .then((i) => i.deployed())
      .then((i) => i as WeederToken);

    const signers = await ethers.getSigners();
    owner = signers[0];
    user1 = signers[1];
    user2 = signers[2];
  });

  describe('check base data after deploy', () => {
    it('should return decimals 8', async () => {
      const decimals = await token.decimals();

      return expect(decimals).to.equal(DECIMALS);
    });

    it('should return total supply 20kk', async () => {
      const supply = await token.totalSupply();

      return expect(supply).to.equal(20_000_000 * 10 ** DECIMALS);
    });

    it('should return balance of owner 20kk', async () => {
      const balance = await token.balanceOf(owner.address);

      return expect(balance).to.equal(20_000_000 * 10 ** DECIMALS);
    });

    it('should return name "Weeder Digital Token"', async () => {
      const name = await token.name();

      return expect(name).to.equal('Weeder Digital Token');
    });

    it('should return symbol WDT', async () => {
      const symbol = await token.symbol();

      return expect(symbol).to.equal('WDT');
    });

    it('should return valid domain separator', async () => {
      const separator = await token.DOMAIN_SEPARATOR();

      return expect(separator).to.equal(DOMAIN_SEPARATOR);
    });

    it('should return owner for pauser role', async () => {
      const isPauser = await token.hasRole(PAUSER_ROLE, owner.address);

      return expect(isPauser).to.be.true;
    });

    it('should return owner for upgrader role', async () => {
      const isUpgrader = await token.hasRole(UPGRADER_ROLE, owner.address);

      return expect(isUpgrader).to.be.true;
    });

    it('should return owner for admin role', async () => {
      const isAdmin = await token.hasRole(ADMIN_ROLE, owner.address);

      return expect(isAdmin).to.be.true;
    });

    it('should return votes of owner 0', async () => {
      const votes = await token.getVotes(owner.address);

      return expect(votes).to.equal(0);
    });
  });

  describe('transfer()', () => {
    it('should transfer 100k tokens to user_1', async () => {
      const tx = token.transfer(user1.address, 100_000 * 10 ** DECIMALS);

      await expect(tx)
        .to.emit(token, 'Transfer')
        .withArgs(owner.address, user1.address, 100_000 * 10 ** DECIMALS);

      const ownerBalance = await token.balanceOf(owner.address);
      const user1Balance = await token.balanceOf(user1.address);

      expect(ownerBalance).to.equal(19_900_000 * 10 ** DECIMALS);
      return expect(user1Balance).to.equal(100_000 * 10 ** DECIMALS);
    });

    it('should transfer 200k tokens to user_2', async () => {
      const tx = token.transfer(user2.address, 200_000 * 10 ** DECIMALS);

      await expect(tx)
        .to.emit(token, 'Transfer')
        .withArgs(owner.address, user2.address, 200_000 * 10 ** DECIMALS);

      const ownerBalance = await token.balanceOf(owner.address);
      const user2Balance = await token.balanceOf(user2.address);

      expect(ownerBalance).to.equal(19_700_000 * 10 ** DECIMALS);
      return expect(user2Balance).to.equal(200_000 * 10 ** DECIMALS);
    });
  });

  describe('transferFrom()', () => {
    it('should increase allowance up to 50k tokens for user_1', async () => {
      const tx = token.increaseAllowance(
        user1.address,
        50_000 * 10 ** DECIMALS,
      );

      await expect(tx)
        .to.emit(token, 'Approval')
        .withArgs(owner.address, user1.address, 50_000 * 10 ** DECIMALS);

      const user1Allowance = await token.allowance(
        owner.address,
        user1.address,
      );

      return expect(user1Allowance).to.equal(50_000 * 10 ** DECIMALS);
    });

    it('should transfer 50k tokens from owner to user_1', async () => {
      const tx = token
        .connect(user1)
        .transferFrom(owner.address, user1.address, 50_000 * 10 ** DECIMALS);

      await expect(tx)
        .to.emit(token, 'Transfer')
        .withArgs(owner.address, user1.address, 50_000 * 10 ** DECIMALS)
        .and.to.emit(token, 'Approval')
        .withArgs(owner.address, user1.address, 0);

      const ownerBalance = await token.balanceOf(owner.address);
      const user1Balance = await token.balanceOf(user1.address);

      expect(ownerBalance).to.equal(19_650_000 * 10 ** DECIMALS);
      return expect(user1Balance).to.equal(150_000 * 10 ** DECIMALS);
    });
  });

  describe('pause()', () => {
    it('should throw "AccessControl: account is missing role PAUSER" for user_1', async () => {
      const tx = token.connect(user1).pause();

      return expect(tx).to.be.revertedWith(
        `AccessControl: account ${user1.address.toLowerCase()} is missing role ${PAUSER_ROLE}`,
      );
    });

    it('should pause transfers by owner', async () => {
      const tx = token.pause();

      await expect(tx).to.emit(token, 'Paused').withArgs(owner.address);

      const isPaused = await token.paused();

      return expect(isPaused).to.be.true;
    });

    it('should throw "Pausable: paused" for transfer', async () => {
      const tx = token.transfer(user1.address, 50_000 * 10 ** DECIMALS);

      return expect(tx).to.be.revertedWith('Pausable: paused');
    });

    it('should throw "AccessControl: account is missing role PAUSER" for user_1', async () => {
      const tx = token.connect(user1).unpause();

      return expect(tx).to.be.revertedWith(
        `AccessControl: account ${user1.address.toLowerCase()} is missing role ${PAUSER_ROLE}`,
      );
    });

    it('should unpause transfers by owner', async () => {
      const tx = token.unpause();

      await expect(tx).to.emit(token, 'Unpaused').withArgs(owner.address);

      const isPaused = await token.paused();

      return expect(isPaused).to.be.false;
    });
  });

  describe('grantRole()', () => {
    it('should throw "AccessControl: account is missing role ADMIN" for user_1', async () => {
      const tx = token.connect(user1).grantRole(UPGRADER_ROLE, user1.address);

      return expect(tx).to.be.revertedWith(
        `AccessControl: account ${user1.address.toLowerCase()} is missing role ${ADMIN_ROLE}`,
      );
    });
  });

  describe('upgrade()', () => {
    it('should throw "AccessControl: account is missing role UPGRADER" for user_1', async () => {
      const tx = token.connect(user1).upgradeTo(user1.address);

      return expect(tx).to.be.revertedWith(
        `AccessControl: account ${user1.address.toLowerCase()} is missing role ${UPGRADER_ROLE}`,
      );
    });
  });
});
