import { createConnection } from 'typeorm';
import { ForceBridgeCore } from '../core';
import { CkbDb, EthDb, TronDb } from '../db';
import { BtcDb } from '../db/btc';
import { EosDb } from '../db/eos';
import { BtcHandler } from '../handlers/btc';
import { CkbHandler } from '../handlers/ckb';
import { EosHandler } from '../handlers/eos';
import { EthHandler } from '../handlers/eth';
import { TronHandler } from '../handlers/tron';
import { parsePrivateKey } from '../utils';
import { BTCChain } from '../xchain/btc';
import { EthChain } from '../xchain/eth';

export async function startHandlers() {
  if (ForceBridgeCore.config.common.role === undefined) {
    ForceBridgeCore.config.common.role = 'watcher';
  }
  const role = ForceBridgeCore.config.common.role;
  const isCollector = ForceBridgeCore.config.common.role === 'collector';

  // init db and start handlers
  const conn = await createConnection();
  const ckbDb = new CkbDb(conn);
  if (isCollector) {
    ForceBridgeCore.config.ckb.privateKey = parsePrivateKey(ForceBridgeCore.config.ckb.privateKey);
  }
  const ckbHandler = new CkbHandler(ckbDb, role);
  ckbHandler.start();

  // start xchain handlers if config exists
  if (ForceBridgeCore.config.eth !== undefined) {
    if (isCollector) {
      ForceBridgeCore.config.eth.privateKey = parsePrivateKey(ForceBridgeCore.config.eth.privateKey);
      ForceBridgeCore.config.eth.multiSignKeys = ForceBridgeCore.config.eth.multiSignKeys.map((pk) =>
        parsePrivateKey(pk),
      );
    }
    const ethDb = new EthDb(conn);
    const ethChain = new EthChain(role);
    const ethHandler = new EthHandler(ethDb, ethChain, role);
    ethHandler.start();
  }
  if (ForceBridgeCore.config.eos !== undefined) {
    if (isCollector) {
      ForceBridgeCore.config.eos.privateKeys = ForceBridgeCore.config.eos.privateKeys.map((pk) => parsePrivateKey(pk));
    }
    const eosDb = new EosDb(conn);
    const eosHandler = new EosHandler(eosDb, ForceBridgeCore.config.eos, role);
    eosHandler.start();
  }
  if (ForceBridgeCore.config.tron !== undefined) {
    if (isCollector) {
      ForceBridgeCore.config.tron.committee.keys = ForceBridgeCore.config.tron.committee.keys.map((pk) =>
        parsePrivateKey(pk),
      );
    }
    const tronDb = new TronDb(conn);
    const tronHandler = new TronHandler(tronDb, role);
    tronHandler.start();
  }
  if (ForceBridgeCore.config.btc !== undefined) {
    if (isCollector) {
      ForceBridgeCore.config.btc.privateKeys = ForceBridgeCore.config.btc.privateKeys.map((pk) => parsePrivateKey(pk));
    }
    const btcDb = new BtcDb(conn);
    const btcChain = new BTCChain();
    const btcHandler = new BtcHandler(btcDb, btcChain, role);
    btcHandler.start();
  }
}