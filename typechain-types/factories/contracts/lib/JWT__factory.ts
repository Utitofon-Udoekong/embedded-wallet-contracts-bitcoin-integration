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
import type { JWT, JWTInterface } from "../../../contracts/lib/JWT";

const _abi = [
  {
    inputs: [
      {
        internalType: "bytes",
        name: "secret",
        type: "bytes",
      },
      {
        internalType: "string",
        name: "payload",
        type: "string",
      },
    ],
    name: "HS256",
    outputs: [
      {
        internalType: "string",
        name: "token",
        type: "string",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
] as const;

const _bytecode =
  "0x6080806040523461001a576107ec9081610020823930815050f35b600080fdfe6080604052600436101561001257600080fd5b6000803560e01c63bc6e4c451461002857600080fd5b60403660031901126100ab5767ffffffffffffffff6004358181116100ae57366023820112156100ae57610066903690602481600401359101610127565b916024359182116100ab57366023830112156100ab576100a761009b8461009536600487013560248801610127565b906101ed565b60405191829182610186565b0390f35b80fd5b8280fd5b634e487b7160e01b600052604160045260246000fd5b6040810190811067ffffffffffffffff8211176100e457604052565b6100b2565b90601f8019910116810190811067ffffffffffffffff8211176100e457604052565b67ffffffffffffffff81116100e457601f01601f191660200190565b9291926101338261010b565b9161014160405193846100e9565b82948184528183011161015e578281602093846000960137010152565b600080fd5b60005b8381106101765750506000910152565b8181015183820152602001610166565b604091602082526101a68151809281602086015260208686019101610163565b601f01601f1916010190565b604051906020820182811067ffffffffffffffff8211176100e45760405260008252565b906101e960209282815194859201610163565b0190565b6102eb906040516101fd816100c8565b601b81526102df6102b86102a76102b3610295602161024b6102456020987f7b22616c67223a224853323536222c22747970223a224a5754227d00000000008a82015261040a565b9a61040a565b9961027c6040519b8c938361026a8c8796519281849289019101610163565b8401601760f91b8c82015201906101d6565b0397610290601f19998a81018452836100e9565b6105b8565b60405192839187830160209181520190565b038681018352826100e9565b61040a565b6102d96102cc6040519788958601906101d6565b601760f91b815260010190565b906101d6565b039081018352826100e9565b90565b604051906060820182811067ffffffffffffffff8211176100e457604052604082527f6768696a6b6c6d6e6f707172737475767778797a303132333435363738392d5f6040837f4142434445464748494a4b4c4d4e4f505152535455565758595a61626364656660208201520152565b634e487b7160e01b600052601160045260246000fd5b906002820180921161038257565b61035e565b906020820180921161038257565b600281901b91906001600160fe1b0381160361038257565b600381901b91906001600160fd1b0381160361038257565b8181029291811591840414171561038257565b906103e28261010b565b6103ef60405191826100e9565b8281528092610400601f199161010b565b0190602036910137565b80511561051d576104196102ee565b9061043661043161042a8351610374565b6003900490565b610395565b9161044861044384610387565b6103d8565b92835281825183019060208501925b8282106104cb575050509060039182825106806001146104b7576002146104a5575b505106806001146104995760021461048e5790565b805160001901815290565b50805160011901815290565b603d60f81b6000199091015238610479565b50613d3d60f01b6001199091015238610479565b9091926004906003809401938451600190603f9082828260121c16880101518553828282600c1c16880101518386015382828260061c1688010151600286015316850101519082015301929190610457565b506102eb6101b2565b60001981146103825760010190565b908151811015610546570160200190565b634e487b7160e01b600052603260045260246000fd5b601f0390601f821161038257565b603f0390603f821161038257565b60ff8111610382576001901b90565b6040513d6000823e3d90fd5b909160409392825260208201526105b38251809360208685019101610163565b010190565b906000918290604093848251116000146106d9575060006105e06020928651918280926101d6565b039060025afa156106d4576000515b7f5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c936020600061066e7f363636363636363636363636363636363636363636363636363636363636363661064f85519882888a8c95189118878501610593565b0396610663601f19988981018352826100e9565b8451918280926101d6565b039060025afa156106d4576106b96000946106c3946106ad6020988851908651978894821891188b850191606093918352602083015260408201520190565b039081018452836100e9565b51918280926101d6565b039060025afa156106d45760005190565b610587565b929383959195935b86518510806107ac575b156107505761074a9061074361072461071e61071861070a8a8d610535565b516001600160f81b03191690565b60f81c90565b60ff1690565b61073d6107386107338a61055c565b6103ad565b610578565b906103c5565b1794610526565b936106e1565b9490919293506020935b86518510806107a3575b15610798576107929061074361078361071e61071861070a8a8d610535565b61073d6107386107338a61056a565b9361075a565b9295509250926105ef565b50828510610764565b50602085106106eb56fea264697066735822122063e3b9c4d5c02e73f041357aff53c5d78c66f60cc79b9b2df0a1fbf23fba7ff964736f6c63430008150033";

type JWTConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: JWTConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class JWT__factory extends ContractFactory {
  constructor(...args: JWTConstructorParams) {
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
      JWT & {
        deploymentTransaction(): ContractTransactionResponse;
      }
    >;
  }
  override connect(runner: ContractRunner | null): JWT__factory {
    return super.connect(runner) as JWT__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): JWTInterface {
    return new Interface(_abi) as JWTInterface;
  }
  static connect(address: string, runner?: ContractRunner | null): JWT {
    return new Contract(address, _abi, runner) as unknown as JWT;
  }
}
