import { Wallet, type TypedDataDomain, type TypedDataField } from 'ethers';

export namespace SignatureService {
  const DOMAIN: TypedDataDomain = {
    name: 'QuestSignature',
    version: '1',
    chainId: 42161,
  };

  const TYPES: Record<string, TypedDataField[]> = {
    QuestVerification: [
      { name: 'uuid', type: 'string' },
      { name: 'address', type: 'address' },
    ],
  };

  export const generateEIP712Signature = async (
    uuid: string,
    address: string
  ): Promise<string> => {
    try {
      const signingKey = process.env.PRIVATE_KEY;

      if (!signingKey) {
        throw new Error('Private key is required for signature generation');
      }

      const wallet = new Wallet(signingKey);

      const message = {
        uuid,
        address,
      };

      const signature = await wallet.signTypedData(DOMAIN, TYPES, message);

      return signature;
    } catch (error) {
      console.error('Error generating EIP-712 signature:', error);
      throw error;
    }
  };

  export const verifyEIP712Signature = async (
    signature: string,
    uuid: string,
    address: string
  ): Promise<string> => {
    try {
      const { verifyTypedData } = await import('ethers');

      const message = {
        uuid,
        address,
      };

      const recoveredAddress = verifyTypedData(
        DOMAIN,
        TYPES,
        message,
        signature
      );

      return recoveredAddress;
    } catch (error) {
      console.error('Error verifying EIP-712 signature:', error);
      throw error;
    }
  };

  export const getEIP712Config = () => {
    return {
      domain: DOMAIN,
      types: TYPES,
    };
  };
}
