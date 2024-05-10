/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  Contract,
  ContractFactory,
  ContractTransactionResponse,
  Interface,
} from "ethers";
import type { Signer, ContractDeployTransaction, ContractRunner } from "ethers";
import type { NonPayableOverrides } from "../../../common";
import type {
  AccountManagerStorage,
  AccountManagerStorageInterface,
} from "../../../contracts/AccountManager.sol/AccountManagerStorage";

const _abi = [
  {
    inputs: [],
    name: "gaspayingAddress",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "personalization",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "salt",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

const _bytecode =
  "0x608080604052346100155760d5908161001b8239f35b600080fdfe6080806040526004361015601257600080fd5b600090813560e01c908163108a5eee14607857508063bfa0b13314605c5763fd24dc1e14603e57600080fd5b34605957806003193601126059576020600854604051908152f35b80fd5b5034605957806003193601126059576020600354604051908152f35b905034609b5781600319360112609b576006546001600160a01b03168152602090f35b5080fdfea26469706673582212206dea447b1ec96a06eccfbe983126e51bcdb54915efdd3b0962309eea9980b1d364736f6c63430008150033";

type AccountManagerStorageConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: AccountManagerStorageConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class AccountManagerStorage__factory extends ContractFactory {
  constructor(...args: AccountManagerStorageConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override getDeployTransaction(
    overrides?: NonPayableOverrides & { from?: string }
  ): Promise<ContractDeployTransaction> {
    return super.getDeployTransaction(overrides || {});
  }
  override deploy(overrides?: NonPayableOverrides & { from?: string }) {
    return super.deploy(overrides || {}) as Promise<
      AccountManagerStorage & {
        deploymentTransaction(): ContractTransactionResponse;
      }
    >;
  }
  override connect(
    runner: ContractRunner | null
  ): AccountManagerStorage__factory {
    return super.connect(runner) as AccountManagerStorage__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): AccountManagerStorageInterface {
    return new Interface(_abi) as AccountManagerStorageInterface;
  }
  static connect(
    address: string,
    runner?: ContractRunner | null
  ): AccountManagerStorage {
    return new Contract(
      address,
      _abi,
      runner
    ) as unknown as AccountManagerStorage;
  }
}
