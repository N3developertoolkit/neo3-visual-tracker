using System;
using System.ComponentModel;
using System.Numerics;
using Neo.SmartContract.Framework;
using Neo.SmartContract.Framework.Services.Neo;
using Neo.SmartContract.Framework.Services.System;

// Note, this contract is a port of safe-remote-purchase.py

//       originally written by Joe Stewart (aka hal0x2328)
//       https://github.com/Splyse/MCT/blob/master/safe-remote-purchase.py
// Ported from python to C# by Harry Pierson (aka DevHawk)
namespace SafePurchaseSample
{
    public enum SaleState : byte
    {
        New,
        AwaitingShipment,
        ShipmentConfirmed
    }

    public class SaleInfo
    {
        public byte[] Id;

        public byte[] Seller;

        public byte[] Buyer;

        public string Description;

        public BigInteger Price;

        public SaleState State;
    }

    [ManifestExtra("Author", "Harry Pierson")]
    [ManifestExtra("Email", "hpierson@ngd.neo.org")]
    [ManifestExtra("Description", "This is an example contract")]
    [Features(ContractFeatures.HasStorage | ContractFeatures.Payable)]
    public class SafePurchaseContract : SmartContract
    {
        // Note, using GAS instead of NEO due to transfer issue in preview 3 debugger
        //       using reversed GAS scriptHash string to work around issue in preview 3 HexToBytes

        static readonly byte[]
            GasToken =
                "0xbcaf41d684c7d4ad6ee0d99da9707b9d1f0c8e66".HexToBytes();

        static readonly byte[]
            Owner = "NWoLj8g5Hr43B3CDkpMKDJFfBV3p6NM732".ToScriptHash();

        const string SALES_MAP_NAME = nameof(SafePurchaseContract);

        [DisplayName("NewSale")]
        public static event Action<byte[], byte[], string, BigInteger>
            OnNewSale;

        [DisplayName("SaleUpdated")]
        public static event Action<byte[], byte[], byte> OnSaleUpdated;

        [DisplayName("SaleCompleted")]
        public static event Action<byte[]> OnSaleCompleted;

        public static bool
        CreateSale(byte[] saleId, BigInteger price, string description)
        {
            if (price <= 0)
                throw new Exception("price must be larger than zero");
            if (saleId.Length != 16)
                throw new Exception("sale ID must be 16 bytes long");
            if (GetSale(saleId) != null)
                throw new Exception("sale with that ID already exists");

            var notifications = Runtime.GetNotifications();
            if (notifications.Length == 0)
                throw new Exception("Contribution transaction not found.");

            BigInteger gas = 0;
            for (int i = 0; i < notifications.Length; i++)
            {
                gas += GetTransactionAmount(notifications[i], GasToken);
            }

            if (gas != price * 2)
                throw new Exception("seller deposit must be 2x price");

            var tx = (Transaction) ExecutionEngine.ScriptContainer;
            var saleInfo =
                new SaleInfo()
                {
                    Id = saleId,
                    Seller = tx.Sender,
                    Description = description,
                    Price = price,
                    State = SaleState.New
                };

            SaveSale (saleInfo);
            OnNewSale(saleInfo.Id,
            saleInfo.Seller,
            saleInfo.Description,
            saleInfo.Price);
            return true;
        }

        public static bool BuyerDeposit(byte[] saleId)
        {
            var saleInfo = GetSale(saleId);
            if (saleInfo == null) throw new Exception("could not find sale");
            if (saleInfo.State != SaleState.New)
                throw new Exception("sale state incorrect");

            var notifications = Runtime.GetNotifications();
            if (notifications.Length == 0)
                throw new Exception("Contribution transaction not found.");

            BigInteger gas = 0;
            for (int i = 0; i < notifications.Length; i++)
            {
                gas += GetTransactionAmount(notifications[i], GasToken);
            }

            if (gas != saleInfo.Price * 2)
                throw new Exception("buyer deposit must be 2x price");

            var tx = (Transaction) ExecutionEngine.ScriptContainer;
            saleInfo.Buyer = tx.Sender;
            saleInfo.State = SaleState.AwaitingShipment;

            SaveSale (saleInfo);
            OnSaleUpdated(saleInfo.Id, saleInfo.Buyer, (byte) saleInfo.State);
            return true;
        }

        public static bool ConfirmShipment(byte[] saleId)
        {
            var saleInfo = GetSale(saleId);
            if (saleInfo == null) throw new Exception("could not find sale");
            if (saleInfo.State != SaleState.AwaitingShipment)
                throw new Exception("sale state incorrect");

            if (saleInfo.Buyer == null)
                throw new Exception("buyer not specified");

            if (!Runtime.CheckWitness(saleInfo.Seller))
                throw new Exception("must be seller to confirm shipment");

            saleInfo.State = SaleState.ShipmentConfirmed;

            SaveSale (saleInfo);
            OnSaleUpdated(saleInfo.Id, null, (byte) saleInfo.State);
            return true;
        }

        public static bool ConfirmReceived(byte[] saleId)
        {
            var saleInfo = GetSale(saleId);
            if (saleInfo == null) throw new Exception("could not find sale");
            if (saleInfo.State != SaleState.ShipmentConfirmed)
                throw new Exception("sale state incorrect");

            if (!Runtime.CheckWitness(saleInfo.Buyer))
                throw new Exception("must be buyer to confirm receipt");

            Contract
                .Call(GasToken,
                "transfer",
                new object[] {
                    ExecutionEngine.ExecutingScriptHash,
                    saleInfo.Buyer,
                    saleInfo.Price
                });
            Contract
                .Call(GasToken,
                "transfer",
                new object[] {
                    ExecutionEngine.ExecutingScriptHash,
                    saleInfo.Seller,
                    saleInfo.Price * 3
                });

            DeleteSale (saleInfo);
            OnSaleCompleted(saleInfo.Id);
            return true;
        }

        private static SaleInfo GetSale(byte[] saleId)
        {
            if (saleId.Length != 16)
            {
                throw new ArgumentException("The saleId parameter MUST be 16 bytes long.",
                    nameof(saleId));
            }

            var salesMap = Storage.CurrentContext.CreateMap(SALES_MAP_NAME);
            var result = salesMap.Get(saleId);
            return result == null ? null : result.Deserialize() as SaleInfo;
        }

        private static void SaveSale(SaleInfo saleInfo)
        {
            var salesMap = Storage.CurrentContext.CreateMap(SALES_MAP_NAME);
            salesMap.Put(saleInfo.Id, saleInfo.Serialize());
        }

        private static void DeleteSale(SaleInfo saleInfo)
        {
            var salesMap = Storage.CurrentContext.CreateMap(SALES_MAP_NAME);
            salesMap.Delete(saleInfo.Id);
        }

        private static BigInteger
        GetTransactionAmount(Notification notification, byte[] scriptHash)
        {
            if (notification.ScriptHash != scriptHash) return 0;

            // Only allow Transfer notifications
            if (notification.EventName != "Transfer") return 0;
            var state = notification.State;

            // Checks notification format
            if (state.Length != 3) return 0;

            // Check dest
            if ((byte[]) state[1] != ExecutionEngine.ExecutingScriptHash)
                return 0;

            // Amount
            var amount = (BigInteger) state[2];
            if (amount < 0) return 0;
            return amount;
        }

        public static bool Update(byte[] script, string manifest)
        {
            if (!IsOwner()) throw new Exception("No authorization.");

            // Check empty
            if (script.Length == 0 && manifest.Length == 0) return false;
            Contract.Update (script, manifest);
            return true;
        }

        public static bool Destroy()
        {
            if (!IsOwner()) throw new Exception("No authorization.");
            Contract.Destroy();
            return true;
        }

        private static bool IsOwner() => Runtime.CheckWitness(Owner);
    }
}
